import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className = "",
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;

    // Only allow pull when at the top of the scroll container
    const container = containerRef.current;
    if (!container) return false;

    return container.scrollTop === 0;
  }, [disabled, isRefreshing]);

  const handleStart = useCallback(
    (clientY: number) => {
      if (!canPull()) return;

      startY.current = clientY;
      currentY.current = clientY;
      setIsPulling(true);
    },
    [canPull]
  );

  const handleMove = useCallback(
    (clientY: number) => {
      if (!isPulling || !canPull()) return;

      currentY.current = clientY;
      const distance = Math.max(0, clientY - startY.current);

      // Apply some resistance to make it feel natural
      const resistance = 0.5;
      const adjustedDistance = distance * resistance;

      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
    },
    [isPulling, canPull, threshold]
  );

  const handleEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientY);
      }
    },
    [handleStart]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY);
      }
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse events (for desktop testing)
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      handleStart(e.clientY);
    },
    [handleStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPulling) {
        e.preventDefault();
        handleMove(e.clientY);
      }
    },
    [isPulling, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Touch events
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Mouse events for desktop
    container.addEventListener("mousedown", handleMouseDown);

    if (isPulling) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isPulling,
  ]);

  const refresherHeight = Math.max(0, pullDistance);
  const isAtThreshold = pullDistance >= threshold;
  const shouldShowRefresher = pullDistance > 0 || isRefreshing;

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull to refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200"
        style={{
          height: shouldShowRefresher ? "60px" : "0px",
          transform: `translateY(${Math.max(0, refresherHeight - 60)}px)`,
          opacity: shouldShowRefresher ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <RefreshCw
            className={`h-5 w-5 transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : isAtThreshold ? "rotate-180" : ""
            }`}
          />
          <span className="text-xs mt-1">
            {isRefreshing
              ? "Refreshing..."
              : isAtThreshold
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content with offset when pulling */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
