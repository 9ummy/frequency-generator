// 사용자 사진 + AI 제목으로 16:9 썸네일을 캔버스에 그려 PNG Blob 반환

export async function composeThumbnail(
  imageUrl: string,
  title: string,
  meta: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1280;
    const H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas unavailable'));

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // cover로 사진 그리기
      const ratio = Math.max(W / img.width, H / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (W - w) / 2;
      const y = (H - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      // 하단 어두운 그라디언트 (텍스트 가독성)
      const grd = ctx.createLinearGradient(0, H * 0.4, 0, H);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // 제목
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 72px Pretendard, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 16;
      ctx.fillText(title, 60, H - 110);

      // 메타데이터
      ctx.shadowBlur = 8;
      ctx.font = '600 28px Pretendard, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(meta, 60, H - 60);
      ctx.shadowBlur = 0;

      // ★ Hz 스티커 우상단
      const stickerW = 220;
      const stickerH = 60;
      const sx = W - stickerW - 50;
      const sy = 50;
      ctx.save();
      ctx.translate(sx + stickerW / 2, sy + stickerH / 2);
      ctx.rotate((8 * Math.PI) / 180);
      ctx.fillStyle = '#ff6b9d';
      ctx.strokeStyle = '#1a1612';
      ctx.lineWidth = 4;
      const r = 30;
      ctx.beginPath();
      ctx.moveTo(-stickerW / 2 + r, -stickerH / 2);
      ctx.lineTo(stickerW / 2 - r, -stickerH / 2);
      ctx.quadraticCurveTo(stickerW / 2, -stickerH / 2, stickerW / 2, -stickerH / 2 + r);
      ctx.lineTo(stickerW / 2, stickerH / 2 - r);
      ctx.quadraticCurveTo(stickerW / 2, stickerH / 2, stickerW / 2 - r, stickerH / 2);
      ctx.lineTo(-stickerW / 2 + r, stickerH / 2);
      ctx.quadraticCurveTo(-stickerW / 2, stickerH / 2, -stickerW / 2, stickerH / 2 - r);
      ctx.lineTo(-stickerW / 2, -stickerH / 2 + r);
      ctx.quadraticCurveTo(-stickerW / 2, -stickerH / 2, -stickerW / 2 + r, -stickerH / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '900 22px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${meta.split('·')[0].trim()}`, 0, 2);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('toBlob failed'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}
