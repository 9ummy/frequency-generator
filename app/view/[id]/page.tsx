'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type FrequencyRecord } from '@/lib/supabase';
import { StatusBar } from '@/components/StatusBar';
import { FrequencyEngine, type FrequencyPreset } from '@/lib/frequency-engine';

export default function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<FrequencyRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const engineRef = useRef<FrequencyEngine | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    supabase
      .from('frequencies')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return; }
        setRecord(data as FrequencyRecord);
      });
  }, [id]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, []);

  function togglePlay() {
    if (!record) return;
    const preset = record.preset as unknown as FrequencyPreset;
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

  if (notFound) {
    return (
      <div className="app-frame bg-cream-dots" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>주파수를 찾을 수 없어요</p>
        <button onClick={() => router.push('/')} style={{ background: 'var(--ink)', color: 'var(--yellow)', border: '2px solid var(--ink)', borderRadius: 999, padding: '10px 24px', fontWeight: 900, fontSize: 14 }}>
          홈으로
        </button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="app-frame bg-cream-dots" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid rgba(26,22,18,0.15)', borderTopColor: 'var(--ink)', borderRadius: '50%' }} />
      </div>
    );
  }

  const preset = record.preset as unknown as FrequencyPreset;
  const totalSec = preset.durationMin * 60;
  const progress = Math.min(100, (elapsed / totalSec) * 100);
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = Math.floor(elapsed % 60);

  return (
    <div className="app-frame bg-pink-dots fade-in">
      <StatusBar />

      <div style={{ position: 'relative', zIndex: 10, paddingTop: 54, paddingLeft: 24, paddingRight: 24, paddingBottom: 32 }}>
        {/* 사진 카드 */}
        <div style={{ position: 'relative', aspectRatio: '16 / 9', marginTop: 12 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--yellow)', border: '2px solid var(--ink)', borderRadius: 6, transform: 'rotate(-2deg) translate(5px, 5px)' }} />
          <div className="shadow-ink-lg" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', border: '2px solid var(--ink)', borderRadius: 4, padding: 6 }}>
            <img src={record.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2, display: 'block' }} />
          </div>
          <div className="shadow-ink-sm" style={{ position: 'absolute', top: -12, right: -10, background: 'var(--hot-pink)', padding: '4px 11px', borderRadius: 999, transform: 'rotate(8deg)', border: '2px solid var(--ink)', zIndex: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>★ {preset.baseFreq}Hz</span>
          </div>
        </div>

        {/* 제목 + 메타 */}
        <div style={{ marginTop: 20, background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 12, padding: '16px 18px 18px' }}>
          <span className="yellow-pill">★ FREQUENCY</span>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', margin: '10px 0 0', lineHeight: 1.15, letterSpacing: '-1px' }}>
            {record.title}
          </p>
          {record.description && (
            <p style={{ fontSize: 13, color: 'var(--ink)', margin: '8px 0 0', fontWeight: 600, opacity: 0.6 }}>{record.description}</p>
          )}
          <p style={{ fontSize: 13, color: 'var(--ink)', margin: '12px 0 0', fontWeight: 700 }}>{preset.subtitle}</p>
          <p style={{ fontSize: 13, color: 'var(--ink)', margin: '2px 0 0', fontWeight: 700 }}>{preset.durationMin}분</p>
        </div>

        {/* 플레이어 */}
        <div className="shadow-yellow-md" style={{ marginTop: 20, background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={togglePlay} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--yellow)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ink)"><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ink)"><path d="M2 1l8 5-8 5z" /></svg>
            )}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--yellow)', borderRadius: 999, transition: 'width 0.2s linear' }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {elapsedMin}:{elapsedSec.toString().padStart(2, '0')}
          </span>
        </div>

        {/* 나도 만들기 CTA */}
        <div style={{ position: 'relative', marginTop: 20 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--hot-pink)', border: '2.5px solid var(--ink)', borderRadius: 999, transform: 'translate(4px, 4px)' }} />
          <button
            onClick={() => router.push('/')}
            style={{ position: 'relative', width: '100%', background: 'var(--yellow)', border: '2.5px solid var(--ink)', borderRadius: 999, padding: '16px 0', fontSize: 14, fontWeight: 900, color: 'var(--ink)', letterSpacing: 1 }}
          >
            ✦ 나도 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
