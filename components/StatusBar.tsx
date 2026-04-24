'use client';

import { useEffect, useState } from 'react';

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const [time, setTime] = useState('9:41');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      setTime(`${h}:${m.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const color = dark ? '#fff' : '#1a1612';
  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-between items-center px-5 z-20"
      style={{ paddingTop: 'env(safe-area-inset-top, 14px)', height: 32, color }}
    >
      <span style={{ fontSize: 14, fontWeight: 700 }}>{time}</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>●●●</span>
    </div>
  );
}
