import { describe, it, expect } from "vitest";

import { mountNumpad } from "@/integrations/css-modules";
import moduleStyles from "@/styles/numpad.module.css";

const styles = moduleStyles as Record<string, string>;

describe("css-modules mask class application", () => {
  it("applies module classes to mask display elements", () => {
    const target = document.createElement("div");
    const instance = mountNumpad(target, { mask: "$ __,__ USD" });

    const maskDisplay = instance.maskDisplay?.container;
    expect(maskDisplay).toBeTruthy();
    expect(maskDisplay?.className || "").toContain(styles.maskDisplay);

    // Segment containers and slots
    expect(maskDisplay?.querySelector('[data-segment="integer"]')?.className || "").toContain(
      styles.maskInteger
    );
    expect(maskDisplay?.querySelector('[data-segment="fractional"]')?.className || "").toContain(
      styles.maskFractional
    );
    expect(maskDisplay?.querySelector(`.${styles.maskSeparator}`)?.className || "").toContain(
      styles.maskSeparator
    );
    expect(maskDisplay?.querySelector('[data-index="0"]')?.className || "").toContain(
      styles.maskCharSlot
    );

    // Prefix/suffix and wrappers
    expect(maskDisplay?.querySelector(`.${styles.maskDecimal}`)?.className || "").toContain(
      styles.maskDecimal
    );
    expect(maskDisplay?.querySelector(`.${styles.maskPrefix}`)?.className || "").toContain(
      styles.maskPrefix
    );
    expect(maskDisplay?.querySelector(`.${styles.maskSuffix}`)?.className || "").toContain(
      styles.maskSuffix
    );

    instance.destroy();
  });

  it("applies fraction-specific module classes", () => {
    const target = document.createElement("div");
    const instance = mountNumpad(target, { mask: "__/___" });

    const maskDisplay = instance.maskDisplay?.container;
    expect(maskDisplay).toBeTruthy();

    expect(maskDisplay?.querySelector(`.${styles.maskFraction}`)?.className || "").toContain(
      styles.maskFraction
    );
    expect(maskDisplay?.querySelector(`.${styles.maskFractionContainer}`)?.className || "").toContain(
      styles.maskFractionContainer
    );
    expect(maskDisplay?.querySelector('[data-segment="numerator"]')?.className || "").toContain(
      styles.maskNumerator
    );
    expect(maskDisplay?.querySelector('[data-segment="denominator"]')?.className || "").toContain(
      styles.maskDenominator
    );
    expect(maskDisplay?.querySelector(`.${styles.maskDivisionLine}`)?.className || "").toContain(
      styles.maskDivisionLine
    );

    instance.destroy();
  });
});
