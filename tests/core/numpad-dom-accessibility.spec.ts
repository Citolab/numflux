import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import * as maskUtils from "@/utils/mask.utils";
import * as maskDisplay from "@/core/numpad-mask";
import { createNumpadDom } from "@/core/numpad-dom";

const originalParseMask = maskUtils.parseMask;
const realDocument = globalThis.document;

describe("numpad-dom accessibility & mask display behaviors", () => {
  beforeEach(() => {
    // Ensure we use the real jsdom document even if other tests replace it
    Object.defineProperty(globalThis, "document", {
      value: realDocument,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets aria-description when provided", () => {
    const target = document.createElement("div");
    const instance = createNumpadDom(target, {
      a11y: { description: "Test description" }
    });

    expect(instance.root.getAttribute("aria-description")).toBe("Test description");
  });

  it("attaches mask display when mask is provided", () => {
    const target = document.createElement("div");
    const instance = createNumpadDom(target, { mask: "__.___,__", locale: "nl-NL" });

    expect(instance.maskDisplay).toBeTruthy();
    expect(instance.display.contains(instance.maskDisplay!.container)).toBe(true);
  });

  it("removes stray text nodes when updating masked display", () => {
    const target = document.createElement("div");
    const instance = createNumpadDom(target, { mask: "___" });

    // Add an extra text node that should be cleared out
    instance.display.appendChild(document.createTextNode("junk"));
    instance.dispatch({ type: "digit", digit: 1 });

    expect(instance.display.childNodes).toHaveLength(1);
    expect(instance.display.firstChild).toBe(instance.maskDisplay!.container);
  });

  it("does not dispatch when button is disabled", () => {
    const target = document.createElement("div");
    const instance = createNumpadDom(target);

    const firstButton = instance.keypad.querySelector("button") as HTMLButtonElement;
    firstButton.disabled = true;
    firstButton.click();

    // Value remains pristine because click handler bails out when disabled
    expect(instance.getState().value).toBe("");
  });

  it("falls back gracefully if parseMask throws during button state calculation", () => {
    const target = document.createElement("div");

    const parseSpy = vi
      .spyOn(maskUtils, "parseMask")
      .mockImplementation((mask: string) => {
        // First two calls should behave normally for initialization
        if (parseSpy.mock.calls.length <= 2) {
          return originalParseMask(mask);
        }
        throw new Error("parse failure");
      });

    const instance = createNumpadDom(target, { mask: "___" });

    // Force updateButtonStates via dispatch to trigger the mocked parse failure
    instance.dispatch({ type: "digit", digit: 1 });

    // Buttons should still be present and not all disabled
    const disabledCount = Array.from(instance.keypad.querySelectorAll("button")).filter(
      (btn) => btn.disabled
    ).length;
    expect(disabledCount).toBeLessThan(12);

    parseSpy.mockRestore();
  });

  it("destroys mask display when destroy is called", () => {
    const target = document.createElement("div");
    const destroySpy = vi.fn();

    vi.spyOn(maskDisplay, "createMaskDisplay").mockReturnValue({
      container: document.createElement("div"),
      update: vi.fn(),
      destroy: destroySpy
    });

    const instance = createNumpadDom(target, { mask: "___" });
    instance.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
