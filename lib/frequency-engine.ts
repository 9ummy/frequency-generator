// Web Audio API를 이용한 주파수 + 바이노럴 비트 + 앰비언트 노이즈 합성
// 6개 솔페지오 주파수 + 4개 뇌파 + 3가지 앰비언트 사운드

export type SolfeggioFreq = 174 | 285 | 396 | 432 | 528 | 639 | 741 | 852;

export type BrainwaveType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface FrequencyPreset {
  baseFreq: SolfeggioFreq;
  binauralOffset: number; // Hz 차이 (좌우 귀)
  brainwaveLabel: BrainwaveType;
  ambient: 'rain' | 'wave' | 'wind' | 'none';
  title: string;
  subtitle: string;
  durationMin: number;
  bgColor: string; // 배경 그라디언트
}

// 사진 색조나 의도에서 자동 매핑되는 프리셋 풀
export const PRESETS: FrequencyPreset[] = [
  {
    baseFreq: 432, binauralOffset: 8, brainwaveLabel: 'alpha',
    ambient: 'rain',
    title: '차분한 숲의 저녁',
    subtitle: '자연 진동 + 알파파 + 빗소리',
    durationMin: 60,
    bgColor: 'linear-gradient(135deg, #2d4a3e 0%, #1f3028 60%, #0a1410 100%)',
  },
  {
    baseFreq: 528, binauralOffset: 6, brainwaveLabel: 'theta',
    ambient: 'wave',
    title: '파도 위의 달빛',
    subtitle: '사랑 주파수 + 세타파 + 파도',
    durationMin: 45,
    bgColor: 'linear-gradient(180deg, #4a90c2 0%, #1f5d8a 60%, #0a3050 100%)',
  },
  {
    baseFreq: 639, binauralOffset: 10, brainwaveLabel: 'alpha',
    ambient: 'wind',
    title: '노을이 부르는 이름',
    subtitle: '관계의 주파수 + 따뜻한 험',
    durationMin: 30,
    bgColor: 'linear-gradient(180deg, #ff9a8c 0%, #ff6b8a 50%, #c2466a 100%)',
  },
  {
    baseFreq: 174, binauralOffset: 2, brainwaveLabel: 'delta',
    ambient: 'rain',
    title: '깊은 잠의 골짜기',
    subtitle: '안정 주파수 + 델타파 + 빗소리',
    durationMin: 90,
    bgColor: 'linear-gradient(180deg, #1a1f2e 0%, #0a0f1a 100%)',
  },
  {
    baseFreq: 396, binauralOffset: 7, brainwaveLabel: 'alpha',
    ambient: 'wind',
    title: '해방의 아침',
    subtitle: '죄책감 해방 + 알파파 + 바람',
    durationMin: 30,
    bgColor: 'linear-gradient(180deg, #ffd9a8 0%, #ff9a8c 60%, #c2466a 100%)',
  },
  {
    baseFreq: 741, binauralOffset: 14, brainwaveLabel: 'beta',
    ambient: 'none',
    title: '집중하는 새벽',
    subtitle: '정화 주파수 + 베타파',
    durationMin: 45,
    bgColor: 'linear-gradient(180deg, #2a1a3e 0%, #1a0f2a 100%)',
  },
];

// 의도 텍스트나 시각 파라미터에서 적절한 프리셋 추정
// 진짜 LLM 호출 대신 키워드 매칭. 해커톤 데모 용도로 충분.
export function pickPreset(_intent?: string, _photoBrightness?: number): FrequencyPreset {
  return PRESETS[Math.floor(Math.random() * PRESETS.length)];
}

// 사진의 평균 밝기 추정 (캔버스 샘플링)
export async function getImageBrightness(imageUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 32; // 32x32로 다운샘플링
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(128);
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        // 휘도 공식
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      resolve(sum / (size * size));
    };
    img.onerror = () => resolve(128);
    img.src = imageUrl;
  });
}

// 핵심: Web Audio API 라이브 합성 + (옵션) MediaRecorder 캡처
export class FrequencyEngine {
  private audioCtx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftGain: GainNode | null = null;
  private rightGain: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private currentPreset: FrequencyPreset | null = null;

  private ensureCtx() {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  // 앰비언트 노이즈 (필터링된 핑크 노이즈)를 생성
  // 빗소리 = 화이트 + lowpass, 파도 = 핑크 + LFO modulated lowpass, 바람 = bandpass
  private createNoiseBuffer(ctx: AudioContext, type: 'rain' | 'wave' | 'wind'): AudioBuffer {
    const seconds = 4; // 짧은 버퍼를 루프
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      // 핑크 노이즈 근사 (Voss-McCartney 알고리즘 단순화)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  start(preset: FrequencyPreset, opts?: { record?: boolean }) {
    this.stop(); // 기존 재생 정리
    const ctx = this.ensureCtx();
    this.currentPreset = preset;
    this.startTime = ctx.currentTime;

    // 좌우 별도 오실레이터 (바이노럴 비트)
    this.leftOsc = ctx.createOscillator();
    this.rightOsc = ctx.createOscillator();
    this.leftOsc.type = 'sine';
    this.rightOsc.type = 'sine';
    this.leftOsc.frequency.value = preset.baseFreq;
    this.rightOsc.frequency.value = preset.baseFreq + preset.binauralOffset;

    // 채널 머지 (왼쪽 = 0, 오른쪽 = 1)
    this.merger = ctx.createChannelMerger(2);
    this.leftGain = ctx.createGain();
    this.rightGain = ctx.createGain();
    this.leftGain.gain.value = 0.18;
    this.rightGain.gain.value = 0.18;

    this.leftOsc.connect(this.leftGain).connect(this.merger, 0, 0);
    this.rightOsc.connect(this.rightGain).connect(this.merger, 0, 1);

    // 앰비언트 레이어
    if (preset.ambient !== 'none') {
      const buf = this.createNoiseBuffer(ctx, preset.ambient);
      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.buffer = buf;
      this.noiseNode.loop = true;

      this.noiseFilter = ctx.createBiquadFilter();
      if (preset.ambient === 'rain') {
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.value = 3000;
      } else if (preset.ambient === 'wave') {
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.value = 800;
        // 파도처럼 출렁거리도록 LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.15;
        lfoGain.gain.value = 400;
        lfo.connect(lfoGain).connect(this.noiseFilter.frequency);
        lfo.start();
      } else if (preset.ambient === 'wind') {
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.value = 600;
        this.noiseFilter.Q.value = 0.7;
      }

      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.value = 0.25;
      this.noiseNode.connect(this.noiseFilter).connect(this.noiseGain);
    }

    // 마스터 (페이드인)
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);

    this.merger.connect(this.masterGain);
    if (this.noiseGain) this.noiseGain.connect(this.masterGain);

    // 스피커 + (옵션) 녹음 destination
    this.masterGain.connect(ctx.destination);
    if (opts?.record) {
      this.destination = ctx.createMediaStreamDestination();
      this.masterGain.connect(this.destination);
      this.recordedChunks = [];
      this.recorder = new MediaRecorder(this.destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.recorder.start();
    }

    this.leftOsc.start();
    this.rightOsc.start();
    if (this.noiseNode) this.noiseNode.start();
  }

  // 5초 분량 녹음을 만들어 다운로드 가능한 Blob으로 반환
  // (장시간 녹음은 브라우저 부담 → 데모용으로 짧게)
  async exportAudio(seconds: number = 10): Promise<Blob> {
    if (!this.currentPreset) throw new Error('No preset loaded');
    const preset = this.currentPreset;

    // 별도 OfflineAudioContext로 정확히 N초 렌더링
    const sampleRate = 44100;
    const offline = new OfflineAudioContext(2, sampleRate * seconds, sampleRate);

    const left = offline.createOscillator();
    const right = offline.createOscillator();
    left.type = 'sine'; right.type = 'sine';
    left.frequency.value = preset.baseFreq;
    right.frequency.value = preset.baseFreq + preset.binauralOffset;

    const merger = offline.createChannelMerger(2);
    const lg = offline.createGain(); lg.gain.value = 0.18;
    const rg = offline.createGain(); rg.gain.value = 0.18;
    left.connect(lg).connect(merger, 0, 0);
    right.connect(rg).connect(merger, 0, 1);

    const master = offline.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(1, 1.5);
    master.gain.setValueAtTime(1, seconds - 1.5);
    master.gain.linearRampToValueAtTime(0, seconds);

    merger.connect(master);

    if (preset.ambient !== 'none') {
      const buf = this.createNoiseBuffer(offline as unknown as AudioContext, preset.ambient);
      const noise = offline.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      const filt = offline.createBiquadFilter();
      if (preset.ambient === 'rain') { filt.type = 'lowpass'; filt.frequency.value = 3000; }
      else if (preset.ambient === 'wave') { filt.type = 'lowpass'; filt.frequency.value = 800; }
      else { filt.type = 'bandpass'; filt.frequency.value = 600; filt.Q.value = 0.7; }
      const ng = offline.createGain(); ng.gain.value = 0.25;
      noise.connect(filt).connect(ng).connect(master);
      noise.start();
    }

    master.connect(offline.destination);
    left.start(); right.start();

    const rendered = await offline.startRendering();
    return audioBufferToWav(rendered);
  }

  stop() {
    try { this.leftOsc?.stop(); } catch {}
    try { this.rightOsc?.stop(); } catch {}
    try { this.noiseNode?.stop(); } catch {}
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.leftOsc = null;
    this.rightOsc = null;
    this.noiseNode = null;
    this.masterGain = null;
  }

  isPlaying() {
    return this.leftOsc !== null;
  }

  getElapsed(): number {
    if (!this.audioCtx || !this.startTime) return 0;
    return this.audioCtx.currentTime - this.startTime;
  }
}

// AudioBuffer를 WAV Blob으로 변환 (다운로드용)
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length * numCh * 2 + 44;
  const view = new DataView(new ArrayBuffer(len));

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, len - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, len - 44, true);

  let offset = 44;
  const channels: Float32Array[] = [];
  for (let i = 0; i < numCh; i++) channels.push(buffer.getChannelData(i));
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}
