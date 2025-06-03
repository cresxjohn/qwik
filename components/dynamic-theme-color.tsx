"use client";

import { useDynamicThemeColor } from "@/hooks/use-dynamic-theme-color";

export function DynamicThemeColor() {
  // This hook handles all the logic and side effects
  useDynamicThemeColor();

  // This component doesn't render anything visible
  return null;
}
