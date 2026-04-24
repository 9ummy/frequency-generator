'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBar } from '@/components/StatusBar';

type Step = 1 | 2 | 3;

export default function UploadPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImagePreview(reader.result as string);
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCompressedImage(canvas.toDataURL('image/jpeg', 0.75));
        setIsProcessing(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function finish() {
    if (!compressedImage) return;
    sessionStorage.setItem('uploadedImage', compressedImage);
    sessionStorage.setItem('customTitle', title);
    sessionStorage.setItem('description', description);
    sessionStorage.setItem('intent', description || title);
    router.push('/result');
  }

  const stepLabels = ['사진', '제목', '설명'];

  return (
    <div className="app-frame bg-cream-dots" style={{ display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      {/* 진행 바 */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          paddingTop: 50, paddingLeft: 28, paddingRight: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <button
            onClick={() => step === 1 ? router.push('/') : setStep((step - 1) as Step)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--yellow)', border: '2px solid var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: 'var(--ink)', flexShrink: 0,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, display: 'flex', gap: 5 }}>
            {([1, 2, 3] as Step[]).map(n => (
              <div
                key={n}
                style={{
                  flex: 1, height: 5, borderRadius: 999,
                  background: n <= step ? 'var(--ink)' : 'rgba(26,22,18,0.15)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink)', opacity: 0.45, width: 28, textAlign: 'right' }}>
            {step}/3
          </span>
        </div>

        {/* ─── Step 1: 사진 ─── */}
        {step === 1 && (
          <div>
            <span className="yellow-pill" style={{ fontSize: 11 }}>★ STEP 1</span>
            <h2
              style={{
                fontSize: 36, fontWeight: 900, color: 'var(--ink)',
                margin: '12px 0 24px', lineHeight: 1.05, letterSpacing: '-1.5px',
              }}
            >
              사진을<br />던져봐
            </h2>

            <div
              onClick={() => fileInput.current?.click()}
              style={{
                aspectRatio: imagePreview ? '16/9' : '4/3',
                border: imagePreview ? '2.5px solid var(--ink)' : '2.5px dashed rgba(26,22,18,0.35)',
                borderRadius: 12,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: imagePreview ? 'var(--ink)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                transition: 'aspect-ratio 0.3s',
              }}
            >
              {isProcessing ? (
                <div
                  className="spinner"
                  style={{
                    width: 32, height: 32,
                    border: '3px solid rgba(26,22,18,0.15)',
                    borderTopColor: 'var(--ink)', borderRadius: '50%',
                  }}
                />
              ) : imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute', bottom: 10, right: 10,
                      background: 'var(--yellow)', border: '1.5px solid var(--ink)',
                      borderRadius: 999, padding: '3px 10px',
                      fontSize: 11, fontWeight: 900, color: 'var(--ink)',
                    }}
                  >
                    탭해서 변경
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'var(--yellow)', border: '2px solid var(--ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, fontWeight: 200, color: 'var(--ink)',
                      marginBottom: 14,
                    }}
                  >
                    +
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>탭해서 사진 선택</p>
                  <p style={{ fontSize: 11, color: 'var(--ink)', opacity: 0.45, margin: '5px 0 0', fontWeight: 600 }}>
                    JPG · PNG · HEIC
                  </p>
                </>
              )}
            </div>

            {compressedImage && (
              <button
                onClick={() => setStep(2)}
                className="shadow-ink-md"
                style={{
                  width: '100%', marginTop: 20,
                  background: 'var(--ink)', border: '2.5px solid var(--ink)',
                  borderRadius: 999, padding: '16px 0',
                  fontSize: 15, fontWeight: 900, color: 'var(--yellow)',
                  letterSpacing: 1,
                }}
              >
                다음 →
              </button>
            )}
          </div>
        )}

        {/* ─── Step 2: 제목 ─── */}
        {step === 2 && (
          <div>
            <span className="yellow-pill" style={{ fontSize: 11 }}>★ STEP 2</span>
            <h2
              style={{
                fontSize: 36, fontWeight: 900, color: 'var(--ink)',
                margin: '12px 0 6px', lineHeight: 1.05, letterSpacing: '-1.5px',
              }}
            >
              이 주파수의<br />이름은?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.5, margin: '0 0 32px', fontWeight: 600 }}>
              나만의 주파수 이름을 지어줘
            </p>

            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 월요일 아침의 커피향"
              autoFocus
              maxLength={30}
              style={{
                width: '100%', display: 'block',
                background: 'transparent', border: 'none',
                borderBottom: '2.5px solid var(--ink)', outline: 'none',
                fontSize: 22, fontWeight: 800, color: 'var(--ink)',
                padding: '8px 0 10px', fontFamily: 'inherit', letterSpacing: '-0.5px',
              }}
            />
            <p
              style={{
                fontSize: 11, color: 'var(--ink)', opacity: 0.35,
                margin: '6px 0 0', fontWeight: 600, textAlign: 'right',
              }}
            >
              {title.length}/30
            </p>

            <button
              onClick={() => setStep(3)}
              disabled={!title.trim()}
              className={title.trim() ? 'shadow-ink-md' : ''}
              style={{
                width: '100%', marginTop: 36, padding: '16px 0',
                background: title.trim() ? 'var(--ink)' : 'rgba(26,22,18,0.15)',
                border: '2.5px solid',
                borderColor: title.trim() ? 'var(--ink)' : 'rgba(26,22,18,0.2)',
                borderRadius: 999, fontSize: 15, fontWeight: 900,
                color: title.trim() ? 'var(--yellow)' : 'rgba(26,22,18,0.35)',
                transition: 'all 0.2s',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              다음 →
            </button>
          </div>
        )}

        {/* ─── Step 3: 설명 ─── */}
        {step === 3 && (
          <div>
            <span className="yellow-pill" style={{ fontSize: 11 }}>★ STEP 3</span>
            <h2
              style={{
                fontSize: 36, fontWeight: 900, color: 'var(--ink)',
                margin: '12px 0 6px', lineHeight: 1.05, letterSpacing: '-1.5px',
              }}
            >
              한 줄 설명
              <span style={{ opacity: 0.35, fontSize: 22, fontWeight: 800 }}> (선택)</span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.5, margin: '0 0 32px', fontWeight: 600 }}>
              어떤 분위기인지 알려주면 더 잘 만들어줘
            </p>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예: 비 오는 날 집에서 듣고 싶은"
              autoFocus
              maxLength={60}
              rows={3}
              style={{
                width: '100%', display: 'block', resize: 'none',
                background: 'transparent', border: 'none',
                borderBottom: '2.5px solid var(--ink)', outline: 'none',
                fontSize: 18, fontWeight: 700, color: 'var(--ink)',
                padding: '8px 0 10px', fontFamily: 'inherit', lineHeight: 1.7,
              }}
            />
            <p
              style={{
                fontSize: 11, color: 'var(--ink)', opacity: 0.35,
                margin: '6px 0 0', fontWeight: 600, textAlign: 'right',
              }}
            >
              {description.length}/60
            </p>

            <div style={{ position: 'relative', marginTop: 40 }}>
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'var(--hot-pink)',
                  border: '2.5px solid var(--ink)',
                  borderRadius: 999,
                  transform: 'translate(5px, 5px)',
                }}
              />
              <button
                onClick={finish}
                style={{
                  position: 'relative', width: '100%',
                  background: 'var(--yellow)', border: '2.5px solid var(--ink)',
                  borderRadius: 999, padding: '18px 0',
                  fontSize: 15, fontWeight: 900, color: 'var(--ink)',
                  letterSpacing: 1,
                }}
              >
                ✦ 주파수 생성하기
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
