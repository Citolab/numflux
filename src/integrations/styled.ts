import { createNumpadDom, type NumpadDomOptions, type NumpadDomInstance } from "@/core/numpad-dom";
import "@/styles/numpad.global.css";
import { getButtonVariant } from "./utils";

export interface CreateNumpadOptions extends Omit<
  NumpadDomOptions,
  "className" | "styles" | "theme"
> {
  /** Theme name - controls CSS custom properties via data attribute */
  theme?: "dark" | "light";
  /** Additional CSS classes to apply to container */
  className?: string;
}

export interface CreateNumpadInstance extends NumpadDomInstance {}

/**
 * Creates a styled numpad with global CSS classes.
 * Requires CSS import: import "@citolab/numflux/dist/style.css"
 */
export function createNumpad(
  target: HTMLElement,
  options: CreateNumpadOptions = {}
): CreateNumpadInstance {
  const { theme, className, ...domOptions } = options;

  // Create the core DOM instance with theme support
  const instance = createNumpadDom(target, {
    ...domOptions,
    theme: theme ? { name: theme } : undefined
  });

  // Apply numflux CSS classes to structure
  instance.root.classList.add("nf-container");
  instance.display.classList.add("nf-display");
  instance.keypad.classList.add("nf-keypad");

  // Apply announcer class if it exists
  if (instance.announcer && "classList" in instance.announcer) {
    instance.announcer.classList.add("nf-announcer");
  }

  // Apply custom class name
  if (className) {
    instance.root.classList.add(className);
  }

  // Apply CSS classes to buttons
  const buttons = instance.keypad.querySelectorAll("button");
  buttons.forEach((button) => {
    const variant = getButtonVariant(button);
    button.classList.add("nf-button");

    if (variant === "accent") {
      button.classList.add("nf-button-accent");
    } else if (variant === "ghost") {
      button.classList.add("nf-button-ghost");
    }
  });

  return instance;
}
