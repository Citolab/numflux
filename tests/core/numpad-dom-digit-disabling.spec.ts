import { describe, it, expect } from "vitest";

import { createNumpadDom, type NumpadDomInstance } from "@/core/numpad-dom";

const digitButtons = (instance: NumpadDomInstance): HTMLButtonElement[] =>
  Array.from(instance.keypad.querySelectorAll("button")).filter(
    (button) => button.dataset.action === "digit"
  );

const disabledDigits = (instance: NumpadDomInstance): string[] =>
  digitButtons(instance)
    .filter((button) => button.disabled)
    .map((button) => button.dataset.digit as string);

describe("numpad-dom digit disabling", () => {
  it("keeps all digits enabled without constraints", () => {
    const instance = createNumpadDom(document.createElement("div"));
    expect(disabledDigits(instance)).toEqual([]);
  });

  it("disables all digits once maxDigits is reached", () => {
    const instance = createNumpadDom(document.createElement("div"), { maxDigits: 2 });

    instance.dispatch({ type: "digit", digit: 1 });
    expect(disabledDigits(instance)).toEqual([]);

    instance.dispatch({ type: "digit", digit: 2 });
    expect(disabledDigits(instance)).toHaveLength(10);
  });

  it("disables only the digits that would exceed maxValue", () => {
    const instance = createNumpadDom(document.createElement("div"), { maxValue: 52 });

    instance.dispatch({ type: "digit", digit: 5 });

    expect(disabledDigits(instance).sort()).toEqual(["3", "4", "5", "6", "7", "8", "9"]);
  });

  it("does not disable digits for a positive minValue", () => {
    const instance = createNumpadDom(document.createElement("div"), { minValue: 10 });
    expect(disabledDigits(instance)).toEqual([]);
  });

  it("disables all digits when the mask is complete", () => {
    const instance = createNumpadDom(document.createElement("div"), { mask: "__" });

    instance.dispatch({ type: "digit", digit: 1 });
    instance.dispatch({ type: "digit", digit: 2 });

    expect(disabledDigits(instance)).toHaveLength(10);
  });

  it("marks disabled digits with data-disabled", () => {
    const instance = createNumpadDom(document.createElement("div"), { maxDigits: 1 });

    instance.dispatch({ type: "digit", digit: 1 });

    expect(digitButtons(instance).every((button) => button.dataset.disabled === "true")).toBe(true);
  });
});
