'use client'

import { useEffect, useRef } from "react";

type Walker = {
  x: number;
  y: number;
  speed: number;
  hue: number;
  drift: number;
};

const WALKER_COUNT = 68;
const SEED = 20260324;

const seeded = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const fieldAngle = (x: number, y: number, time: number) =>
  Math.sin(x * 0.0019 + time * 0.00025) * 1.6 +
  Math.cos(y * 0.0013 - time * 0.00018) * 1.15 +
  Math.sin((x + y) * 0.0007 + time * 0.00012) * 0.8;

export const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const random = seeded(SEED);
    const walkers: Walker[] = [];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = "rgba(7, 11, 16, 1)";
      context.fillRect(0, 0, width, height);

      walkers.length = 0;
      for (let i = 0; i < WALKER_COUNT; i += 1) {
        walkers.push({
          x: random() * width,
          y: random() * height,
          speed: 0.45 + random() * 1.35,
          hue: 145 + random() * 75,
          drift: random() * Math.PI * 2,
        });
      }
    };

    const drawBackdrop = (time: number) => {
      const pulse = 0.12 + Math.sin(time * 0.0003) * 0.03;
      context.save();
      context.globalCompositeOperation = "source-over";
      context.fillStyle = `rgba(7, 11, 16, ${pulse})`;
      context.fillRect(0, 0, width, height);

      const glowA = context.createRadialGradient(
        width * 0.18,
        height * 0.22,
        0,
        width * 0.18,
        height * 0.22,
        width * 0.36
      );
      glowA.addColorStop(0, "rgba(122,255,190,0.06)");
      glowA.addColorStop(1, "rgba(122,255,190,0)");
      context.fillStyle = glowA;
      context.fillRect(0, 0, width, height);

      const glowB = context.createRadialGradient(
        width * 0.82,
        height * 0.16,
        0,
        width * 0.82,
        height * 0.16,
        width * 0.32
      );
      glowB.addColorStop(0, "rgba(103,176,255,0.05)");
      glowB.addColorStop(1, "rgba(103,176,255,0)");
      context.fillStyle = glowB;
      context.fillRect(0, 0, width, height);
      context.restore();
    };

    const drawGrid = () => {
      context.save();
      context.strokeStyle = "rgba(122,255,190,0.012)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 220) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 220) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.strokeStyle = "rgba(103,176,255,0.008)";
      for (let x = 110; x < width; x += 220) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 110; y < height; y += 220) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();
    };

    const step = (time: number) => {
      drawBackdrop(time);
      drawGrid();

      context.save();
      context.globalCompositeOperation = "screen";

      walkers.forEach((walker, index) => {
        const previousX = walker.x;
        const previousY = walker.y;
        const angle = fieldAngle(walker.x, walker.y, time) + walker.drift;

        walker.x += Math.cos(angle) * walker.speed;
        walker.y += Math.sin(angle) * walker.speed;

        if (walker.x < -40 || walker.x > width + 40 || walker.y < -40 || walker.y > height + 40) {
          walker.x = random() * width;
          walker.y = random() * height;
        }

        const alpha = 0.12 + ((index % 5) / 40);
        context.strokeStyle = `hsla(${walker.hue}, 88%, 72%, ${alpha})`;
        context.lineWidth = index % 7 === 0 ? 1.35 : 0.8;
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(walker.x, walker.y);
        context.stroke();

        if (index % 8 === 0) {
          context.fillStyle = `hsla(${walker.hue + 8}, 95%, 76%, 0.14)`;
          context.beginPath();
          context.arc(walker.x, walker.y, 1.4 + (index % 3), 0, Math.PI * 2);
          context.fill();
        }
      });

      context.restore();
      animationFrame = window.requestAnimationFrame(step);
    };

    resize();
    step(0);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,255,190,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(103,176,255,0.08),transparent_32%)]" />
    </div>
  );
};
