// Simple label utilities with better TypeScript compatibility

// Default ASCII labels (most compatible)
export const DEFAULT_LABELS = {
  clear: "C",
  delete: "←",
  submit: "OK",
  decimal: ".",
  toggleSign: "+/-"
} as const;

// Built-in themed label sets
export const LABEL_THEMES = {
  ascii: {
    delete: "DEL",
    submit: "ENTER",
    toggleSign: "+/-"
  },
  unicode: {
    delete: "←",
    submit: "✓",
    toggleSign: "±"
  },
  symbols: {
    delete: "⌫",
    submit: "↵",
    toggleSign: "±"
  },
  minimal: {
    delete: "⌫",
    submit: "✓",
    clear: "×",
    toggleSign: "±"
  }
} as const;

export function getDefaultLabel(type: string, decimalSeparator?: string): string {
  if (type === "decimal" && decimalSeparator) {
    return decimalSeparator;
  }

  switch (type) {
    case "clear":
      return DEFAULT_LABELS.clear;
    case "delete":
      return DEFAULT_LABELS.delete;
    case "submit":
      return DEFAULT_LABELS.submit;
    case "decimal":
      return DEFAULT_LABELS.decimal;
    case "toggleSign":
      return DEFAULT_LABELS.toggleSign;
    default:
      return "";
  }
}

/**
 * Enhanced label element creator that supports multiple formats including
 * custom elements, SVG strings, images, and render functions
 */
export function createLabelElement(config: unknown, alt?: string): HTMLElement | Text {
  // Handle simple string labels
  if (typeof config === "string") {
    return document.createTextNode(config);
  }

  // Handle icon configuration objects
  if (typeof config === "object" && config !== null) {
    const iconConfig = config as Record<string, unknown>;

    // Handle custom render function (most flexible)
    if (typeof iconConfig.render === "function") {
      const container = document.createElement("span");
      const className = typeof iconConfig.className === "string" ? iconConfig.className : "";
      container.className = `numpad-icon ${className}`.trim();
      try {
        (iconConfig.render as (container: HTMLElement, alt?: string) => void)(
          container,
          (iconConfig.alt as string) || alt
        );
      } catch (error) {
        console.warn("Label render function failed:", error);
        container.textContent = alt || "";
      }
      return container;
    }

    // Handle pre-created HTML elements (e.g., from React portals)
    if (iconConfig.element && iconConfig.element instanceof HTMLElement) {
      const cloned = iconConfig.element.cloneNode(true) as HTMLElement;
      const className = typeof iconConfig.className === "string" ? iconConfig.className : "";
      if (className) {
        cloned.className += ` ${className}`;
      }
      return cloned;
    }

    // Handle SVG strings
    if (typeof iconConfig.svg === "string" && iconConfig.svg) {
      const container = document.createElement("span");
      const className = typeof iconConfig.className === "string" ? iconConfig.className : "";
      container.className = `numpad-icon ${className}`.trim();
      container.innerHTML = iconConfig.svg;
      container.setAttribute("aria-label", (iconConfig.alt as string) || alt || "");
      container.setAttribute("role", "img");
      return container;
    }

    // Handle image URLs
    if (typeof iconConfig.image === "string" && iconConfig.image) {
      const img = document.createElement("img");
      img.src = iconConfig.image;
      img.alt = (iconConfig.alt as string) || alt || "";
      const className = typeof iconConfig.className === "string" ? iconConfig.className : "";
      img.className = `numpad-icon ${className}`.trim();
      img.style.width = "1em";
      img.style.height = "1em";
      img.style.display = "inline-block";
      return img;
    }

    // Handle text fallback
    if (typeof iconConfig.text === "string" && iconConfig.text) {
      return document.createTextNode(iconConfig.text);
    }
  }

  // Ultimate fallback
  return document.createTextNode(alt || "");
}
