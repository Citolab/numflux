/**
 * Composable utilities for building numpad integrations
 * These functions can be used by any integration layer to add common functionality
 */

import { BUTTON_VARIANTS } from "@/constants";

import type { NumpadDomInstance } from "@/core/numpad-dom";
import type { ButtonVariant, ButtonActionType } from "@/types";

/**
 * Adds CSS class application utilities to a numpad instance
 */
export function withClassNames(
  instance: NumpadDomInstance,
  classMap: {
    container?: string | string[];
    display?: string | string[];
    keypad?: string | string[];
    button?: string | string[];
    buttonAccent?: string | string[];
    buttonGhost?: string | string[];
  }
) {
  if (classMap.container) {
    const containerClasses = Array.isArray(classMap.container)
      ? classMap.container
      : [classMap.container];
    instance.root.classList.add(...containerClasses);
  }

  if (classMap.display) {
    const displayClasses = Array.isArray(classMap.display) ? classMap.display : [classMap.display];
    instance.display.classList.add(...displayClasses);
  }

  if (classMap.keypad) {
    const keypadClasses = Array.isArray(classMap.keypad) ? classMap.keypad : [classMap.keypad];
    instance.keypad.classList.add(...keypadClasses);
  }

  if (classMap.button || classMap.buttonAccent || classMap.buttonGhost) {
    const buttons = instance.keypad.querySelectorAll("button");
    buttons.forEach((button) => {
      const variant = getButtonVariant(button);

      if (classMap.button) {
        const buttonClasses = Array.isArray(classMap.button) ? classMap.button : [classMap.button];
        button.classList.add(...buttonClasses);
      }

      if (variant === "accent" && classMap.buttonAccent) {
        const accentClasses = Array.isArray(classMap.buttonAccent)
          ? classMap.buttonAccent
          : [classMap.buttonAccent];
        button.classList.add(...accentClasses);
      }

      if (variant === "ghost" && classMap.buttonGhost) {
        const ghostClasses = Array.isArray(classMap.buttonGhost)
          ? classMap.buttonGhost
          : [classMap.buttonGhost];
        button.classList.add(...ghostClasses);
      }
    });
  }

  return instance;
}

/**
 * Adds theme support to a numpad instance
 */
export function withTheme(
  instance: NumpadDomInstance,
  theme: {
    name?: string;
    cssVars?: Record<string, string>;
    className?: string;
  }
) {
  if (theme.name) {
    instance.root.dataset.theme = theme.name;
  }

  if (theme.cssVars) {
    for (const [prop, value] of Object.entries(theme.cssVars)) {
      instance.root.style.setProperty(prop, value);
    }
  }

  if (theme.className) {
    instance.root.classList.add(theme.className);
  }

  return instance;
}

/**
 * Adds event handling utilities to a numpad instance
 */
export function withEventHandlers(
  instance: NumpadDomInstance,
  handlers: {
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
  }
) {
  const { onFocus, onBlur, onKeyDown, onMouseEnter, onMouseLeave } = handlers;

  if (onFocus) {
    instance.root.addEventListener("focus", onFocus);
  }

  if (onBlur) {
    instance.root.addEventListener("blur", onBlur);
  }

  if (onKeyDown) {
    instance.root.addEventListener("keydown", onKeyDown);
  }

  if (onMouseEnter) {
    instance.root.addEventListener("mouseenter", onMouseEnter);
  }

  if (onMouseLeave) {
    instance.root.addEventListener("mouseleave", onMouseLeave);
  }

  // Enhance destroy to clean up event listeners
  const originalDestroy = instance.destroy;
  instance.destroy = () => {
    if (onFocus) instance.root.removeEventListener("focus", onFocus);
    if (onBlur) instance.root.removeEventListener("blur", onBlur);
    if (onKeyDown) instance.root.removeEventListener("keydown", onKeyDown);
    if (onMouseEnter) instance.root.removeEventListener("mouseenter", onMouseEnter);
    if (onMouseLeave) instance.root.removeEventListener("mouseleave", onMouseLeave);
    originalDestroy();
  };

  return instance;
}

/**
 * Adds custom attributes to a numpad instance
 */
export function withAttributes(
  instance: NumpadDomInstance,
  attributes: {
    container?: Record<string, string>;
    display?: Record<string, string>;
    keypad?: Record<string, string>;
    buttons?: Record<string, string>;
  }
) {
  if (attributes.container) {
    for (const [key, value] of Object.entries(attributes.container)) {
      instance.root.setAttribute(key, value);
    }
  }

  if (attributes.display) {
    for (const [key, value] of Object.entries(attributes.display)) {
      instance.display.setAttribute(key, value);
    }
  }

  if (attributes.keypad) {
    for (const [key, value] of Object.entries(attributes.keypad)) {
      instance.keypad.setAttribute(key, value);
    }
  }

  if (attributes.buttons) {
    const buttons = instance.keypad.querySelectorAll("button");
    buttons.forEach((button) => {
      for (const [key, value] of Object.entries(attributes.buttons!)) {
        button.setAttribute(key, value);
      }
    });
  }

  return instance;
}

/**
 * Utility function to determine button variant based on action
 */

const isButtonAction = (action: string): action is ButtonActionType => action in BUTTON_VARIANTS;

export function getButtonVariant(button: HTMLButtonElement): ButtonVariant {
  const action = button.dataset.action;
  if (action && isButtonAction(action)) {
    return BUTTON_VARIANTS[action];
  }
  return "default";
}

/**
 * Compose multiple enhancement functions
 */
export function compose<T>(...fns: Array<(instance: T) => T>) {
  return (instance: T): T => {
    return fns.reduce((acc, fn) => fn(acc), instance);
  };
}

export type ClassLike = { classList: { add: (...tokens: string[]) => void } };

export function toArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
