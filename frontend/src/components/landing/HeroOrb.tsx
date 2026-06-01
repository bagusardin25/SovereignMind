'use client';

// ============================================================
// HeroOrb — Lightweight CSS-only animated orb replacement
// Replaces the heavy Spline 3D scene (~1GB+ RAM) with pure CSS
// gradients and animations that look premium but use ~0 extra memory.
// ============================================================

import { useEffect, useState } from 'react';

export default function HeroOrb() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so the fade-in feels intentional
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`hero-orb-container transition-opacity duration-1000 ease-in-out ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Main glowing orb */}
      <div className="hero-orb">
        <div className="hero-orb__core" />
        <div className="hero-orb__ring hero-orb__ring--1" />
        <div className="hero-orb__ring hero-orb__ring--2" />
        <div className="hero-orb__ring hero-orb__ring--3" />
      </div>

      {/* Floating particles */}
      <div className="hero-particles">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="hero-particle"
            style={{
              '--particle-delay': `${i * 0.8}s`,
              '--particle-duration': `${4 + i * 0.7}s`,
              '--particle-x': `${50 + Math.cos((i * Math.PI * 2) / 6) * 35}%`,
              '--particle-y': `${50 + Math.sin((i * Math.PI * 2) / 6) * 35}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <style jsx>{`
        .hero-orb-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .hero-orb {
          position: relative;
          width: clamp(280px, 40vw, 520px);
          height: clamp(280px, 40vw, 520px);
        }

        /* Core glowing sphere */
        .hero-orb__core {
          position: absolute;
          inset: 15%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 40% 35%,
            rgba(207, 188, 255, 0.35) 0%,
            rgba(140, 100, 255, 0.2) 30%,
            rgba(80, 50, 180, 0.15) 55%,
            rgba(30, 10, 80, 0.08) 75%,
            transparent 100%
          );
          filter: blur(2px);
          animation: orb-pulse 6s ease-in-out infinite;
        }

        /* Orbiting rings */
        .hero-orb__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid transparent;
        }

        .hero-orb__ring--1 {
          border-color: rgba(207, 188, 255, 0.15);
          animation: orb-rotate-1 12s linear infinite;
          filter: blur(0.5px);
        }

        .hero-orb__ring--2 {
          inset: 8%;
          border-color: rgba(140, 100, 255, 0.12);
          animation: orb-rotate-2 18s linear infinite;
          border-style: dashed;
        }

        .hero-orb__ring--3 {
          inset: -5%;
          border-color: rgba(207, 188, 255, 0.06);
          animation: orb-rotate-1 24s linear infinite reverse;
        }

        /* Floating particles */
        .hero-particles {
          position: absolute;
          inset: 0;
        }

        .hero-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(207, 188, 255, 0.6);
          left: var(--particle-x);
          top: var(--particle-y);
          animation: particle-float var(--particle-duration) ease-in-out infinite;
          animation-delay: var(--particle-delay);
          box-shadow: 0 0 8px rgba(207, 188, 255, 0.4);
        }

        @keyframes orb-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes orb-rotate-1 {
          0% {
            transform: rotate(0deg) rotateX(60deg);
          }
          100% {
            transform: rotate(360deg) rotateX(60deg);
          }
        }

        @keyframes orb-rotate-2 {
          0% {
            transform: rotate(0deg) rotateY(60deg);
          }
          100% {
            transform: rotate(360deg) rotateY(60deg);
          }
        }

        @keyframes particle-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(10px, -15px) scale(1.3);
            opacity: 0.8;
          }
          50% {
            transform: translate(-5px, -25px) scale(1);
            opacity: 0.5;
          }
          75% {
            transform: translate(-12px, -10px) scale(1.2);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
