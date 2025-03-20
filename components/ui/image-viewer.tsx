import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";

interface ImageViewerProps {
  readonly images: string[];
  readonly initialIndex?: number;
  readonly trigger?: React.ReactNode;
}

interface Position {
  x: number;
  y: number;
}

const ZOOM_MAX = 3;
const ZOOM_MIN = 1;
const ZOOM_STEP = 0.1;
const ZOOM_BUTTON_STEP = 0.5;

export function ImageViewer({
  images,
  initialIndex = 0,
  trigger,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPosition = useRef<Position>({ x: 0, y: 0 });
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const resetView = () => {
    setScale(ZOOM_MIN);
    setPosition({ x: 0, y: 0 });
  };

  const showNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetView();
  };

  const showPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetView();
  };

  const zoomIn = () =>
    setScale((prev) => Math.min(prev + ZOOM_BUTTON_STEP, ZOOM_MAX));
  const zoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - ZOOM_BUTTON_STEP, ZOOM_MIN);
      if (newScale === ZOOM_MIN) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
    } else {
      setScale((prev) => {
        const newScale = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
        if (newScale === ZOOM_MIN) setPosition({ x: 0, y: 0 });
        return newScale;
      });
    }
  }, []);

  const constrainPosition = useCallback(
    (pos: Position, currentScale: number) => {
      if (!imageRef.current || !containerRef.current) return pos;

      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();

      const scaledWidth = imageRect.width * currentScale;
      const scaledHeight = imageRect.height * currentScale;

      const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

      return {
        x: Math.max(Math.min(pos.x, maxX), -maxX),
        y: Math.max(Math.min(pos.y, maxY), -maxY),
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > ZOOM_MIN) {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        lastPosition.current = position;
        e.preventDefault();
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current && scale > ZOOM_MIN) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;

        const newPosition = {
          x: lastPosition.current.x + dx,
          y: lastPosition.current.y + dy,
        };

        setPosition(constrainPosition(newPosition, scale));
      }
    },
    [scale, constrainPosition]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
  }, []);

  const getCursor = () => {
    if (scale <= 1) return "default";
    return isDragging.current ? "grabbing" : "grab";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <div className="cursor-pointer relative aspect-square">
            <Image
              src={images[initialIndex]}
              alt={`Image ${initialIndex + 1}`}
              fill
              className="object-cover"
            />
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="p-0 min-w-screen min-h-screen">
        <VisuallyHidden>
          <DialogTitle>Image Viewer</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                onClick={showPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                onClick={showNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center p-10 select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: getCursor() }}
          >
            <Image
              ref={imageRef}
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-contain will-change-transform"
              sizes="100vw"
              priority
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transition: isDragging.current
                  ? "none"
                  : "transform 200ms ease-out",
              }}
              draggable={false}
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/25"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}

          <div className="absolute right-4 bottom-16 z-50 flex flex-col gap-2">
            <Button variant="ghost" size="icon" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
