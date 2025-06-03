"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Improved function to convert OKLCH color to hex
function oklchToHex(oklchString: string): string {
  try {
    // Parse OKLCH values from string like "oklch(0.985 0 0)"
    const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match) return "#000000";

    const [, l, c] = match.map(Number);

    // Convert OKLCH to linear RGB
    // Since your colors have 0 chroma (grayscale), we can simplify
    if (c < 0.01) {
      // Pure grayscale conversion
      const linear = l ** 3; // Approximate gamma correction
      const srgb = Math.round(linear * 255);
      const hex = srgb.toString(16).padStart(2, "0");
      return `#${hex}${hex}${hex}`;
    }

    // For colors with chroma, do proper OKLCH to RGB conversion
    // This is a simplified approximation - for exact conversion, use a color library
    const gray = Math.round(l ** 2.2 * 255); // Gamma correction
    const hex = gray.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`;
  } catch {
    return "#000000";
  }
}

// Function to get computed CSS custom property value
function getCSSCustomProperty(propertyName: string): string {
  if (typeof window === "undefined") return "";

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  return computedStyle.getPropertyValue(propertyName).trim();
}

// Function to determine if the color is light or dark
function isLightColor(hexColor: string): boolean {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function useDynamicThemeColor() {
  const { resolvedTheme } = useTheme();
  const [themeColor, setThemeColor] = useState("#000000");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateThemeColor = () => {
      // Get the computed background color
      const backgroundColor = getCSSCustomProperty("--background");

      if (backgroundColor) {
        const hexColor = oklchToHex(backgroundColor);
        setThemeColor(hexColor);

        // Update the theme-color meta tag
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
          themeColorMeta = document.createElement("meta");
          themeColorMeta.setAttribute("name", "theme-color");
          document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.setAttribute("content", hexColor);

        // Update Apple mobile web app status bar style based on color brightness
        let appleStatusBarMeta = document.querySelector(
          'meta[name="apple-mobile-web-app-status-bar-style"]'
        );
        if (!appleStatusBarMeta) {
          appleStatusBarMeta = document.createElement("meta");
          appleStatusBarMeta.setAttribute(
            "name",
            "apple-mobile-web-app-status-bar-style"
          );
          document.head.appendChild(appleStatusBarMeta);
        }

        // Set status bar style based on background color
        const statusBarStyle = isLightColor(hexColor)
          ? "default"
          : "black-translucent";
        appleStatusBarMeta.setAttribute("content", statusBarStyle);

        // Update the PWA manifest theme color
        updateManifestThemeColor(hexColor);
      }
    };

    // Initial update with a small delay to ensure CSS is loaded
    const initialTimer = setTimeout(updateThemeColor, 100);

    // Create a MutationObserver to watch for class changes on html element (theme changes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          // Delay to ensure CSS has been applied
          setTimeout(updateThemeColor, 100);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [resolvedTheme]);

  return themeColor;
}

// Function to dynamically update manifest theme color
async function updateManifestThemeColor(color: string) {
  try {
    // We'll create a dynamic manifest that updates the theme color
    // This approach ensures PWA installation uses the correct color
    const manifestData = {
      name: "Qwikfinx - Personal Finance Manager",
      short_name: "Qwikfinx",
      description:
        "A personal finance management application to track your expenses and payments",
      start_url: "/",
      display: "standalone",
      background_color: color, // Also update background color to match
      theme_color: color,
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

    // Create a new blob URL for the updated manifest
    const manifestBlob = new Blob([JSON.stringify(manifestData)], {
      type: "application/json",
    });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Find and update the manifest link
    const manifestLink = document.querySelector(
      'link[rel="manifest"]'
    ) as HTMLLinkElement;
    if (manifestLink) {
      // Store the old URL to revoke it later
      const oldUrl = manifestLink.href;

      // Update to new manifest
      manifestLink.href = manifestUrl;

      // Clean up old blob URL if it was a blob
      if (oldUrl.startsWith("blob:")) {
        setTimeout(() => URL.revokeObjectURL(oldUrl), 1000);
      }
    }
  } catch (error) {
    console.warn("Failed to update manifest theme color:", error);
  }
}
