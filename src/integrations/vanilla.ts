import { createNumpadDom, type NumpadDomOptions, type NumpadDomInstance } from "@/core/numpad-dom";
import { applyModuleClasses } from "@/utils";

import { getButtonVariant } from "./utils";

import rawStyles from "@/styles/numpad.module.css";

const styles = rawStyles as Record<string, string>;
type StyleKey = keyof typeof styles;

export interface VanillaNumpadOptions extends Omit<
  NumpadDomOptions,
  "className" | "styles" | "theme"
> {
  /** Theme name - controls CSS custom properties via data attribute */
  theme?: "dark" | "light";
  /** Additional CSS classes to apply to container */
  className?: string;
}

export interface VanillaNumpadInstance extends NumpadDomInstance {}

/**
 * Vanilla integration layer that adds CSS Modules styling to the core DOM implementation
 */
export function mountNumpad(
  target: HTMLElement,
  options: VanillaNumpadOptions = {}
): VanillaNumpadInstance {
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

  // Apply CSS Modules classes to buttons
  const buttons = instance.keypad.querySelectorAll("button");
  buttons.forEach((button) => {
    const variant = getButtonVariant(button);
    applyModuleClasses(button, styles, ...buildButtonClassNames(variant));
  });

  return instance;
}

function buildButtonClassNames(variant: "accent" | "ghost" | "default" = "default"): StyleKey[] {
  const classes: StyleKey[] = ["button"];
  if (variant === "accent") classes.push("buttonAccent");
  if (variant === "ghost") classes.push("buttonGhost");
  return classes;
}
