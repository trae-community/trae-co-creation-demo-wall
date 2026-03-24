'use client'

import { useEffect, useRef } from "react";

type Walker = {
  x: number;
  y: number;
  speed: number;
  width: number;
  alpha: number;
  drift: number;
};

type ProbeNode = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  hue: number;
};

const WALKER_COUNT = 22;
const PROBE_COUNT = 7;
const SEED = 20260324;

const seeded = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const fieldAngle = (x: number, y: number, time: number) =>
  Math.sin(x * 0.001 + time * 0.00008) * 1.2 +
  Math.cos(y * 0.00115 - time * 0.00007) * 0.95 +
  Math.sin((x + y) * 0.00045 + time * 0.00005) * 0.45;

export const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const random = seeded(SEED);
    const walkers: Walker[] = [];
    const probeNodes: ProbeNode[] = [];
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
      probeNodes.length = 0;
      for (let i = 0; i < WALKER_COUNT; i += 1) {
        walkers.push({
          x: random() * width,
          y: random() * height,
          speed: 0.12 + random() * 0.48,
          width: 0.35 + random() * 0.45,
          alpha: 0.03 + random() * 0.045,
          drift: random() * Math.PI * 2,
        });
      }

      for (let i = 0; i < PROBE_COUNT; i += 1) {
        const anchorX = i % 2 === 0 ? width * (0.14 + random() * 0.24) : width * (0.66 + random() * 0.18);
        const anchorY = height * (0.15 + (i / Math.max(1, PROBE_COUNT - 1)) * 0.7);
        probeNodes.push({
          x: anchorX,
          y: anchorY + (random() - 0.5) * 50,
          radius: 1.1 + random() * 1.8,
          phase: random() * Math.PI * 2,
          hue: i % 3 === 0 ? 200 : 154,
        });
      }
    };

    const drawBackdrop = (time: number) => {
      const pulse = 0.12 + Math.sin(time * 0.00012) * 0.012;
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
      glowA.addColorStop(0, "rgba(122,255,190,0.032)");
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
      glowB.addColorStop(0, "rgba(103,176,255,0.026)");
      glowB.addColorStop(1, "rgba(103,176,255,0)");
      context.fillStyle = glowB;
      context.fillRect(0, 0, width, height);
      context.restore();
    };

    const drawMeasurementLines = () => {
      context.save();
      context.lineWidth = 1;
      context.setLineDash([8, 18]);

      const horizontalLines = [0.18, 0.52, 0.78];
      horizontalLines.forEach((ratio, index) => {
        const y = height * ratio;
        const startX = index % 2 === 0 ? width * 0.06 : width * 0.68;
        const segmentWidth = width * 0.2;
        context.strokeStyle = index === 1 ? "rgba(103,176,255,0.055)" : "rgba(122,255,190,0.05)";
        context.beginPath();
        context.moveTo(startX, y);
        context.lineTo(startX + segmentWidth, y);
        context.stroke();
      });

      const verticalLines = [0.14, 0.82];
      verticalLines.forEach((ratio, index) => {
        const x = width * ratio;
        const startY = index === 0 ? height * 0.1 : height * 0.56;
        const segmentHeight = height * 0.16;
        context.strokeStyle = "rgba(216,230,255,0.038)";
        context.beginPath();
        context.moveTo(x, startY);
        context.lineTo(x, startY + segmentHeight);
        context.stroke();
      });

      context.setLineDash([]);
      probeNodes.forEach((node) => {
        context.strokeStyle = "rgba(255,255,255,0.03)";
        context.beginPath();
        context.moveTo(node.x - 12, node.y);
        context.lineTo(node.x + 12, node.y);
        context.moveTo(node.x, node.y - 12);
        context.lineTo(node.x, node.y + 12);
        context.stroke();
      });

      context.restore();
    };

    const drawProbeNodes = (time: number) => {
      context.save();
      context.globalCompositeOperation = "screen";
      probeNodes.forEach((node, index) => {
        const breath = 0.35 + (Math.sin(time * 0.001 + node.phase) + 1) * 0.22;
        const glowRadius = 16 + (index % 3) * 6;
        const gradient = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        gradient.addColorStop(0, `hsla(${node.hue}, 85%, 76%, ${0.12 * breath})`);
        gradient.addColorStop(0.5, `hsla(${node.hue}, 80%, 70%, ${0.04 * breath})`);
        gradient.addColorStop(1, `hsla(${node.hue}, 80%, 68%, 0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = `hsla(${node.hue}, 88%, 82%, ${0.38 * breath})`;
        context.beginPath();
        context.arc(node.x, node.y, node.radius + breath * 0.8, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
    };

    const step = (time: number) => {
      drawBackdrop(time);
      drawMeasurementLines();

      context.save();
      context.globalCompositeOperation = "screen";

      walkers.forEach((walker, index) => {
        const previousX = walker.x;
        const previousY = walker.y;
        const angle = fieldAngle(walker.x, walker.y, time) + walker.drift;

        walker.x += Math.cos(angle) * walker.speed;
        walker.y += Math.sin(angle) * walker.speed;

        if (walker.x < -80 || walker.x > width + 80 || walker.y < -80 || walker.y > height + 80) {
          walker.x = random() * width;
          walker.y = random() * height;
        }

        const hue = index % 4 === 0 ? 198 : 156;
        const alpha = walker.alpha + Math.sin(time * 0.00022 + index) * 0.008;
        context.strokeStyle = `hsla(${hue}, 82%, 72%, ${Math.max(0.015, alpha)})`;
        context.lineWidth = walker.width;
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(walker.x, walker.y);
        context.stroke();
      });

      context.restore();
      drawProbeNodes(time);
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(122,255,190,0.035),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(103,176,255,0.04),transparent_30%),linear-gradient(180deg,transparent,rgba(0,0,0,0.08))]" />
    </div>
  );
};
