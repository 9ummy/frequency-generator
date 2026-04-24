'use client';

import { useRouter } from 'next/navigation';
import { Decorations } from '@/components/Decorations';
import { StatusBar } from '@/components/StatusBar';

export default function MainPage() {
  const router = useRouter();

  return (
    <div className="app-frame bg-cream-dots">
      <StatusBar />
      <Decorations variant="main" />

      {/* 타이틀 — 화면 정중앙 */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 28, right: 28, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <span className="yellow-pill" style={{ fontSize: 11 }}>★ PHOTO IN, FREQUENCY OUT</span>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: 'var(--ink)',
              margin: '16px 0 0',
              lineHeight: 0.88,
              letterSpacing: '-3.5px',
            }}
          >
            주파수<br />생성기
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              opacity: 0.55,
              margin: '20px 0 0',
              lineHeight: 1.5,
            }}
          >
            AI가 사진 분위기를 읽고<br />나만의 주파수를 만들어요
          </p>
        </div>
      </div>

      {/* 시작 버튼 */}
      <div className="absolute z-20" style={{ bottom: 56, left: 28, right: 28 }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'var(--yellow)',
              border: '2.5px solid var(--ink)',
              borderRadius: 999,
              transform: 'translate(5px, 5px)',
            }}
          />
          <button
            onClick={() => router.push('/upload')}
            style={{
              position: 'relative',
              width: '100%',
              background: 'var(--ink)',
              border: '2.5px solid var(--ink)',
              borderRadius: 999,
              padding: '18px 0',
              fontSize: 16,
              fontWeight: 900,
              color: 'var(--yellow)',
              letterSpacing: 1.5,
            }}
          >
            ✦ 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
