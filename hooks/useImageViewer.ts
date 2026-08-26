import { useState, useCallback, useRef } from "react";

export interface ImageViewerPosition {
  x: number;
  y: number;
}

export interface UseImageViewerReturn {
  scale: number;
  position: ImageViewerPosition;
  isDragging: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  // Ref passed to the <img> element so we can directly mutate transform
  // during drag without triggering React re-renders on every mousemove.
  imgRef: React.RefObject<HTMLImageElement | null>;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;
const ZOOM_BUTTON_STEP = 0.25;
const ZOOM_WHEEL_STEP = 0.1;

/**
 * Headless custom hook encapsulating interactive image canvas pan, zoom,
 * and mouse drag physics.
 *
 * Performance architecture:
 * - `scale` remains in React state (zoom changes need re-renders to update the indicator)
 * - During active drag, `position` is stored in a ref and applied directly to the
 *   <img> DOM node's style.transform via an imgRef — bypassing React state/re-renders
 *   entirely on every mousemove event.
 * - `position` React state is only committed on mouseUp (and on wheel/zoom),
 *   so the hook's public `position` value remains correct for consumers.
 * - `isDragging` is exposed as React state so the component can toggle cursor
 *   and transition classes, but it only flips twice per drag (down/up).
 * - Wheel zoom uses requestAnimationFrame batching to avoid queuing too many
 *   synchronous state updates on rapid scroll.
 */
export function useImageViewer(): UseImageViewerReturn {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<ImageViewerPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs for transient drag state — never cause re-renders
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<ImageViewerPosition>({ x: 0, y: 0 });
  const currentPositionRef = useRef<ImageViewerPosition>({ x: 0, y: 0 });
  const scaleRef = useRef(1); // mirror of scale for use inside event handlers without closure stale value
  const rafIdRef = useRef<number | null>(null);

  // Ref to the <img> element — allows direct DOM style mutation during drag
  const imgRef = useRef<HTMLImageElement | null>(null);

  /** Apply transform directly to <img> DOM node — no React re-render */
  const applyTransformDirect = useCallback((x: number, y: number, s: number) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => {
      const next = Math.min(prev + ZOOM_BUTTON_STEP, MAX_SCALE);
      scaleRef.current = next;
      applyTransformDirect(currentPositionRef.current.x, currentPositionRef.current.y, next);
      return next;
    });
  }, [applyTransformDirect]);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - ZOOM_BUTTON_STEP, MIN_SCALE);
      scaleRef.current = next;
      applyTransformDirect(currentPositionRef.current.x, currentPositionRef.current.y, next);
      return next;
    });
  }, [applyTransformDirect]);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    currentPositionRef.current = { x: 0, y: 0 };
    setScale(1);
    setPosition({ x: 0, y: 0 });
    applyTransformDirect(0, 0, 1);
  }, [applyTransformDirect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - currentPositionRef.current.x,
      y: e.clientY - currentPositionRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;

      const x = e.clientX - dragStartRef.current.x;
      const y = e.clientY - dragStartRef.current.y;
      currentPositionRef.current = { x, y };

      // Use rAF to batch-apply DOM transform — avoids multiple paints in one frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        applyTransformDirect(x, y, scaleRef.current);
        rafIdRef.current = null;
      });
    },
    [applyTransformDirect]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // Commit final position to React state once on mouseup
    setPosition({ ...currentPositionRef.current });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const direction = e.deltaY < 0 ? 1 : -1;
      const nextScale = Math.min(
        Math.max(scaleRef.current + direction * ZOOM_WHEEL_STEP, MIN_SCALE),
        MAX_SCALE
      );
      scaleRef.current = nextScale;
      // Apply transform immediately for visual responsiveness
      applyTransformDirect(currentPositionRef.current.x, currentPositionRef.current.y, nextScale);
      // Commit to React state (triggers zoom indicator re-render)
      setScale(nextScale);
    },
    [applyTransformDirect]
  );

  return {
    scale,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    imgRef,
  };
}
