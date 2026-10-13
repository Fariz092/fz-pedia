'use client';

import React, { useEffect, useRef } from 'react';

interface LightPillarProps {
  className?: string;
  primaryColor?: string; // e.g. '#a855f7' or '#c084fc'
  secondaryColor?: string; // e.g. '#6366f1' or '#ec4899'
  width?: number; // Pillar width in percentage or px
  interactive?: boolean;
}

export function LightPillar({
  className = '',
  primaryColor = '#a855f7',
  secondaryColor = '#6366f1',
  interactive = true,
}: LightPillarProps) {
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

    // Particle dust specs
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      drift: number;
    }

    const particles: Particle[] = Array.from({ length: 45 }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 320,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.5,
      speedY: Math.random() * 0.4 + 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      drift: (Math.random() - 0.5) * 0.3,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;

      // 1. Broad ambient diffuse glow
      const ambientGrad = ctx.createRadialGradient(
        centerX,
        height * 0.3,
        20,
        centerX,
        height * 0.4,
        Math.max(width * 0.6, 400)
      );
      ambientGrad.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
      ambientGrad.addColorStop(0.4, 'rgba(126, 34, 206, 0.08)');
      ambientGrad.addColorStop(1, 'rgba(7, 7, 10, 0)');

      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Main Ethereal Vertical Pillar with wavy sinusoids
      const pillarWidth = Math.min(width * 0.45, 340);
      const waveOffset1 = Math.sin(time * 1.2) * 18;
      const waveOffset2 = Math.cos(time * 0.9) * 22;

      // Draw primary light beam
      const beamGrad = ctx.createLinearGradient(0, 0, 0, height);
      beamGrad.addColorStop(0, 'rgba(236, 72, 153, 0.25)'); // pink top accent
      beamGrad.addColorStop(0.2, 'rgba(192, 132, 252, 0.45)'); // luminous violet
      beamGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
      beamGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.15)'); // indigo bottom fade
      beamGrad.addColorStop(1, 'rgba(7, 7, 10, 0)');

      // Draw light streams
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Layer 1 - Central bright spine
      const spineGrad = ctx.createLinearGradient(
        centerX - pillarWidth * 0.35 + waveOffset1,
        0,
        centerX + pillarWidth * 0.35 + waveOffset1,
        0
      );
      spineGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
      spineGrad.addColorStop(0.3, 'rgba(216, 180, 254, 0.35)');
      spineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
      spineGrad.addColorStop(0.7, 'rgba(216, 180, 254, 0.35)');
      spineGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = spineGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - pillarWidth * 0.25 + waveOffset1, 0);
      ctx.bezierCurveTo(
        centerX - pillarWidth * 0.4 + waveOffset2,
        height * 0.35,
        centerX - pillarWidth * 0.2 - waveOffset1,
        height * 0.7,
        centerX - pillarWidth * 0.3,
        height
      );
      ctx.lineTo(centerX + pillarWidth * 0.3, height);
      ctx.bezierCurveTo(
        centerX + pillarWidth * 0.2 - waveOffset1,
        height * 0.7,
        centerX + pillarWidth * 0.4 + waveOffset2,
        height * 0.35,
        centerX + pillarWidth * 0.25 + waveOffset1,
        0
      );
      ctx.closePath();
      ctx.fill();

      // Layer 2 - Outer curtain of light
      const curtainGrad = ctx.createLinearGradient(
        centerX - pillarWidth * 0.75,
        0,
        centerX + pillarWidth * 0.75,
        0
      );
      curtainGrad.addColorStop(0, 'rgba(126, 34, 206, 0)');
      curtainGrad.addColorStop(0.25, 'rgba(168, 85, 247, 0.2)');
      curtainGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.35)');
      curtainGrad.addColorStop(0.75, 'rgba(168, 85, 247, 0.2)');
      curtainGrad.addColorStop(1, 'rgba(126, 34, 206, 0)');

      ctx.fillStyle = curtainGrad;
      ctx.beginPath();
      ctx.moveTo(centerX - pillarWidth * 0.65 - waveOffset2, 0);
      ctx.bezierCurveTo(
        centerX - pillarWidth * 0.8 + waveOffset1,
        height * 0.4,
        centerX - pillarWidth * 0.5 - waveOffset2,
        height * 0.75,
        centerX - pillarWidth * 0.7,
        height
      );
      ctx.lineTo(centerX + pillarWidth * 0.7, height);
      ctx.bezierCurveTo(
        centerX + pillarWidth * 0.5 - waveOffset2,
        height * 0.75,
        centerX + pillarWidth * 0.8 + waveOffset1,
        height * 0.4,
        centerX + pillarWidth * 0.65 - waveOffset2,
        0
      );
      ctx.closePath();
      ctx.fill();

      // Layer 3 - Floating ethereal shimmer particles
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += p.drift + Math.sin(time + p.y * 0.01) * 0.2;
        if (p.y < 0) {
          p.y = height;
          p.x = centerX + (Math.random() - 0.5) * pillarWidth * 1.2;
        }

        ctx.fillStyle = `rgba(243, 232, 255, ${p.opacity * (0.8 + 0.2 * Math.sin(time * 3 + p.x))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [primaryColor, secondaryColor, interactive]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Top light source highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-28 bg-gradient-to-b from-purple-400/30 via-violet-500/10 to-transparent blur-2xl" />
      {/* Dynamic Animated Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle vignette border */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07070a]/90 pointer-events-none" />
    </div>
  );
}
