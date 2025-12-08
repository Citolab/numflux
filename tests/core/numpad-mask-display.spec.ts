import { describe, it, expect } from "vitest";

import { createMaskDisplay } from "@/core/numpad-mask";
import { parseMask, getLocalizedDecimalSeparator } from "@/utils/mask.utils";

describe("createMaskDisplay - inline separators", () => {
  it("renders thousands and decimal separators inside a complex numerator", () => {
    const format = parseMask("€ __.___,__/__");
    const { container, destroy } = createMaskDisplay(format, {
      showCharacterSlots: true,
      locale: "nl-NL"
    });

    const numerator = container.querySelector('[data-segment="numerator"]') as HTMLElement;
    expect(numerator).toBeTruthy();

    const slots = numerator.querySelectorAll(".nf-mask-char-slot");
    expect(slots).toHaveLength(7); // 5 integer + 2 fractional digits

    const separators = numerator.querySelectorAll(".nf-mask-inline-separator");
    expect(separators).toHaveLength(2);
    expect(separators[0].textContent).toBe(".");
    expect(separators[1].textContent).toBe(getLocalizedDecimalSeparator("nl-NL"));

    const childClasses = Array.from(numerator.children).map((el) => el.className);
    expect(childClasses[2]).toContain("nf-mask-inline-separator--thousands");
    expect(childClasses[6]).toContain("nf-mask-inline-separator--decimal");

    destroy();
  });

  it("renders thousands separators inside a simple integer mask", () => {
    const format = parseMask("__.___");
    const { container, destroy } = createMaskDisplay(format, { showCharacterSlots: true });

    const integer = container.querySelector('[data-segment="integer"]') as HTMLElement;
    expect(integer).toBeTruthy();

    const slots = integer.querySelectorAll(".nf-mask-char-slot");
    expect(slots).toHaveLength(5);

    const separators = integer.querySelectorAll(".nf-mask-inline-separator");
    expect(separators).toHaveLength(1);
    expect(separators[0].textContent).toBe(".");

    destroy();
  });

  it("renders decimal mask with prefix, separator, and suffix", () => {
    const format = parseMask("$ __,__ USD");
    const { container, destroy } = createMaskDisplay(format, {
      showCharacterSlots: true,
      locale: "en-US"
    });

    const prefix = container.querySelector(".nf-mask-prefix") as HTMLElement;
    const suffix = container.querySelector(".nf-mask-suffix") as HTMLElement;
    const separator = container.querySelector(".nf-mask-separator") as HTMLElement;
    const integer = container.querySelector('[data-segment="integer"]');
    const fractional = container.querySelector('[data-segment="fractional"]');

    expect(prefix?.textContent).toBe("$ ");
    expect(suffix?.textContent).toBe(" USD");
    expect(separator?.textContent).toBe(getLocalizedDecimalSeparator("en-US"));
    expect(integer).toBeTruthy();
    expect(fractional).toBeTruthy();

    destroy();
  });

  it("renders fraction suffix and locale decimal marker", () => {
    const format = parseMask("__/___ kg");
    const { container, destroy } = createMaskDisplay(format, {
      showCharacterSlots: true,
      locale: "nl-NL"
    });

    const suffix = container.querySelector(".nf-mask-suffix") as HTMLElement;
    const numeratorSeparators = container.querySelectorAll(
      '.nf-mask-numerator .nf-mask-inline-separator'
    );

    expect(suffix?.textContent).toBe(" kg");
    // No decimal separator expected because fraction numerator isn't decimal here
    expect(numeratorSeparators.length).toBe(0);

    destroy();
  });

  it("updates text when character slots are hidden", () => {
    const format = parseMask("___");
    const { container, update, destroy } = createMaskDisplay(format, {
      showCharacterSlots: false
    });

    const integer = container.querySelector('[data-segment="integer"]') as HTMLElement;
    expect(integer.textContent).toBe(""); // initialized empty when slots are hidden

    update({ segments: { integer: "42" } as any, activeSegment: "integer" });
    expect(integer.textContent).toBe("42");

    destroy();
  });

  it("marks active segment and fills slots on update", () => {
    const format = parseMask("____");
    const { container, update, destroy } = createMaskDisplay(format, {
      showCharacterSlots: true
    });

    const state = { segments: { integer: "12" } as any, activeSegment: "integer" };
    update(state);

    const slots = container.querySelectorAll(".nf-mask-char-slot");
    expect(Array.from(slots).map((s) => (s as HTMLElement).dataset.filled)).toEqual([
      "true",
      "true",
      "false",
      "false"
    ]);

    const integer = container.querySelector('[data-segment="integer"]') as HTMLElement;
    expect(integer.dataset.active).toBe("true");

    destroy();
  });
});
