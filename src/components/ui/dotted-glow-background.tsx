"use client";

import React, { useEffect, useRef, useState } from "react";

type DottedGlowBackgroundProps = {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  darkColor?: string;
  glowColor?: string;
  darkGlowColor?: string;
  colorLightVar?: string;
  colorDarkVar?: string;
  glowColorLightVar?: string;
  glowColorDarkVar?: string;
  highlightColor?: string;
  highlightPercentage?: number;
  opacity?: number;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
};

export const DottedGlowBackground = ({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(0,0,0,0.7)",
  darkColor,
  glowColor = "rgba(0, 170, 255, 0.85)",
  darkGlowColor,
  colorLightVar,
  colorDarkVar,
  glowColorLightVar,
  glowColorDarkVar,
  highlightColor = "#32F08C",
  highlightPercentage = 0.08,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1,
}: DottedGlowBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [resolvedColor, setResolvedColor] = useState<string>(color);
  const [resolvedGlowColor, setResolvedGlowColor] = useState<string>(glowColor);

  const resolveCssVariable = (el: Element, variableName?: string): string | null => {
    if (!variableName) return null;
    const normalized = variableName.startsWith("--") ? variableName : `--${variableName}`;
    const fromEl = getComputedStyle(el as Element).getPropertyValue(normalized).trim();
    if (fromEl) return fromEl;
    const root = document.documentElement;
    const fromRoot = getComputedStyle(root).getPropertyValue(normalized).trim();
    return fromRoot || null;
  };

  const detectDarkMode = (): boolean => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  useEffect(() => {
    const container = containerRef.current ?? document.documentElement;
    const compute = () => {
      const isDark = detectDarkMode();
      let nextColor: string = color;
      let nextGlow: string = glowColor;
      if (isDark) {
        const varDot = resolveCssVariable(container, colorDarkVar);
        const varGlow = resolveCssVariable(container, glowColorDarkVar);
        nextColor = varDot || darkColor || nextColor;
        nextGlow = varGlow || darkGlowColor || nextGlow;
      } else {
        const varDot = resolveCssVariable(container, colorLightVar);
        const varGlow = resolveCssVariable(container, glowColorLightVar);
        nextColor = varDot || nextColor;
        nextGlow = varGlow || nextGlow;
      }
      setResolvedColor(nextColor);
      setResolvedGlowColor(nextGlow);
    };
    compute();
    const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleMql = () => compute();
    mql?.addEventListener?.("change", handleMql);
    const mo = new MutationObserver(() => compute());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => {
      mql?.removeEventListener?.("change", handleMql);
      mo.disconnect();
    };
  }, [color, darkColor, glowColor, darkGlowColor, colorLightVar, colorDarkVar, glowColorLightVar, glowColorDarkVar]);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let stopped = false;
    let isVisible = true;
    const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${Math.floor(width)}px`;
      el.style.height = `${Math.floor(height)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    let dots: { x: number; y: number; phase: number; speed: number; isHighlight: boolean }[] = [];
    const regenDots = () => {
      dots = [];
      const { width, height } = container.getBoundingClientRect();
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const min = Math.min(speedMin, speedMax);
      const max = Math.max(speedMin, speedMax);
      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * gap + (j % 2 === 0 ? 0 : gap * 0.5);
          const y = j * gap;
          const phase = Math.random() * Math.PI * 2;
          const span = Math.max(max - min, 0);
          const speed = min + Math.random() * span;
          const isHighlight = Math.random() < highlightPercentage;
          dots.push({ x, y, phase, speed, isHighlight });
        }
      }
    };
    regenDots();
    let last = performance.now();
    const draw = (now: number) => {
      if (stopped) return;
      if (!isVisible) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const dt = (now - last) / 1000;
      last = now;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, el.width, el.height);
      ctx.globalAlpha = opacity;
      if (backgroundOpacity > 0) {
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.4, Math.min(width, height) * 0.1, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${Math.min(Math.max(backgroundOpacity, 0), 1)})`);
        ctx.fillStyle = grad as unknown as CanvasGradient;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.save();
      const time = (now / 1000) * Math.max(speedScale, 0);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const mod = (time * d.speed + d.phase) % 2;
        const lin = mod < 1 ? mod : 2 - mod;
        const a = 0.25 + 0.55 * lin;
        ctx.fillStyle = d.isHighlight ? highlightColor : resolvedColor;
        if (a > 0.6) {
          const glow = (a - 0.6) / 0.4;
          ctx.shadowColor = d.isHighlight ? highlightColor : resolvedGlowColor;
          ctx.shadowBlur = 6 * glow;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = a * opacity;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    const handleResize = () => {
      resize();
      regenDots();
    };
    const observer = new IntersectionObserver((entries) => { isVisible = entries[0]?.isIntersecting ?? true; }, { threshold: 0.1 });
    observer.observe(container);
    window.addEventListener("resize", handleResize);
    raf = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      ro.disconnect();
    };
  }, [gap, radius, resolvedColor, resolvedGlowColor, opacity, backgroundOpacity, speedMin, speedMax, speedScale, highlightColor, highlightPercentage]);

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};
