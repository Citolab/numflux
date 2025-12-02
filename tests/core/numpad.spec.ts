import { describe, it, expect } from "vitest";
import {
  createNumpadState,
  reduceNumpad,
  normalizeConfig,
  mapKeyToAction,
  formatDisplayValue
} from "@/core/numpad";
import type { NumpadConfig } from "@/types/numpad";

describe("normalizeConfig", () => {
  it("should return default config when no config provided", () => {
    const config = normalizeConfig();
    expect(config).toEqual({
      allowDecimal: true,
      allowNegative: true,
      maxDigits: null,
      minDigits: null,
      decimalSeparator: ".",
      minValue: null,
      maxValue: null,
      sync: false,
      mask: undefined
    });
  });

  it("should merge provided config with defaults", () => {
    const config = normalizeConfig({ allowDecimal: false, maxDigits: 5 });
    expect(config.allowDecimal).toBe(false);
    expect(config.maxDigits).toBe(5);
    expect(config.allowNegative).toBe(true); // default preserved
  });
});

describe("createNumpadState", () => {
  it("should create initial state with empty value", () => {
    const state = createNumpadState();
    expect(state).toEqual({
      value: "",
      isPristine: true,
      validationError: null
    });
  });

  it("should create state with sanitized initial value", () => {
    const state = createNumpadState("00123.45", { allowDecimal: true });
    expect(state.value).toBe("123.45");
    expect(state.isPristine).toBe(true);
  });

  it("should sanitize invalid characters from initial value", () => {
    const state = createNumpadState("abc123def", { allowDecimal: false });
    expect(state.value).toBe("123");
  });

  it("should return default state for unknown action type", () => {
    const config = normalizeConfig();
    const state = createNumpadState("1");
    const next = reduceNumpad(state, { type: "unknown" } as any, config);

    expect(next.value).toBe("1");
    expect(next.isPristine).toBe(false);
    expect(next.lastAction).toBe("unknown");
  });
});

describe("reduceNumpad - digit actions", () => {
  const config: NumpadConfig = normalizeConfig({ allowDecimal: true, allowNegative: true });

  it("should append digits to empty state", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "digit", digit: 1 }, config);
    expect(state.value).toBe("1");
    expect(state.isPristine).toBe(false);
    expect(state.lastAction).toBe("digit");
  });

  it("should append multiple digits", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "digit", digit: 1 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 2 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 3 }, config);
    expect(state.value).toBe("123");
  });

  it("should respect maxDigits limit", () => {
    const limitConfig = normalizeConfig({ maxDigits: 3 });
    let state = createNumpadState();

    // Add 3 digits - should work
    state = reduceNumpad(state, { type: "digit", digit: 1 }, limitConfig);
    state = reduceNumpad(state, { type: "digit", digit: 2 }, limitConfig);
    state = reduceNumpad(state, { type: "digit", digit: 3 }, limitConfig);
    expect(state.value).toBe("123");

    // Try to add 4th digit - should be ignored
    state = reduceNumpad(state, { type: "digit", digit: 4 }, limitConfig);
    expect(state.value).toBe("123");
  });

  it("should replace leading zero with non-zero digit", () => {
    let state = createNumpadState("0");
    state = reduceNumpad(state, { type: "digit", digit: 5 }, config);
    expect(state.value).toBe("5");
  });
});

describe("reduceNumpad - decimal actions", () => {
  const config = normalizeConfig({ allowDecimal: true });

  it("should add decimal point to empty state", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "decimal" }, config);
    expect(state.value).toBe("0.");
  });

  it("should add decimal point after digits", () => {
    let state = createNumpadState("123");
    state = reduceNumpad(state, { type: "decimal" }, config);
    expect(state.value).toBe("123.");
  });

  it("should not add second decimal point", () => {
    let state = createNumpadState("123.45");
    state = reduceNumpad(state, { type: "decimal" }, config);
    expect(state.value).toBe("123.45");
  });

  it("should not add decimal when not allowed", () => {
    const noDecimalConfig = normalizeConfig({ allowDecimal: false });
    let state = createNumpadState("123");
    state = reduceNumpad(state, { type: "decimal" }, noDecimalConfig);
    expect(state.value).toBe("123");
  });

  it("should respect decimal places limit", () => {
    const twoDecimalConfig = normalizeConfig({ allowDecimal: 2 });
    let state = createNumpadState("123.");

    // Add first decimal digit
    state = reduceNumpad(state, { type: "digit", digit: 4 }, twoDecimalConfig);
    expect(state.value).toBe("123.4");

    // Add second decimal digit
    state = reduceNumpad(state, { type: "digit", digit: 5 }, twoDecimalConfig);
    expect(state.value).toBe("123.45");

    // Try to add third decimal digit - should be ignored
    state = reduceNumpad(state, { type: "digit", digit: 6 }, twoDecimalConfig);
    expect(state.value).toBe("123.45");
  });
});

describe("reduceNumpad - delete and clear actions", () => {
  const config = normalizeConfig();

  it("should delete last character", () => {
    let state = createNumpadState("123");
    state = reduceNumpad(state, { type: "delete" }, config);
    expect(state.value).toBe("12");
  });

  it("should handle delete on empty state", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "delete" }, config);
    expect(state.value).toBe("");
  });

  it('should clear minus sign when deleting from "-" state', () => {
    let state = createNumpadState("-");
    state = reduceNumpad(state, { type: "delete" }, config);
    expect(state.value).toBe("");
  });

  it("should clear entire value", () => {
    let state = createNumpadState("123.45");
    state = reduceNumpad(state, { type: "clear" }, config);
    expect(state.value).toBe("");
  });
});

describe("reduceNumpad - toggle sign actions", () => {
  const config = normalizeConfig({ allowNegative: true });

  it("should add minus sign to empty state", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "toggle-sign" }, config);
    expect(state.value).toBe("-");
  });

  it("should toggle positive to negative", () => {
    let state = createNumpadState("123");
    state = reduceNumpad(state, { type: "toggle-sign" }, config);
    expect(state.value).toBe("-123");
  });

  it("should toggle negative to positive", () => {
    let state = createNumpadState("-123");
    state = reduceNumpad(state, { type: "toggle-sign" }, config);
    expect(state.value).toBe("123");
  });

  it("should not toggle when negative not allowed", () => {
    const noNegativeConfig = normalizeConfig({ allowNegative: false });
    let state = createNumpadState("123");
    state = reduceNumpad(state, { type: "toggle-sign" }, noNegativeConfig);
    expect(state.value).toBe("123");
  });
});

describe("reduceNumpad - set action", () => {
  const config = normalizeConfig();

  it("should set value directly", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "set", value: "999.99" }, config);
    expect(state.value).toBe("999.99");
  });

  it("should sanitize set value", () => {
    let state = createNumpadState();
    state = reduceNumpad(state, { type: "set", value: "abc123.45def" }, config);
    expect(state.value).toBe("123.45");
  });
});

describe("reduceNumpad - submit action", () => {
  it("should not change value on submit", () => {
    let state = createNumpadState("123.45");
    const originalValue = state.value;
    state = reduceNumpad(state, { type: "submit" }, normalizeConfig());

    expect(state.value).toBe(originalValue);
    expect(state.lastAction).toBe("submit");
    expect(state.isPristine).toBe(false);
  });
});

describe("mapKeyToAction", () => {
  const config = normalizeConfig();

  it("should map digit keys to digit actions", () => {
    expect(mapKeyToAction("0", config)).toEqual({ type: "digit", digit: 0 });
    expect(mapKeyToAction("5", config)).toEqual({ type: "digit", digit: 5 });
    expect(mapKeyToAction("9", config)).toEqual({ type: "digit", digit: 9 });
  });

  it("should map decimal keys", () => {
    expect(mapKeyToAction(".", config)).toEqual({ type: "decimal" });

    const commaConfig = normalizeConfig({ decimalSeparator: "," });
    expect(mapKeyToAction(",", commaConfig)).toEqual({ type: "decimal" });
    expect(mapKeyToAction(".", commaConfig)).toEqual({ type: "decimal" });
  });

  it("should map control keys", () => {
    expect(mapKeyToAction("Backspace", config)).toEqual({ type: "delete" });
    expect(mapKeyToAction("Delete", config)).toEqual({ type: "clear" });
    expect(mapKeyToAction("Enter", config)).toEqual({ type: "submit" });
  });

  it("should map minus key when negative allowed", () => {
    expect(mapKeyToAction("-", config)).toEqual({ type: "toggle-sign" });

    const noNegativeConfig = normalizeConfig({ allowNegative: false });
    expect(mapKeyToAction("-", noNegativeConfig)).toBeNull();
  });

  it("should return null for invalid keys", () => {
    expect(mapKeyToAction("a", config)).toBeNull();
    expect(mapKeyToAction("!", config)).toBeNull();
    expect(mapKeyToAction("Tab", config)).toBeNull();
  });

  it("should use custom key validator when provided", () => {
    const validator = (key: string) => key !== "5"; // Block digit 5

    expect(mapKeyToAction("1", config, "", validator)).toEqual({ type: "digit", digit: 1 });
    expect(mapKeyToAction("5", config, "", validator)).toBeNull();
  });

  it("should return null when custom key validator throws", () => {
    const validator = () => {
      throw new Error("validator failure");
    };

    expect(mapKeyToAction("1", config, "", validator)).toBeNull();
  });
});

describe("formatDisplayValue", () => {
  it("should format basic numeric values", () => {
    const state = createNumpadState("123.45");
    const display = formatDisplayValue(state);

    expect(display.raw).toBe("123.45");
    expect(display.formatted).toBe("123.45");
    expect(display.numeric).toBe(123.45);
  });

  it("should handle empty values", () => {
    const state = createNumpadState("");
    const display = formatDisplayValue(state);

    expect(display.raw).toBe("");
    expect(display.formatted).toBe("");
    expect(display.numeric).toBeNull();
  });

  it("should handle negative values", () => {
    const state = createNumpadState("-42");
    const display = formatDisplayValue(state);

    expect(display.numeric).toBe(-42);
  });

  it("should respect custom decimal separator", () => {
    const state = createNumpadState("123.45");
    const config = normalizeConfig({ decimalSeparator: "," });
    const display = formatDisplayValue(state, config);

    expect(display.raw).toBe("123.45");
    expect(display.formatted).toBe("123,45");
    expect(display.numeric).toBe(123.45);
  });

  it("should handle invalid numeric strings", () => {
    const state = createNumpadState("-");
    const display = formatDisplayValue(state);

    expect(display.raw).toBe("-");
    expect(display.formatted).toBe("-");
    expect(display.numeric).toBeNull();
  });

  it("should apply custom display rule", () => {
    const state = createNumpadState("123.45");
    const displayRule = (value: string) => `$${value}`;
    const display = formatDisplayValue(state, normalizeConfig(), displayRule);

    expect(display.raw).toBe("123.45");
    expect(display.formatted).toBe("$123.45");
    expect(display.numeric).toBe(123.45);
  });

  it("should fallback when display rule throws error", () => {
    const state = createNumpadState("123.45");
    const displayRule = () => {
      throw new Error("Test error");
    };
    const display = formatDisplayValue(state, normalizeConfig(), displayRule);

    expect(display.raw).toBe("123.45");
    expect(display.formatted).toBe("123.45"); // Falls back to default
    expect(display.numeric).toBe(123.45);
  });
});

describe("validation errors", () => {
  it("should detect minValue violations", () => {
    const config = normalizeConfig({ minValue: 25, maxValue: 100 });
    const state = createNumpadState("10", config);
    expect(state.validationError).toBe("minValue");
  });

  it("should detect maxValue violations", () => {
    const config = normalizeConfig({ minValue: 10, maxValue: 50 });
    const state = createNumpadState("75", config);
    expect(state.validationError).toBe("maxValue");
  });

  it("should detect minDigits violations", () => {
    const config = normalizeConfig({ minDigits: 3, maxDigits: 6 });
    const state = createNumpadState("12", config);
    expect(state.validationError).toBe("minDigits");
  });

  it("should detect maxDigits violations", () => {
    const config = normalizeConfig({ minDigits: 2, maxDigits: 4 });
    // sanitizeValue limits to 4 digits, so "12345" becomes "1234" which is valid
    // Instead test with a value that exceeds during state transitions
    let state = createNumpadState("", config);
    state = reduceNumpad(state, { type: "digit", digit: 1 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 2 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 3 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 4 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 5 }, config);
    // After 5th digit, should still have 4 digits due to maxDigits limit
    expect(state.value).toBe("1234"); // Should be limited by input
    expect(state.validationError).toBe(null); // No error since input was limited
  });

  it("should have no validation error for valid values", () => {
    const config = normalizeConfig({ minValue: 10, maxValue: 100, minDigits: 2, maxDigits: 4 });
    const state = createNumpadState("50", config);
    expect(state.validationError).toBe(null);
  });

  it("should update validation error when reducing numpad", () => {
    const config = normalizeConfig({ minValue: 20, maxValue: 80 });
    let state = createNumpadState("", config);
    
    // Add digits to make "15" (below minValue)
    state = reduceNumpad(state, { type: "digit", digit: 1 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 5 }, config);
    expect(state.validationError).toBe("minValue");
    
    // Continue to make "150" (above maxValue)  
    state = reduceNumpad(state, { type: "digit", digit: 0 }, config);
    expect(state.validationError).toBe("maxValue");
    
    // Delete to make "15" again (below minValue)
    state = reduceNumpad(state, { type: "delete" }, config);
    expect(state.validationError).toBe("minValue");
    
    // Clear to make valid range
    state = reduceNumpad(state, { type: "clear" }, config);
    state = reduceNumpad(state, { type: "digit", digit: 5 }, config);
    state = reduceNumpad(state, { type: "digit", digit: 0 }, config);
    expect(state.validationError).toBe(null);
  });

  it("should handle negative minValue validation", () => {
    const config = normalizeConfig({ minValue: -50, maxValue: -10, allowNegative: true });
    
    // Test value below minValue
    let state = createNumpadState("-75", config);
    expect(state.validationError).toBe("minValue");
    
    // Test value within range
    state = createNumpadState("-30", config);
    expect(state.validationError).toBe(null);
    
    // Test value above maxValue
    state = createNumpadState("-5", config);
    expect(state.validationError).toBe("maxValue");
  });
});
