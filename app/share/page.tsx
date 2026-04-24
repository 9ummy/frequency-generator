"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Decorations } from "@/components/Decorations";
import { StatusBar } from "@/components/StatusBar";
import { type FrequencyPreset } from "@/lib/frequency-engine";
import { composeThumbnail } from "@/lib/thumbnail";

export default function SharePage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const img = sessionStorage.getItem("uploadedImage");
    const presetStr = sessionStorage.getItem("currentPreset");
    if (!img || !presetStr) {
      router.replace("/");
      return;
    }
    const p = JSON.parse(presetStr) as FrequencyPreset;
    const savedTitle = sessionStorage.getItem("customTitle") || "";
    setImageUrl(img);
    setPreset(p);
    setCustomTitle(savedTitle);

    // 썸네일 미리 합성 (유저 타이틀 우선)
    const displayTitle = savedTitle || p.title;
    composeThumbnail(img, displayTitle, `${p.baseFreq}Hz · ${p.durationMin}분`).then(
      (blob) => {
        setThumbnailBlob(blob);
        setThumbnailUrl(URL.createObjectURL(blob));
      },
    );

    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportThumbnail() {
    if (!thumbnailBlob || !preset) return;
    const title = customTitle || preset.title;
    downloadBlob(thumbnailBlob, `${title}_thumbnail.png`);
  }

  async function shareNative() {
    if (!thumbnailBlob || !preset) return;
    setExporting("share");
    const title = customTitle || preset.title;
    try {
      const file = new File([thumbnailBlob], `${title}.png`, {
        type: "image/png",
      });
      const shareData: ShareData = {
        title,
        text: `${title} · ${preset.baseFreq}Hz`,
      };
      if (navigator.canShare?.({ files: [file] })) {
        shareData.files = [file];
      }
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        downloadBlob(thumbnailBlob, `${title}.png`);
      }
    } catch (e) {
      // 사용자 취소는 무시
    } finally {
      setExporting(null);
    }
  }

  async function copyLink() {
    if (!imageUrl || !preset) return;
    setIsSaving(true);
    try {
      const title = customTitle || preset.title;
      const description = sessionStorage.getItem('description') || '';
      const res = await fetch('/api/save-frequency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageUrl, title, description, preset }),
      });
      const { id, error } = await res.json();
      if (error) throw new Error(error);
      const url = `${window.location.origin}/view/${id}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '링크 생성에 실패했어요');
    } finally {
      setIsSaving(false);
    }
  }

  if (!imageUrl || !preset) return null;

  return (
    <div className="app-frame bg-cream-dots fade-in">
      <StatusBar />
      <Decorations variant="share" />

      {/* 에러 모달 */}
      {errorMsg && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: 'rgba(26,22,18,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 32px',
          }}
          onClick={() => setErrorMsg(null)}
        >
          <div
            className="shadow-ink-lg"
            style={{
              background: '#fff',
              border: '2.5px solid var(--ink)',
              borderRadius: 16,
              padding: '28px 24px 20px',
              width: '100%',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span style={{ fontSize: 24, color: 'var(--yellow)' }}>!</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', margin: '0 0 6px' }}>오류 발생</p>
            <p style={{ fontSize: 12, color: 'var(--ink)', opacity: 0.6, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.5 }}>{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="shadow-ink-sm"
              style={{ background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '10px 32px', fontSize: 13, fontWeight: 900, color: 'var(--yellow)' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 — flow 레이아웃 */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          paddingTop: 54,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 32,
        }}
      >
        {/* 16:9 썸네일 카드 */}
        <div
          style={{ position: "relative", aspectRatio: "16 / 9", marginTop: 12 }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--hot-pink)",
              border: "2px solid var(--ink)",
              borderRadius: 6,
              transform: "rotate(-2deg) translate(5px, 5px)",
            }}
          />
          <div
            className="shadow-ink-lg"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "#fff",
              border: "2px solid var(--ink)",
              borderRadius: 4,
              padding: 6,
              overflow: "hidden",
            }}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="thumbnail"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 2,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#f0ebe0",
                  borderRadius: 2,
                }}
              />
            )}
          </div>
          <div
            className="shadow-ink-sm"
            style={{
              position: "absolute",
              top: -12,
              right: -10,
              background: "var(--yellow)",
              padding: "4px 11px",
              borderRadius: 999,
              transform: "rotate(8deg)",
              border: "2px solid var(--ink)",
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "var(--ink)",
                letterSpacing: 0.5,
              }}
            >
              ★ READY
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="shadow-ink-sm"
            style={{
              position: "absolute",
              top: -12,
              left: -8,
              background: "#fff",
              border: "2px solid var(--ink)",
              borderRadius: 999,
              padding: "4px 11px",
              zIndex: 2,
            }}
          >
            <span
              style={{ fontSize: 12, fontWeight: 900, color: "var(--ink)" }}
            >
              ←
            </span>
          </button>
        </div>

        {/* 다운로드/공유 옵션 */}
        <div style={{ marginTop: 24 }}>
          <span className="yellow-pill">★ 어떻게 가져갈까?</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <ShareCard label="썸네일" sub="PNG · 1280×720" color="#fff200" onClick={exportThumbnail} />
            <ShareCard label="공유" sub="앱으로 보내기" color="#1a1612" textColor="#fff200" icon="↑" loading={exporting === 'share'} onClick={shareNative} />
          </div>
        </div>

        {/* 링크 복사 */}
        <div style={{ position: 'relative', marginTop: 20 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--yellow)', border: '2.5px solid var(--ink)', borderRadius: 12, transform: 'translate(4px, 4px)' }} />
          <button
            onClick={copyLink}
            disabled={isSaving}
            style={{
              position: 'relative', width: '100%',
              background: shareUrl ? 'var(--forest)' : 'var(--ink)',
              border: '2.5px solid var(--ink)',
              borderRadius: 12, padding: '14px 0',
              fontSize: 14, fontWeight: 900,
              color: shareUrl ? '#fff' : 'var(--yellow)',
              letterSpacing: 0.5,
            }}
          >
            {isSaving ? '링크 생성 중...' : shareUrl ? '✓ 링크 복사됨!' : '🔗 링크 복사하기'}
          </button>
        </div>
        {shareUrl && (
          <p style={{ fontSize: 11, color: 'var(--ink)', marginTop: 8, textAlign: 'center', opacity: 0.5, fontWeight: 600, wordBreak: 'break-all' }}>
            {shareUrl}
          </p>
        )}

        {/* PRO 박스 */}
        {/*<div
          className="shadow-pink-md"
          style={{
            marginTop: 20,
            background: 'var(--ink)',
            borderRadius: 14,
            padding: '12px 14px',
            transform: 'rotate(-1deg)',
          }}
        >
          <p style={{ fontSize: 9, color: 'var(--yellow)', margin: 0, letterSpacing: 1, fontWeight: 800 }}>★ PRO</p>
          <p style={{ fontSize: 12, color: '#fff', margin: '2px 0 0', fontWeight: 700 }}>
            워터마크 제거 · 4K · 무제한 길이 · MP4 영상 출력
          </p>
        </div>*/}
      </div>
    </div>
  );
}

function ShareCard({
  label,
  sub,
  color,
  textColor = "var(--ink)",
  loading,
  onClick,
  wide,
  icon = '↓',
}: {
  label: string;
  sub: string;
  color: string;
  textColor?: string;
  loading?: boolean;
  onClick: () => void;
  wide?: boolean;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="shadow-ink-sm"
      style={{
        background: "#fff",
        border: "2px solid var(--ink)",
        borderRadius: 12,
        padding: "12px 8px",
        textAlign: "center",
        gridColumn: wide ? "span 2" : undefined,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: color,
          margin: "0 auto 6px",
          border: "1.5px solid var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <div
            className="spinner"
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${textColor === "#fff200" ? "rgba(255,242,0,0.3)" : "rgba(26,22,18,0.3)"}`,
              borderTopColor: textColor,
              borderRadius: "50%",
            }}
          />
        ) : (
          <span style={{ fontSize: 16, color: textColor, fontWeight: 900 }}>
            {icon}
          </span>
        )}
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--ink)",
          margin: 0,
          fontWeight: 800,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 10,
          color: "#8a8580",
          margin: "1px 0 0",
          fontWeight: 600,
        }}
      >
        {sub}
      </p>
    </button>
  );
}
