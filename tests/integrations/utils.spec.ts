import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  compose,
  getButtonVariant,
  toArray,
  withAttributes,
  withClassNames,
  withEventHandlers,
  withTheme
} from "@/integrations/utils";
import { BUTTON_VARIANTS } from "@/constants/constants";

type MockInstance = {
  root: HTMLElement;
  display: HTMLElement;
  keypad: HTMLElement;
  destroy: () => void;
};

const createMockInstance = (): MockInstance => {
  const root = document.createElement("div");
  const display = document.createElement("div");
  const keypad = document.createElement("div");
  keypad.innerHTML = `
    <button data-action="digit">1</button>
    <button data-action="submit">✓</button>
    <button data-action="delete">⌫</button>
  `;

  return {
    root,
    display,
    keypad,
    destroy: vi.fn()
  };
};

describe("utils", () => {
  let instance: MockInstance;

  beforeEach(() => {
    instance = createMockInstance();
  });

  it("toArray normalizes values", () => {
    expect(toArray()).toEqual([]);
    expect(toArray(null)).toEqual([]);
    expect(toArray("a")).toEqual(["a"]);
    expect(toArray(["a", "b"])).toEqual(["a", "b"]);
  });

  it("getButtonVariant detects variants", () => {
    const buttons = Array.from(instance.keypad.querySelectorAll("button"));
    const [digit, submit, del] = buttons;
    expect(getButtonVariant(digit)).toBe("default");
    expect(getButtonVariant(submit)).toBe("accent");
    expect(getButtonVariant(del)).toBe("ghost");
  });

  it("getButtonVariant handles other ghost and default cases", () => {
    const clear = document.createElement("button");
    clear.dataset.action = "clear";
    const toggle = document.createElement("button");
    toggle.dataset.action = "toggle-sign";
    const decimal = document.createElement("button");
    decimal.dataset.action = "decimal";
    const unknown = document.createElement("button");

    expect(getButtonVariant(clear)).toBe(BUTTON_VARIANTS.clear);
    expect(getButtonVariant(toggle)).toBe(BUTTON_VARIANTS["toggle-sign"]);
    expect(getButtonVariant(decimal)).toBe(BUTTON_VARIANTS.decimal);
    expect(getButtonVariant(unknown)).toBe(BUTTON_VARIANTS.digit);
  });

  it("withClassNames applies classes", () => {
    withClassNames(instance as any, {
      container: ["a"],
      display: "b",
      keypad: ["c", "d"],
      button: "btn",
      buttonAccent: "accent",
      buttonGhost: ["ghost"]
    });

    expect(instance.root.className).toContain("a");
    expect(instance.display.className).toContain("b");
    expect(instance.keypad.className).toContain("c");
    expect(instance.keypad.className).toContain("d");

    const buttons = Array.from(instance.keypad.querySelectorAll("button"));
    const [digit, submit, del] = buttons;
    expect(digit?.className).toContain("btn");
    expect(submit?.className).toContain("accent");
    expect(del?.className).toContain("ghost");
  });

  it("withTheme applies theme props", () => {
    withTheme(instance as any, {
      name: "dark",
      className: "theme",
      cssVars: { "--color": "red" }
    });

    expect(instance.root.dataset.theme).toBe("dark");
    expect(instance.root.className).toContain("theme");
    expect(instance.root.style.getPropertyValue("--color")).toBe("red");
  });

  it("withTheme handles empty theme safely", () => {
    const result = withTheme(instance as any, {});
    expect(result).toBe(instance);
    expect(instance.root.dataset.theme).toBeUndefined();
  });

  it("withAttributes applies attributes", () => {
    withAttributes(instance as any, {
      container: { role: "application" },
      display: { "aria-live": "polite" },
      keypad: { "data-test": "pad" },
      buttons: { "data-button": "true" }
    });

    expect(instance.root.getAttribute("role")).toBe("application");
    expect(instance.display.getAttribute("aria-live")).toBe("polite");
    expect(instance.keypad.getAttribute("data-test")).toBe("pad");

    instance.keypad.querySelectorAll("button").forEach((button) => {
      expect(button.getAttribute("data-button")).toBe("true");
    });
  });

  it("withAttributes is a no-op when no attributes passed", () => {
    const setRoot = vi.spyOn(instance.root, "setAttribute");
    withAttributes(instance as any, {});
    expect(setRoot).not.toHaveBeenCalled();
  });

  it("withEventHandlers wires and cleans up events", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();

    withEventHandlers(instance as any, { onFocus, onBlur, onKeyDown, onMouseEnter, onMouseLeave });

    instance.root.dispatchEvent(new FocusEvent("focus"));
    instance.root.dispatchEvent(new FocusEvent("blur"));
    instance.root.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    instance.root.dispatchEvent(new Event("mouseenter"));
    instance.root.dispatchEvent(new Event("mouseleave"));

    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
    expect(onMouseEnter).toHaveBeenCalled();
    expect(onMouseLeave).toHaveBeenCalled();

    instance.destroy();

    instance.root.dispatchEvent(new FocusEvent("focus"));
    instance.root.dispatchEvent(new FocusEvent("blur"));
    instance.root.dispatchEvent(new Event("mouseenter"));
    instance.root.dispatchEvent(new Event("mouseleave"));
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it("withEventHandlers calls original destroy and removes listeners", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const removeSpy = vi.spyOn(instance.root, "removeEventListener");
    const originalDestroy = instance.destroy;

    withEventHandlers(instance as any, { onFocus, onBlur, onKeyDown, onMouseEnter, onMouseLeave });
    instance.destroy();

    expect(removeSpy).toHaveBeenCalledWith("focus", onFocus);
    expect(removeSpy).toHaveBeenCalledWith("blur", onBlur);
    expect(removeSpy).toHaveBeenCalledWith("keydown", onKeyDown);
    expect(removeSpy).toHaveBeenCalledWith("mouseenter", onMouseEnter);
    expect(removeSpy).toHaveBeenCalledWith("mouseleave", onMouseLeave);
    expect(originalDestroy).toHaveBeenCalled();
  });

  it("compose chains functions", () => {
    const fn1 = vi.fn((x: number) => x + 1);
    const fn2 = vi.fn((x: number) => x * 2);
    const composed = compose(fn1, fn2);

    const result = composed(3);
    expect(result).toBe(8);
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });
});
