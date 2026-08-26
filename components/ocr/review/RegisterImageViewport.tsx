"use client";

import React from "react";
import type { ImageViewerPosition } from "@/hooks/useImageViewer";

export interface RegisterImageViewportProps {
  activeFilename: string;
  uploading: boolean;
  loading: boolean;
  onTriggerImagePicker: () => void;
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
  /** Ref attached directly to <img> so useImageViewer can mutate transform without React re-renders */
  imgRef: React.RefObject<HTMLImageElement | null>;
}

/**
 * RegisterImageViewport presentation component encapsulating:
 * - Register Image Viewport card container occupying the left 30% panel
 * - Interactive canvas with drag/pan and mouse wheel event listeners
 * - "Change Image" file upload trigger button
 * - Clean zoom toolbar controls (Zoom Out, current-% Reset, Zoom In)
 * - Register image element with real-time CSS translate and scale transformations
 *
 * Performance notes:
 * - The <img> transform is mutated directly via imgRef during drag/wheel to avoid
 *   React re-renders on every mousemove event. Only scale changes (button/wheel)
 *   go through React state to update the zoom indicator.
 * - The `position` prop is only used to set the initial transform on mount and
 *   after resetZoom; during active drag, useImageViewer owns the transform.
 */
export default function RegisterImageViewport({
  activeFilename,
  uploading,
  loading,
  onTriggerImagePicker,
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
}: RegisterImageViewportProps) {
  // Derive zoom percentage from the single source of truth: `scale`
  const zoomPercentage = Math.round(scale * 100);

  return (
    <section className="bg-white dark:bg-[#242526] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs flex flex-col min-h-0 h-full overflow-hidden select-none">
      {/* Viewport Card Header with Change Image button */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400 dark:text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Register Image Viewport
          </span>
          <button
            type="button"
            onClick={onTriggerImagePicker}
            disabled={uploading || loading}
            className="px-2 py-0.5 bg-slate-100 dark:bg-[#18191A] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-all text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Replace current register image"
          >
            <svg
              className="h-3 w-3 text-[#0077c5] dark:text-[#38bdf8]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>{uploading ? "Uploading..." : "Change Image"}</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60 font-normal">
          Drag to pan | Scroll to zoom
        </span>
      </div>

      {/* Viewport Interactive Image Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-50/70 dark:bg-[#18191A] flex items-center justify-center">
        {/* Floating Zoom Toolbar */}
        <div className="absolute bottom-3 right-3 z-10 inline-flex items-center bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-1 gap-1 text-xs select-none">
          <button
            type="button"
            onClick={zoomOut}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          {/* Centre button shows LIVE zoom percentage derived from scale — clicking resets */}
          <button
            type="button"
            onClick={resetZoom}
            className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded transition-colors cursor-pointer border-x border-slate-200 dark:border-slate-700 min-w-[42px] text-center"
            title="Reset Zoom (100%)"
          >
            {zoomPercentage}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Pan & Drag Canvas Surface */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {activeFilename ? (
            <img
              ref={imgRef}
              src={`/api/image?filename=${activeFilename}`}
              alt="Current Session Register"
              draggable={false}
              className="max-w-full max-h-full object-contain pointer-events-none select-none"
              style={{
                // Initial transform driven by React state (position after resetZoom / mouseUp)
                // During active drag/wheel, useImageViewer mutates this directly via imgRef
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                // Smooth transition only when NOT dragging (button zoom / reset)
                transition: isDragging ? "none" : "transform 0.12s ease-out",
                transformOrigin: "center center",
                // Hint the browser to GPU-composite this layer for smooth transforms
                willChange: "transform",
              }}
            />
          ) : (
            <div className="text-center p-4 text-xs text-slate-400 dark:text-slate-500">
              No register image active in current session.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
