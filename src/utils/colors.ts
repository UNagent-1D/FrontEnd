/**
 * Converts a hex color string to an HSL string format suitable for CSS variables.
 * Returns in the format: "H S% L%" (e.g., "222.2 47.4% 11.2%")
 */
export function hexToHSL(hex: string): string {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse the hex string
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // Convert RGB to relative values
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to percentages and degrees
  h = Math.round(h * 360 * 10) / 10;
  s = Math.round(s * 100 * 10) / 10;
  l = Math.round(l * 100 * 10) / 10;

  return `${h} ${s}% ${l}%`;
}

/**
 * Calculates the relative luminance of a color to determine if text should be light or dark.
 * Returns true if the color is considered 'light', meaning dark text should be used.
 * Standard WCAG formula.
 */
export function isLightColor(hex: string): boolean {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Convert to sRGB
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  
  // 0.179 is a common threshold for determining light vs dark backgrounds
  return luminance > 0.179;
}
