'use client';

import React, { useEffect, useRef } from 'react';

interface SoftAuroraProps {
  color1?: string; // Default subtle white/silver glow '#f7f7f7' or violet '#c084fc'
  color2?: string; // Default vivid purple/magenta '#e100ff'
  speed?: number;  // 0.4 - 1.0
  scale?: number;
  className?: string;
}

export function SoftAurora({
  color1 = '#f7f7f7',
  color2 = '#e100ff',
  speed = 0.6,
  scale = 1.2,
  className = '',
}: SoftAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    let time = 0;

    const render = () => {
      time += 0.008 * speed;
      ctx.clearRect(0, 0, width, height);

      // Deep base dark background
      ctx.fillStyle = '#07070a';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.35;

      // Soft Aurora Wave 1: Gentle violet-magenta blooming aura
      const grad1Radius = Math.max(width, height) * 0.65 * scale;
      const waveX1 = cx + Math.sin(time * 0.8) * (width * 0.15);
      const waveY1 = cy + Math.cos(time * 0.6) * (height * 0.12);

      const auroraGrad1 = ctx.createRadialGradient(
        waveX1,
        waveY1,
        20,
        waveX1,
        waveY1,
        grad1Radius
      );
      auroraGrad1.addColorStop(0, 'rgba(225, 0, 255, 0.28)'); // #e100ff soft
      auroraGrad1.addColorStop(0.35, 'rgba(147, 51, 234, 0.16)'); // purple
      auroraGrad1.addColorStop(0.7, 'rgba(79, 70, 229, 0.06)'); // indigo
      auroraGrad1.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = auroraGrad1;
      ctx.fillRect(0, 0, width, height);

      // Soft Aurora Wave 2: Subtle luminous crest (gentle white/silver light glow)
      const waveX2 = cx + Math.cos(time * 1.1) * (width * 0.18);
      const waveY2 = cy * 0.8 + Math.sin(time * 0.9) * (height * 0.08);

      const auroraGrad2 = ctx.createRadialGradient(
        waveX2,
        waveY2,
        10,
        waveX2,
        waveY2,
        grad1Radius * 0.75
      );
      auroraGrad2.addColorStop(0, 'rgba(247, 247, 247, 0.22)');
      auroraGrad2.addColorStop(0.25, 'rgba(216, 180, 254, 0.14)');
      auroraGrad2.addColorStop(0.6, 'rgba(126, 34, 206, 0.05)');
      auroraGrad2.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = auroraGrad2;
      ctx.fillRect(0, 0, width, height);

      // Soft Aurora Wave 3: Deep blue-purple undertone
      const waveX3 = cx - Math.sin(time * 0.5) * (width * 0.2);
      const waveY3 = cy * 1.2 + Math.cos(time * 0.7) * (height * 0.1);

      const auroraGrad3 = ctx.createRadialGradient(
        waveX3,
        waveY3,
        30,
        waveX3,
        waveY3,
        grad1Radius * 0.8
      );
      auroraGrad3.addColorStop(0, 'rgba(99, 102, 241, 0.18)');
      auroraGrad3.addColorStop(0.4, 'rgba(76, 29, 149, 0.08)');
      auroraGrad3.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = auroraGrad3;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color1, color2, speed, scale]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle blend scrim at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07070a] pointer-events-none" />
    </div>
  );
}
