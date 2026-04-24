'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Decorations } from '@/components/Decorations';
import { StatusBar } from '@/components/StatusBar';
import { FrequencyEngine, type FrequencyPreset } from '@/lib/frequency-engine';
import { composeThumbnail } from '@/lib/thumbnail';

export default function SharePage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    const img = sessionStorage.getItem('uploadedImage');
    const presetStr = sessionStorage.getItem('currentPreset');
    if (!img || !presetStr) {
      router.replace('/');
      return;
    }
    const p = JSON.parse(presetStr) as FrequencyPreset;
    setImageUrl(img);
    setPreset(p);

    // 썸네일 미리 합성
    composeThumbnail(img, p.title, `${p.baseFreq}Hz · ${p.durationMin}분`).then((blob) => {
      setThumbnailBlob(blob);
      setThumbnailUrl(URL.createObjectURL(blob));
    });

    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportAudio() {
    if (!preset) return;
    setExporting('audio');
    try {
      const engine = new FrequencyEngine();
      // 데모용 30초 (실제 60분은 브라우저 부담)
      const audioBlob = await engine.exportAudio(30);
      downloadBlob(audioBlob, `${preset.title}_${preset.baseFreq}Hz.wav`);
    } finally {
      setExporting(null);
    }
  }

  async function exportThumbnail() {
    if (!thumbnailBlob || !preset) return;
    downloadBlob(thumbnailBlob, `${preset.title}_thumbnail.png`);
  }

  async function shareNative() {
    if (!thumbnailBlob || !preset) return;
    setExporting('share');
    try {
      const file = new File([thumbnailBlob], `${preset.title}.png`, { type: 'image/png' });
      const shareData: ShareData = {
        title: preset.title,
        text: `${preset.title} · ${preset.baseFreq}Hz`,
      };
      if (navigator.canShare?.({ files: [file] })) {
        shareData.files = [file];
      }
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // 데스크탑 폴백 - 썸네일 다운로드
        downloadBlob(thumbnailBlob, `${preset.title}.png`);
      }
    } catch (e) {
      // 사용자 취소는 무시
    } finally {
      setExporting(null);
    }
  }

  if (!imageUrl || !preset) return null;

  return (
    <div className="app-frame bg-cream-dots fade-in">
      <StatusBar />
      <Decorations variant="share" />

      {/* 16:9 썸네일 미리보기 */}
      <div className="absolute z-10" style={{ top: 70, left: 18, right: 18 }}>
        <div className="relative" style={{ aspectRatio: '16 / 9' }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'var(--hot-pink)',
              border: '2px solid var(--ink)',
              borderRadius: 6,
              transform: 'rotate(-2deg) translate(5px, 5px)',
            }}
          />
          <div
            className="absolute inset-0 shadow-ink-lg"
            style={{
              background: '#fff',
              border: '2px solid var(--ink)',
              borderRadius: 4,
              padding: 6,
              overflow: 'hidden',
            }}
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#f0ebe0', borderRadius: 2 }} />
            )}
          </div>
          <div
            className="shadow-ink-sm"
            style={{
              position: 'absolute',
              top: -12,
              right: -10,
              background: 'var(--yellow)',
              padding: '4px 11px',
              borderRadius: 999,
              transform: 'rotate(8deg)',
              border: '2px solid var(--ink)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink)', letterSpacing: 0.5 }}>
              ★ READY
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="shadow-ink-sm"
            style={{
              position: 'absolute',
              top: -12,
              left: -8,
              background: '#fff',
              border: '2px solid var(--ink)',
              borderRadius: 999,
              padding: '4px 11px',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink)' }}>←</span>
          </button>
        </div>
      </div>

      {/* 다운로드/공유 옵션 */}
      <div className="absolute z-10" style={{ top: 270, left: 18, right: 18 }}>
        <span className="yellow-pill">★ 어떻게 가져갈까?</span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 12,
          }}
        >
          <ShareCard
            label="썸네일"
            sub="PNG · 1280×720"
            color="#fff200"
            onClick={exportThumbnail}
          />
          <ShareCard
            label="사운드"
            sub="WAV · 30초"
            color="#ff6b9d"
            loading={exporting === 'audio'}
            onClick={exportAudio}
          />
          <ShareCard
            label="공유"
            sub="앱으로 보내기"
            color="#1a1612"
            textColor="#fff200"
            loading={exporting === 'share'}
            onClick={shareNative}
            wide
          />
        </div>
      </div>

      {/* PRO 박스 */}
      <div
        className="absolute z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
          left: 18,
          right: 18,
        }}
      >
        <div
          className="shadow-pink-md"
          style={{
            background: 'var(--ink)',
            borderRadius: 14,
            padding: '12px 14px',
            transform: 'rotate(-1deg)',
          }}
        >
          <p style={{ fontSize: 9, color: 'var(--yellow)', margin: 0, letterSpacing: 1, fontWeight: 800 }}>
            ★ PRO
          </p>
          <p style={{ fontSize: 12, color: '#fff', margin: '2px 0 0', fontWeight: 700 }}>
            워터마크 제거 · 4K · 무제한 길이 · MP4 영상 출력
          </p>
        </div>
      </div>
    </div>
  );
}

function ShareCard({
  label,
  sub,
  color,
  textColor = 'var(--ink)',
  loading,
  onClick,
  wide,
}: {
  label: string;
  sub: string;
  color: string;
  textColor?: string;
  loading?: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="shadow-ink-sm"
      style={{
        background: '#fff',
        border: '2px solid var(--ink)',
        borderRadius: 12,
        padding: '12px 8px',
        textAlign: 'center',
        gridColumn: wide ? 'span 2' : undefined,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: color,
          margin: '0 auto 6px',
          border: '1.5px solid var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <div
            className="spinner"
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${textColor === '#fff200' ? 'rgba(255,242,0,0.3)' : 'rgba(26,22,18,0.3)'}`,
              borderTopColor: textColor,
              borderRadius: '50%',
            }}
          />
        ) : (
          <span style={{ fontSize: 16, color: textColor, fontWeight: 900 }}>↓</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink)', margin: 0, fontWeight: 800 }}>{label}</p>
      <p style={{ fontSize: 10, color: '#8a8580', margin: '1px 0 0', fontWeight: 600 }}>{sub}</p>
    </button>
  );
}
