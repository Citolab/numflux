import type {
  DisplayValue,
  NumpadAction,
  NumpadConfig,
  NumpadDigit,
  NumpadState,
  NumpadOptions
} from "@/types";
import {
  createNumpadState,
  formatDisplayValue,
  mapKeyToAction,
  normalizeConfig,
  reduceNumpad
} from "@/core/numpad";
import { getDefaultLabel, LABEL_THEMES } from "@/utils";
import { canToggleSign, canAddDigit } from "@/utils/validation.utils";
import { createMaskDisplay, type MaskDisplayElement } from "@/core/numpad-mask";
import { parseMask, isMaskComplete } from "@/utils/mask.utils";

// Helper function to safely set attributes (compatible with both real DOM and test mocks)
function safeSetAttribute(element: Element | HTMLElement, name: string, value: string): void {
  if (element && "setAttribute" in element && typeof element.setAttribute === "function") {
    element.setAttribute(name, value);
  }
}

type KeyVariant = "accent" | "ghost" | "default";

interface KeyDescriptor {
  label: string;
  action: NumpadAction;
  variant?: KeyVariant;
}

export interface NumpadDomOptions extends Partial<NumpadConfig>, Partial<NumpadOptions> {
  initialValue?: string;
  onChange?: (state: NumpadState, display: DisplayValue) => void;
  onSubmit?: (state: NumpadState, display: DisplayValue) => void;
  labels?: Partial<Record<"clear" | "delete" | "submit" | "decimal" | "toggleSign", string>>;
  placeholder?: string;
  label?: string;
  /** Label theme - controls button icons/text using predefined themes */
  labelTheme?: "ascii" | "unicode" | "symbols" | "minimal";
  /** Custom CSS classes to apply */
  className?: string;
  /** Custom styles object to apply */
  styles?: Partial<CSSStyleDeclaration>;
  /** Theme configuration */
  theme?: {
    /** CSS custom properties */
    cssVars?: Record<string, string>;
    /** Data attribute value for theme switching */
    name?: string;
  };
  /** Accessibility options */
  a11y?: {
    /** Component accessible name */
    label?: string;
    /** Description of the numpad's purpose */
    description?: string;
    /** Announce value changes to screen readers */
    announceChanges?: boolean;
  };
  /** Locale for mask display (affects decimal separator) */
  locale?: string;
}

export interface NumpadDomInstance {
  root: HTMLElement;
  display: HTMLElement;
  keypad: HTMLElement;
  announcer?: HTMLElement;
  maskDisplay?: MaskDisplayElement;
  dispatch: (action: NumpadAction) => NumpadState;
  getState: () => NumpadState;
  destroy: () => void;
}

/**
 * Core DOM implementation of the numpad
 * Framework-agnostic, provides the essential DOM structure and behavior
 */
export function createNumpadDom(
  target: HTMLElement,
  options: NumpadDomOptions = {}
): NumpadDomInstance {
  const config = normalizeConfig(options);
  let state = createNumpadState(options.initialValue ?? "", config);

  // Create DOM structure
  const root = document.createElement("div");
  root.className = `numflux-numpad ${options.className || ""}`.trim();
  root.tabIndex = 0;

  // Accessibility attributes
  safeSetAttribute(root, "role", "application");
  safeSetAttribute(
    root,
    "aria-label",
    options.a11y?.label || options.label || "Number input keypad"
  );
  if (options.a11y?.description) {
    safeSetAttribute(root, "aria-description", options.a11y.description);
  }

  // Apply theme
  if (options.theme?.name) {
    root.dataset.theme = options.theme.name;
  }

  // Apply custom styles
  if (options.styles) {
    Object.assign(root.style, options.styles);
  }

  // Apply CSS custom properties
  if (options.theme?.cssVars) {
    for (const [prop, value] of Object.entries(options.theme.cssVars)) {
      root.style.setProperty(prop, value);
    }
  }

  const display = document.createElement("div");
  display.className = "numflux-display";
  safeSetAttribute(display, "role", "textbox");
  safeSetAttribute(display, "aria-readonly", "true");
  safeSetAttribute(display, "aria-label", "Current value");

  // Create mask display if mask is configured
  let maskDisplay: MaskDisplayElement | undefined;
  if (config.mask) {
    try {
      const maskFormat = parseMask(config.mask);
      const locale =
        options.locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
      maskDisplay = createMaskDisplay(maskFormat, {
        showCharacterSlots: true,
        charWidth: "1.2ch",
        locale
      });
    } catch (error) {
      console.warn("Failed to create mask display:", error);
    }
  }

  const keypad = document.createElement("div");
  keypad.className = "numflux-keypad";
  safeSetAttribute(keypad, "role", "grid");
  safeSetAttribute(keypad, "aria-label", "Number input buttons");

  // Create live region for announcements
  let announcer: HTMLElement | undefined;
  if (options.a11y?.announceChanges !== false) {
    announcer = document.createElement("div");
    announcer.className = "numflux-announcer";
    safeSetAttribute(announcer, "aria-live", "polite");
    safeSetAttribute(announcer, "aria-atomic", "true");
    announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
  }

  // Build and mount keys
  const keys = buildKeys(config, options.labels, options.labelTheme);
  keys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `numflux-button ${buildButtonClassName(key.variant)}`.trim();
    button.textContent = key.label;
    button.dataset.action = key.action.type;

    // Accessibility attributes
    safeSetAttribute(button, "aria-label", getButtonAriaLabel(key));
    safeSetAttribute(button, "role", "gridcell");
    safeSetAttribute(button, "tabindex", "-1");

    button.addEventListener("click", () => {
      if (!button.disabled) {
        dispatch(key.action);
      }
    });
    keypad.appendChild(button);
  });

  root.appendChild(display);
  root.appendChild(keypad);
  if (announcer) {
    root.appendChild(announcer);
  }

  // Append mask display to the display container if available
  if (maskDisplay) {
    display.appendChild(maskDisplay.container);
  }

  target.appendChild(root);

  const updateButtonStates = () => {
    const buttons = keypad.querySelectorAll("button");
    buttons.forEach((button) => {
      const action = button.dataset.action;
      let isDisabled = false;

      if (action === "toggle-sign") {
        isDisabled = !canToggleSign(state.value, config);
      } else if (action === "decimal") {
        isDisabled = !config.allowDecimal;
      } else if (action?.startsWith("digit:")) {
        const digit = parseInt(action.split(":")[1]);

        // Check mask completion first
        if (config.mask && state.maskState) {
          try {
            const maskFormat = parseMask(config.mask);
            isDisabled = isMaskComplete(state.maskState, maskFormat);
          } catch {
            isDisabled = false;
          }
        }

        // If not disabled by mask, check value constraints
        if (!isDisabled && !isNaN(digit)) {
          isDisabled = !canAddDigit(state.value, digit, config);
        }
      }

      button.disabled = isDisabled;
      // Use data attribute so integrations can style based on this
      if (isDisabled) {
        button.dataset.disabled = "true";
      } else {
        delete button.dataset.disabled;
      }

      safeSetAttribute(button, "aria-disabled", isDisabled ? "true" : "false");
      safeSetAttribute(button, "tabindex", isDisabled ? "-1" : "-1"); // Keep -1 for grid navigation
    });
  };

  const updateDisplay = () => {
    const displayValue = formatDisplayValue(state, config);
    display.dataset.raw = displayValue.raw;

    // Update validation error state
    if (state.validationError) {
      display.dataset.error = state.validationError;
      safeSetAttribute(display, "aria-invalid", "true");
      safeSetAttribute(display, "aria-describedby", `${display.id || "numflux-display"}-error`);
    } else {
      delete display.dataset.error;
      safeSetAttribute(display, "aria-invalid", "false");
      safeSetAttribute(display, "aria-describedby", "");
    }

    // Update mask display if available
    if (maskDisplay && state.maskState) {
      // Clear any text content from the display element when using mask
      if (
        display.childNodes.length > 1 ||
        (display.childNodes.length === 1 && display.childNodes[0] !== maskDisplay.container)
      ) {
        // Remove text nodes, keep only mask display
        Array.from(display.childNodes).forEach((node) => {
          if (node !== maskDisplay.container) {
            display.removeChild(node);
          }
        });
      }
      maskDisplay.update(state.maskState);
    } else {
      // Standard display without mask
      display.textContent = displayValue.formatted || "0";
    }

    safeSetAttribute(display, "aria-valuenow", displayValue.numeric?.toString() || "");
    safeSetAttribute(display, "aria-valuetext", displayValue.formatted || "empty");
    updateButtonStates();
  };

  const announceChange = (action: NumpadAction, newValue: string) => {
    if (!announcer || options.a11y?.announceChanges === false) return;

    let message = "";
    switch (action.type) {
      case "digit":
        message = `${action.digit}`;
        break;
      case "decimal":
        message = "decimal point";
        break;
      case "delete":
        message = "deleted";
        break;
      case "clear":
        message = "cleared, value is now empty";
        break;
      case "submit":
        message = `submitted value ${newValue}`;
        break;
      case "toggle-sign":
        message = newValue.startsWith("-") ? "negative" : "positive";
        break;
      case "set":
        message = `value set to ${newValue}`;
        break;
    }

    // Announce the change with a slight delay to ensure it's read
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = message;
      }
    }, 10);
  };

  const dispatch = (action: NumpadAction): NumpadState => {
    const nextState = reduceNumpad(state, action, config);
    const displayValue = formatDisplayValue(nextState, config);
    const changed = nextState.value !== state.value || action.type === "submit";

    state = nextState;
    updateDisplay();

    // Announce the change for screen readers
    if (changed) {
      announceChange(action, displayValue.formatted || "");
    }

    // Handle sync mode - call onChange during input if enabled
    if (config.sync && changed && options.onChange) {
      options.onChange(nextState, displayValue);
    } else if (!config.sync && action.type === "submit" && changed && options.onChange) {
      options.onChange(nextState, displayValue);
    }

    if (action.type === "submit" && options.onSubmit) {
      options.onSubmit(nextState, displayValue);
    }

    return state;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const action = mapKeyToAction(event.key, config, state.value);
    if (!action) return;
    event.preventDefault();
    dispatch(action);
  };

  root.addEventListener("keydown", handleKeydown);
  updateDisplay();

  const destroy = () => {
    root.removeEventListener("keydown", handleKeydown);
    if (maskDisplay) {
      maskDisplay.destroy();
    }
    root.remove();
  };

  return {
    root,
    display,
    keypad,
    announcer,
    maskDisplay,
    dispatch,
    getState: () => state,
    destroy
  };
}

function buildKeys(
  config: NumpadConfig,
  customLabels?: NumpadDomOptions["labels"],
  labelTheme?: NumpadDomOptions["labelTheme"]
): KeyDescriptor[] {
  // Helper to resolve labels with theme support
  const resolveLabel = (key: string, fallback: string): string => {
    if (customLabels && customLabels[key as keyof typeof customLabels]) {
      return customLabels[key as keyof typeof customLabels]!;
    }

    if (labelTheme && LABEL_THEMES[labelTheme]) {
      const themeConfig = LABEL_THEMES[labelTheme];
      const themeLabel = themeConfig[key as keyof typeof themeConfig];
      if (themeLabel) {
        return themeLabel;
      }
    }

    return fallback;
  };

  const decimalLabel = resolveLabel("decimal", getDefaultLabel("decimal", config.decimalSeparator));
  const deleteLabel = resolveLabel("delete", getDefaultLabel("delete"));
  const clearLabel = resolveLabel("clear", getDefaultLabel("clear"));
  const submitLabel = resolveLabel("submit", getDefaultLabel("submit"));
  const toggleSignLabel = resolveLabel("toggleSign", getDefaultLabel("toggleSign"));

  const digits: KeyDescriptor[] = [7, 8, 9, 4, 5, 6, 1, 2, 3].map((digit) => ({
    label: String(digit),
    action: { type: "digit", digit: digit as NumpadDigit }
  }));

  const bottomRow: KeyDescriptor[] = [
    { label: toggleSignLabel, action: { type: "toggle-sign" }, variant: "ghost" },
    { label: "0", action: { type: "digit", digit: 0 } },
    { label: decimalLabel, action: { type: "decimal" }, variant: "ghost" }
  ];

  return [
    ...digits.slice(0, 3),
    { label: deleteLabel, action: { type: "delete" }, variant: "ghost" },
    ...digits.slice(3, 6),
    { label: clearLabel, action: { type: "clear" }, variant: "ghost" },
    ...digits.slice(6, 9),
    { label: submitLabel, action: { type: "submit" }, variant: "accent" },
    ...bottomRow
  ];
}

function buildButtonClassName(variant: KeyVariant = "default"): string {
  const classes = ["numflux-button"];
  if (variant === "accent") classes.push("numflux-button--accent");
  if (variant === "ghost") classes.push("numflux-button--ghost");
  return classes.join(" ");
}

function getButtonAriaLabel(key: KeyDescriptor): string {
  const { action, label } = key;

  switch (action.type) {
    case "digit":
      return `${label}, digit button`;
    case "decimal":
      return `${label}, decimal point button`;
    case "delete":
      return `${label}, delete last digit button`;
    case "clear":
      return `${label}, clear all button`;
    case "submit":
      return `${label}, submit value button`;
    case "toggle-sign":
      return `${label}, toggle positive negative button`;
    default:
      return `${label} button`;
  }
}
