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
