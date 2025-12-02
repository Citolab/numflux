import { describe, it, expect } from "vitest";
import { createNumpadState, formatDisplayValue, reduceNumpad } from "@/core/numpad";

describe("Decimal padding", () => {
  it("should pad empty value with decimal places", () => {
    const state = createNumpadState("", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("0.00");
  });

  it("should pad whole number with decimal places", () => {
    const state = createNumpadState("5", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.00");
  });

  it("should pad partial decimal with trailing zeros", () => {
    const state = createNumpadState("5.1", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.10");
  });

  it("should not pad when decimal places are complete", () => {
    const state = createNumpadState("5.12", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.12");
  });

  it("should pad with custom decimal separator", () => {
    const state = createNumpadState("5", { allowDecimal: 2, decimalSeparator: "," });
    const display = formatDisplayValue(state, { allowDecimal: 2, decimalSeparator: "," });
    expect(display.formatted).toBe("5,00");
  });

  it("should pad negative numbers", () => {
    const state = createNumpadState("-5", { allowDecimal: 2, allowNegative: true });
    const display = formatDisplayValue(state, { allowDecimal: 2, allowNegative: true });
    expect(display.formatted).toBe("-5.00");
  });

  it("should pad numbers with 3 decimal places", () => {
    const state = createNumpadState("12.3", { allowDecimal: 3 });
    const display = formatDisplayValue(state, { allowDecimal: 3 });
    expect(display.formatted).toBe("12.300");
  });

  it("should pad zero with decimal places", () => {
    const state = createNumpadState("0", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("0.00");
  });

  it("should not pad when allowDecimal is true (not a number)", () => {
    const state = createNumpadState("5", { allowDecimal: true });
    const display = formatDisplayValue(state, { allowDecimal: true });
    expect(display.formatted).toBe("5");
  });

  it("should not pad when allowDecimal is false", () => {
    const state = createNumpadState("5", { allowDecimal: false });
    const display = formatDisplayValue(state, { allowDecimal: false });
    expect(display.formatted).toBe("5");
  });

  it("should pad during input", () => {
    let state = createNumpadState("", { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "digit", digit: 5 }, { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.00");
  });

  it("should pad after decimal point is added", () => {
    let state = createNumpadState("", { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "digit", digit: 5 }, { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "decimal" }, { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.00");
  });

  it("should update padding as digits are added", () => {
    let state = createNumpadState("", { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "digit", digit: 5 }, { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "decimal" }, { allowDecimal: 2 });
    state = reduceNumpad(state, { type: "digit", digit: 1 }, { allowDecimal: 2 });

    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("5.10");
  });

  it("should handle currency-like numbers", () => {
    const state = createNumpadState("123", { allowDecimal: 2 });
    const display = formatDisplayValue(state, { allowDecimal: 2 });
    expect(display.formatted).toBe("123.00");
  });
});
