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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-850 flex justify-between items-center select-none shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>Register Verification Viewer</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {imageFileName}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Use handles below to verify register contents</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Close Viewer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewport container */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          
          {/* Controls Bar Overlay */}
          {!imageError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 shadow-2xl bg-slate-900/90 border border-slate-800/85 p-1.5 rounded-2xl backdrop-blur-md items-center">
              <button
                onClick={zoomIn}
                className="p-1.5 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Zoom In"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 hover:bg-slate-800 text-slate-355 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-800 text-slate-355 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Rotate Clockwise"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
              </button>
              <button
                onClick={resetViewport}
                className="px-3 py-1.5 hover:bg-slate-800 text-slate-355 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer border-l border-slate-800"
                title="Fit to Screen"
              >
                Fit
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-slate-800 text-slate-355 hover:text-white rounded-xl transition-colors cursor-pointer border-l border-slate-800"
                title="Download Image"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}

          {/* Render Area */}
          {imageError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="h-14 w-14 rounded-full bg-red-950/40 flex items-center justify-center text-red-500 border border-red-900/40 mb-3 animate-pulse">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-200">Image Reference Missing</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
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
                    className="border-2 border-dashed border-violet-500 bg-violet-500/10 pointer-events-none"
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
