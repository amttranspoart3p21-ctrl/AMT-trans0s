import React, { useState, useRef } from "react";

interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

interface ImageViewerModalProps {
  imageId: string;
  imageFileName: string;
  onClose: () => void;
  // Future OCR row highlighting ready
  coordinates?: BoundingBox;
}

export default function ImageViewerModal({
  imageId,
  imageFileName,
  onClose,
  coordinates,
}: ImageViewerModalProps) {
  // Image Pan/Zoom states
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageError, setImageError] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  
  const resetViewport = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageError) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || imageError) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (imageError) return;
    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale((prev) => Math.min(Math.max(prev + direction * zoomFactor, 0.5), 4));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/image?filename=${imageId}`);
      if (!response.ok) throw new Error("Image not found");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageFileName || "register-image.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading image:", err);
      alert("Failed to download image. The file might be unavailable.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-[#18191A] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-6xl w-full h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-white dark:bg-[#18191A] border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center select-none shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                Register Verification Viewer
              </h3>
              <span className="bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium px-2.5 py-0.5 rounded-md truncate max-w-md border border-slate-300/60 dark:border-zinc-700/60">
                {imageFileName}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5 font-normal">
              Use handles below to verify register contents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
            title="Close Viewer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewport Container */}
        <div className="flex-1 bg-[#f4f5f7] dark:bg-[#121314] relative overflow-hidden flex items-center justify-center">
          
          {/* Floating Controls Bar Overlay */}
          {!imageError && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-700/80 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all">
              {/* Zoom In */}
              <button
                onClick={zoomIn}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full transition-colors cursor-pointer"
                title="Zoom In"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Zoom Out */}
              <button
                onClick={zoomOut}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>

              {/* Divider */}
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />

              {/* Rotate */}
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full transition-colors cursor-pointer"
                title="Rotate Clockwise"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
              </button>

              {/* Fit */}
              <button
                onClick={resetViewport}
                className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Fit to Screen"
              >
                Fit
              </button>

              {/* Divider */}
              <div className="h-4 w-px bg-slate-200 dark:bg-zinc-700" />

              {/* Download */}
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full transition-colors cursor-pointer"
                title="Download Image"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}

          {/* Render Area */}
          {imageError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 border border-rose-200 dark:border-rose-900/40 mb-3">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Image Reference Missing</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1">
                Original register image is unavailable or was deleted from the server storage architecture.
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative flex items-center justify-center"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  transformOrigin: "center center",
                }}
                className="relative"
              >
                {/* Image */}
                <img
                  src={`/api/image?filename=${imageId}`}
                  alt="Original Register"
                  draggable={false}
                  onLoad={() => setImageError(false)}
                  onError={() => setImageError(true)}
                  className="max-w-full max-h-[75vh] object-contain pointer-events-none select-none"
                />

                {/* Future Highlight Overlay Container (coordinates ready) */}
                {coordinates && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${coordinates.x_min * 100}%`,
                      top: `${coordinates.y_min * 100}%`,
                      width: `${(coordinates.x_max - coordinates.x_min) * 100}%`,
                      height: `${(coordinates.y_max - coordinates.y_min) * 100}%`,
                    }}
                    className="border-2 border-dashed border-sky-500 bg-sky-500/10 pointer-events-none"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
