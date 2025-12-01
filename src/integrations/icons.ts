/**
 * Generic helpers for integrating any icon library with numflux
 */

/**
 * Helper to create labels from SVG strings or objects
 * Works with any icon library that provides SVG content (Lucide, Heroicons, etc.)
 *
 * @example with Lucide
 * import { X, Check } from 'lucide-react';
 * const theme = createSvgIconTheme({
 *   delete: X.toString(), // or extract SVG string however your library provides
 *   submit: Check.toString()
 * });
 */
export function createSvgIconTheme(
  iconMap: Record<string, string | { svg: string; alt?: string }>
) {
  const theme: Record<string, { svg: string; alt: string }> = {};

  for (const [action, icon] of Object.entries(iconMap)) {
    if (typeof icon === "string") {
      theme[action] = {
        svg: icon,
        alt: action.charAt(0).toUpperCase() + action.slice(1)
      };
    } else {
      theme[action] = {
        svg: icon.svg,
        alt: icon.alt || action.charAt(0).toUpperCase() + action.slice(1)
      };
    }
  }

  return theme;
}

/**
 * Helper function to create custom icon themes using CSS classes
 * Useful for icon fonts like FontAwesome, Material Icons, etc.
 *
 * @example with FontAwesome
 * const theme = createCssIconTheme({
 *   delete: "fas fa-times",
 *   submit: "fas fa-check"
 * });
 */
export function createCssIconTheme(iconMap: Record<string, string>) {
  const theme: Record<string, { element: HTMLElement; alt: string }> = {};

  for (const [action, className] of Object.entries(iconMap)) {
    const element = document.createElement("i");
    element.className = className;
    theme[action] = {
      element,
      alt: action.charAt(0).toUpperCase() + action.slice(1)
    };
  }

  return theme;
}

/**
 * Helper to create labels from image URLs (for custom icon sets)
 *
 * @example
 * const theme = createImageIconTheme('/icons', {
 *   delete: 'x.svg',
 *   submit: 'check.svg'
 * });
 */
export function createImageIconTheme(baseUrl: string, iconMap: Record<string, string>) {
  const theme: Record<string, { image: string; alt: string }> = {};

  for (const [action, filename] of Object.entries(iconMap)) {
    theme[action] = {
      image: `${baseUrl}/${filename}`,
      alt: action.charAt(0).toUpperCase() + action.slice(1)
    };
  }

  return theme;
}

/**
 * Helper to create labels with render functions for maximum flexibility
 * Allows complete control over how icons are created and inserted
 *
 * @example with custom icon library
 * const theme = createCustomIconTheme({
 *   delete: (container) => {
 *     const icon = myIconLibrary.createElement('delete');
 *     container.appendChild(icon);
 *   }
 * });
 */
export function createCustomIconTheme(iconMap: Record<string, (container: HTMLElement) => void>) {
  const theme: Record<string, { render: (container: HTMLElement) => void; alt: string }> = {};

  for (const [action, renderFn] of Object.entries(iconMap)) {
    theme[action] = {
      render: renderFn,
      alt: action.charAt(0).toUpperCase() + action.slice(1)
    };
  }

  return theme;
}

/**
 * Helper to extract SVG strings from icon objects/components
 * Useful when working with icon libraries that return objects
 */
export function extractSvgString(iconComponent: unknown): string {
  // Handle different icon library formats
  if (typeof iconComponent === "string") {
    return iconComponent;
  }

  // Handle objects with svg property
  if (typeof iconComponent === "object" && iconComponent !== null) {
    const obj = iconComponent as Record<string, unknown>;

    if (typeof obj.svg === "string") {
      return obj.svg;
    }

    // Handle React components with render method
    if (typeof obj.render === "function") {
      // This is a placeholder - in practice you'd need to render to string
      console.warn(
        "Cannot extract SVG from React component directly. Consider using createCustomIconTheme instead."
      );
      return "";
    }

    // Try converting to string (for simple cases)
    return String(iconComponent);
  }

  return "";
}
