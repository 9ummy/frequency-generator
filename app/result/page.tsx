'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Decorations } from '@/components/Decorations';
import { StatusBar } from '@/components/StatusBar';
import {
  FrequencyEngine,
  pickPreset,
  getImageBrightness,
  type FrequencyPreset,
} from '@/lib/frequency-engine';

export default function ResultPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState<FrequencyPreset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [customTitle, setCustomTitle] = useState('');
  const engineRef = useRef<FrequencyEngine | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    const img = sessionStorage.getItem('uploadedImage');
    const intent = sessionStorage.getItem('intent') || '';
    if (!img) {
      router.replace('/');
      return;
    }
    setImageUrl(img);
    setCustomTitle(sessionStorage.getItem('customTitle') || '');
    (async () => {
      const brightness = await getImageBrightness(img);
      const p = pickPreset(intent, brightness);
      setPreset(p);
      sessionStorage.setItem('currentPreset', JSON.stringify(p));
    })();
  }, [router]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, []);

  function togglePlay() {
    if (!preset) return;
    if (!engineRef.current) engineRef.current = new FrequencyEngine();
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    } else {
      engineRef.current.start(preset);
      setIsPlaying(true);
      const tick = () => {
        if (engineRef.current?.isPlaying()) {
          setElapsed(engineRef.current.getElapsed());
          tickRef.current = requestAnimationFrame(tick);
        }
      };
      tick();
    }
  }

  function regenerate() {
    if (!imageUrl) return;
    engineRef.current?.stop();
    setIsPlaying(false);
    setElapsed(0);
    const intent = sessionStorage.getItem('intent') || '';
    const seedRotate = ['집중', '명상', '잠', '사랑', '해방', '파도'];
    const newIntent = intent || seedRotate[Math.floor(Math.random() * seedRotate.length)];
    sessionStorage.setItem('intent', newIntent);
    getImageBrightness(imageUrl).then((b) => {
      const p = pickPreset(newIntent, b);
      setPreset(p);
      sessionStorage.setItem('currentPreset', JSON.stringify(p));
    });
  }

  function goShare() {
    engineRef.current?.stop();
    router.push('/share');
  }

  if (!imageUrl || !preset) {
    return (
      <div className="app-frame bg-pink-dots" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>주파수 분석 중...</p>
      </div>
    );
  }

  const totalSec = preset.durationMin * 60;
  const progress = Math.min(100, (elapsed / totalSec) * 100);
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = Math.floor(elapsed % 60);

  return (
    <div className="app-frame bg-pink-dots fade-in">
      <StatusBar />
      <Decorations variant="result" />

      {/* 스크롤 가능한 메인 콘텐츠 (flow 레이아웃) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          paddingTop: 54,
          paddingBottom: 172,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* 16:9 사진 카드 */}
        <div style={{ position: 'relative', aspectRatio: '16 / 9', marginTop: 12 }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--yellow)',
              border: '2px solid var(--ink)',
              borderRadius: 6,
              transform: 'rotate(-2deg) translate(5px, 5px)',
            }}
          />
          <div
            className="shadow-ink-lg"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: '#fff',
              border: '2px solid var(--ink)',
              borderRadius: 4,
              padding: 6,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `url(${imageUrl}) center/cover`,
                borderRadius: 2,
              }}
            />
          </div>
          {/* Hz 스티커 */}
          <div
            className="shadow-ink-sm"
            style={{
              position: 'absolute',
              top: -12, right: -10,
              background: 'var(--hot-pink)',
              padding: '4px 11px',
              borderRadius: 999,
              transform: 'rotate(8deg)',
              border: '2px solid var(--ink)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
              ★ {preset.baseFreq}Hz
            </span>
          </div>
          {/* Back 버튼 */}
          <button
            onClick={() => { engineRef.current?.stop(); router.push('/'); }}
            className="shadow-ink-sm"
            style={{
              position: 'absolute',
              top: -12, left: -8,
              background: 'var(--yellow)',
              border: '2px solid var(--ink)',
              borderRadius: 999,
              padding: '4px 11px',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink)' }}>←</span>
          </button>
        </div>

        {/* 제목 + 메타 — 크림 카드로 가독성 확보 */}
        <div
          style={{
            marginTop: 20,
            background: 'var(--cream)',
            border: '2.5px solid var(--ink)',
            borderRadius: 12,
            padding: '16px 18px 18px',
          }}
        >
          <span className="yellow-pill">★ YOUR FREQUENCY</span>

          <p
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '10px 0 0',
              lineHeight: 1.15,
              letterSpacing: '-1px',
            }}
          >
            {customTitle || preset.title}
          </p>

          <p style={{ fontSize: 13, color: 'var(--ink)', margin: '12px 0 0', fontWeight: 700 }}>
            {preset.subtitle}
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink)', margin: '2px 0 0', fontWeight: 700 }}>
            {preset.durationMin}분
          </p>
        </div>
      </div>

      {/* 플레이어 */}
      <div
        className="absolute z-10"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 16px) + 80px)', left: 24, right: 24 }}
      >
        <div
          className="shadow-yellow-md"
          style={{
            background: 'var(--ink)',
            border: '2px solid var(--ink)',
            borderRadius: 999,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--yellow)',
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ink)">
                <rect x="2" y="1" width="3" height="10" />
                <rect x="7" y="1" width="3" height="10" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ink)">
                <path d="M2 1l8 5-8 5z" />
              </svg>
            )}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--yellow)',
                  borderRadius: 999,
                  transition: 'width 0.2s linear',
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {elapsedMin}:{elapsedSec.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div
        className="absolute z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
          left: 24, right: 24,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={regenerate}
          className="shadow-ink-sm"
          style={{
            flex: 1,
            background: '#fff',
            border: '2px solid var(--ink)',
            borderRadius: 999,
            padding: 12,
            fontSize: 13,
            color: 'var(--ink)',
            fontWeight: 800,
          }}
        >
          ↻ 다시
        </button>
        <button
          onClick={goShare}
          className="shadow-ink-sm"
          style={{
            flex: 2,
            background: 'var(--hot-pink)',
            border: '2px solid var(--ink)',
            borderRadius: 999,
            padding: 12,
            fontSize: 13,
            color: '#fff',
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          공유하기 →
        </button>
      </div>
    </div>
  );
}
