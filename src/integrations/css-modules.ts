import { createNumpadDom, type NumpadDomOptions, type NumpadDomInstance } from "@/core/numpad-dom";
import type { NumpadAction } from "@/types";
import { applyModuleClasses } from "@/utils";

import { getButtonVariant } from "./utils";

import rawStyles from "@/styles/numpad.module.css";

const styles = rawStyles as Record<string, string>;
type StyleKey = keyof typeof styles;

export interface CssModulesNumpadOptions extends Omit<
  NumpadDomOptions,
  "className" | "styles" | "theme"
> {
  theme?: "dark" | "light";
  className?: string;
}

export interface CssModulesNumpadInstance extends NumpadDomInstance {}

/**
 * Apply CSS Modules classes to mask display elements
 */
function applyMaskClasses(displayElement: HTMLElement): void {
  // Apply classes to mask display container
  const maskDisplay = displayElement.querySelector(".nf-mask-display");
  if (maskDisplay) {
    applyModuleClasses(maskDisplay, styles, "maskDisplay");
  }

  // Apply classes to mask components
  const maskFraction = displayElement.querySelector(".nf-mask-fraction");
  if (maskFraction) {
    applyModuleClasses(maskFraction, styles, "maskFraction");
  }

  const maskFractionContainer = displayElement.querySelector(".nf-mask-fraction-container");
  if (maskFractionContainer) {
    applyModuleClasses(maskFractionContainer, styles, "maskFractionContainer");
  }

  const maskNumerator = displayElement.querySelector(".nf-mask-numerator");
  if (maskNumerator) {
    applyModuleClasses(maskNumerator, styles, "maskNumerator");
  }

  const maskDenominator = displayElement.querySelector(".nf-mask-denominator");
  if (maskDenominator) {
    applyModuleClasses(maskDenominator, styles, "maskDenominator");
  }

  const maskDivisionLine = displayElement.querySelector(".nf-mask-division-line");
  if (maskDivisionLine) {
    applyModuleClasses(maskDivisionLine, styles, "maskDivisionLine");
  }

  const maskDecimal = displayElement.querySelector(".nf-mask-decimal");
  if (maskDecimal) {
    applyModuleClasses(maskDecimal, styles, "maskDecimal");
  }

  const maskSeparator = displayElement.querySelector(".nf-mask-separator");
  if (maskSeparator) {
    applyModuleClasses(maskSeparator, styles, "maskSeparator");
  }

  const maskSimple = displayElement.querySelector(".nf-mask-simple");
  if (maskSimple) {
    applyModuleClasses(maskSimple, styles, "maskSimple");
  }

  const maskPrefix = displayElement.querySelector(".nf-mask-prefix");
  if (maskPrefix) {
    applyModuleClasses(maskPrefix, styles, "maskPrefix");
  }

  const maskSuffix = displayElement.querySelector(".nf-mask-suffix");
  if (maskSuffix) {
    applyModuleClasses(maskSuffix, styles, "maskSuffix");
  }

  displayElement.querySelectorAll(".nf-mask-char-slot").forEach((slot) => {
    applyModuleClasses(slot, styles, "maskCharSlot");
  });

  const maskInteger = displayElement.querySelector(".nf-mask-integer");
  if (maskInteger) {
    applyModuleClasses(maskInteger, styles, "maskInteger");
  }

  const maskFractional = displayElement.querySelector(".nf-mask-fractional");
  if (maskFractional) {
    applyModuleClasses(maskFractional, styles, "maskFractional");
  }
}

/**
 * Integration layer that adds CSS Modules styling to the core DOM implementation
 */
export function mountNumpad(
  target: HTMLElement,
  options: CssModulesNumpadOptions = {}
): CssModulesNumpadInstance {
  const { theme, className, ...domOptions } = options;

  // Create the core DOM instance with theme support
  const instance = createNumpadDom(target, {
    ...domOptions,
    theme: theme ? { name: theme } : undefined
  });

  // Apply CSS Modules classes to structure
  applyModuleClasses(instance.root, styles, "container");
  applyModuleClasses(instance.display, styles, "display");
  applyModuleClasses(instance.keypad, styles, "keypad");

  // Apply mask classes to dynamically created mask elements
  applyMaskClasses(instance.display);

  // Apply custom class name
  if (className) {
    instance.root.classList.add(className);
  }

  const updateButtonClasses = () => {
    const buttons = instance.keypad.querySelectorAll("button");
    buttons.forEach((button: HTMLButtonElement) => {
      const isDisabled = button.disabled;
      const variant = getButtonVariant(button);

      // Remove all existing classes and reapply with current disabled state
      button.className = "";
      applyModuleClasses(button, styles, ...buildButtonClassNames(variant, isDisabled));
    });
  };

  // Apply CSS Modules classes to buttons
  const buttons = instance.keypad.querySelectorAll("button");
  buttons.forEach((button) => {
    const variant = getButtonVariant(button);
    applyModuleClasses(button, styles, ...buildButtonClassNames(variant));
  });

  // Apply initial disabled classes
  updateButtonClasses();

  // Store original dispatch method to enhance it with disabled class handling
  const originalDispatch = instance.dispatch;
  instance.dispatch = (action: NumpadAction) => {
    const result = originalDispatch(action);
    updateButtonClasses();
    return result;
  };

  return instance;
}

function buildButtonClassNames(
  variant: "accent" | "ghost" | "default" = "default",
  disabled = false
): StyleKey[] {
  const classes: StyleKey[] = ["button"];
  if (variant === "accent") classes.push("buttonAccent");
  if (variant === "ghost") classes.push("buttonGhost");
  if (disabled) classes.push("buttonDisabled");
  return classes;
}
