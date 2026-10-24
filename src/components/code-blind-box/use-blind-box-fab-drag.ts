'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LIFT_STORAGE_KEY = 'code-blind-box-fab-lift-px';
const DRAG_THRESHOLD_PX = 6;

function clampLift(value: number, max: number) {
  return Math.min(max, Math.max(0, value));
}

function readStoredLift(max: number) {
  try {
    const raw = localStorage.getItem(LIFT_STORAGE_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return 0;
    return clampLift(n, max);
  } catch {
    return 0;
  }
}

function computeMaxLift() {
  if (typeof window === 'undefined') return 280;
  return Math.min(380, Math.max(100, Math.round(window.innerHeight * 0.52)));
}

function computeBaseBottom() {
  if (typeof window === 'undefined') return 80;
  return window.matchMedia('(min-width: 640px)').matches ? 96 : 80;
}

export function useBlindBoxFabDrag() {
  const [baseBottomPx, setBaseBottomPx] = useState(80);
  const [maxLiftPx, setMaxLiftPx] = useState(280);
  const [liftPx, setLiftPx] = useState(0);
  const liftRef = useRef(0);
  liftRef.current = liftPx;

  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startLift: number;
    moved: boolean;
  } | null>(null);

  const syncLayout = useCallback(() => {
    const max = computeMaxLift();
    setMaxLiftPx(max);
    setBaseBottomPx(computeBaseBottom());
    setLiftPx((prev) => clampLift(prev, max));
  }, []);

  useEffect(() => {
    const max = computeMaxLift();
    setMaxLiftPx(max);
    setBaseBottomPx(computeBaseBottom());
    setLiftPx(readStoredLift(max));
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, [syncLayout]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      dragRef.current = {
        pointerId: e.pointerId,
        startY: e.clientY,
        startLift: liftRef.current,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      const delta = drag.startY - e.clientY;
      if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.moved = true;
      setLiftPx(clampLift(drag.startLift + delta, maxLiftPx));
    },
    [maxLiftPx]
  );

  const finishPointer = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return false;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (drag.moved) {
      try {
        localStorage.setItem(LIFT_STORAGE_KEY, String(liftRef.current));
      } catch {
        /* ignore */
      }
    }
    return drag.moved;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => finishPointer(e),
    [finishPointer]
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      finishPointer(e);
    },
    [finishPointer]
  );

  return {
    bottomPx: baseBottomPx + liftPx,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
