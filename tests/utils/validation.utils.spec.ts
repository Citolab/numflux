import { describe, it, expect } from "vitest";
import {
  toNumber,
  getDecimalPlaces,
  isValidValue,
  isWithinDecimalLimit,
  sanitizeValue,
  normalizeLeadingZeros
} from "@/utils/validation.utils";
import { normalizeConfig } from "@/core/numpad";

describe("toNumber", () => {
  it("should convert valid numeric strings to numbers", () => {
    expect(toNumber("123")).toBe(123);
    expect(toNumber("123.45")).toBe(123.45);
    expect(toNumber("-42")).toBe(-42);
    expect(toNumber("0")).toBe(0);
    expect(toNumber("0.5")).toBe(0.5);
  });

  it("should return null for empty or invalid strings", () => {
    expect(toNumber("")).toBeNull();
    expect(toNumber("-")).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("12.34.56")).toBeNull();
    expect(toNumber("Infinity")).toBeNull();
    expect(toNumber("NaN")).toBeNull();
  });
});

describe("getDecimalPlaces", () => {
  it("should return number when allowDecimal is number", () => {
    const config = normalizeConfig({ allowDecimal: 2 });
    expect(getDecimalPlaces(config)).toBe(2);
  });

  it("should return null when allowDecimal is true", () => {
    const config = normalizeConfig({ allowDecimal: true });
    expect(getDecimalPlaces(config)).toBeNull();
  });

  it("should return 0 when allowDecimal is false", () => {
    const config = normalizeConfig({ allowDecimal: false });
    expect(getDecimalPlaces(config)).toBe(0);
  });
});

describe("isValidValue", () => {
  it("should return true for empty values", () => {
    const config = normalizeConfig({ min: 0, max: 100 });
    expect(isValidValue("", config)).toBe(true);
    expect(isValidValue("-", config)).toBe(true);
  });

  it("should validate min constraint", () => {
    const config = normalizeConfig({ min: 10, max: 100 });
    expect(isValidValue("15", config)).toBe(true);
    expect(isValidValue("5", config)).toBe(false);
    expect(isValidValue("10", config)).toBe(true); // equal to min
  });

  it("should validate max constraint", () => {
    const config = normalizeConfig({ min: 0, max: 100 });
    expect(isValidValue("50", config)).toBe(true);
    expect(isValidValue("150", config)).toBe(false);
    expect(isValidValue("100", config)).toBe(true); // equal to max
  });

  it("should work without min/max constraints", () => {
    const config = normalizeConfig();
    expect(isValidValue("999999", config)).toBe(true);
    expect(isValidValue("-999999", config)).toBe(true);
  });

  it("should handle decimal values", () => {
    const config = normalizeConfig({ min: 0, max: 100.5 });
    expect(isValidValue("50.25", config)).toBe(true);
    expect(isValidValue("100.75", config)).toBe(false);
  });
});

describe("isWithinDecimalLimit", () => {
  it("should return true when no decimal limit", () => {
    const config = normalizeConfig({ allowDecimal: true });
    expect(isWithinDecimalLimit("123.456789", config)).toBe(true);
  });

  it("should return true when allowDecimal is false", () => {
    const config = normalizeConfig({ allowDecimal: false });
    expect(isWithinDecimalLimit("123", config)).toBe(true);
  });

  it("should validate decimal places limit", () => {
    const config = normalizeConfig({ allowDecimal: 2 });
    expect(isWithinDecimalLimit("123.45", config)).toBe(true);
    expect(isWithinDecimalLimit("123.4", config)).toBe(true);
    expect(isWithinDecimalLimit("123.456", config)).toBe(false);
  });

  it("should handle values without decimals", () => {
    const config = normalizeConfig({ allowDecimal: 2 });
    expect(isWithinDecimalLimit("123", config)).toBe(true);
  });
});

describe("normalizeLeadingZeros", () => {
  it("should remove leading zeros from integers", () => {
    expect(normalizeLeadingZeros("00123", false)).toBe("123");
    expect(normalizeLeadingZeros("000", false)).toBe("0");
    expect(normalizeLeadingZeros("0", false)).toBe("0");
  });

  it("should handle decimal numbers", () => {
    expect(normalizeLeadingZeros("00123.45", true)).toBe("123.45");
    expect(normalizeLeadingZeros("000.50", true)).toBe("0.50");
    expect(normalizeLeadingZeros("0.", true)).toBe("0.");
  });

  it("should handle empty strings", () => {
    expect(normalizeLeadingZeros("", false)).toBe("");
    expect(normalizeLeadingZeros("", true)).toBe("");
  });

  it("should preserve single zero", () => {
    expect(normalizeLeadingZeros("0", false)).toBe("0");
    expect(normalizeLeadingZeros("0.", true)).toBe("0.");
  });
});

describe("sanitizeValue", () => {
  it("should remove non-numeric characters", () => {
    const config = normalizeConfig();
    expect(sanitizeValue("abc123def", config)).toBe("123");
    expect(sanitizeValue("1a2b3c", config)).toBe("123");
  });

  it("should handle negative numbers when allowed", () => {
    const config = normalizeConfig({ allowNegative: true });
    expect(sanitizeValue("-123", config)).toBe("-123");
    expect(sanitizeValue("123-", config)).toBe("123"); // minus only at start
  });

  it("should ignore negative sign when not allowed", () => {
    const config = normalizeConfig({ allowNegative: false });
    expect(sanitizeValue("-123", config)).toBe("123");
  });

  it("should handle decimal numbers when allowed", () => {
    const config = normalizeConfig({ allowDecimal: true });
    expect(sanitizeValue("123.45", config)).toBe("123.45");
    expect(sanitizeValue("123.45.67", config)).toBe("123.4567"); // all digits kept, only first decimal
  });

  it("should ignore decimal when not allowed", () => {
    const config = normalizeConfig({ allowDecimal: false });
    expect(sanitizeValue("123.45", config)).toBe("12345");
  });

  it("should respect maxDigits limit", () => {
    const config = normalizeConfig({ maxDigits: 3 });
    expect(sanitizeValue("12345", config)).toBe("123");
    expect(sanitizeValue("abc12def345", config)).toBe("123");
  });

  it("should handle custom decimal separator", () => {
    const config = normalizeConfig({
      allowDecimal: true,
      decimalSeparator: ","
    });
    expect(sanitizeValue("123,45", config)).toBe("123.45");
    expect(sanitizeValue("123.45", config)).toBe("123.45"); // both work
  });

  it("should normalize leading zeros", () => {
    const config = normalizeConfig();
    expect(sanitizeValue("00123", config)).toBe("123");
    expect(sanitizeValue("00123.45", config)).toBe("123.45");
    expect(sanitizeValue("000", config)).toBe("0");
  });

  it("should handle complex mixed input", () => {
    const config = normalizeConfig({
      allowDecimal: true,
      allowNegative: true,
      maxDigits: 5
    });
    expect(sanitizeValue("-abc001230.456def789", config)).toBe("-123.");
  });

  it("should return empty string for no valid input", () => {
    const config = normalizeConfig();
    expect(sanitizeValue("abc!@#", config)).toBe("");
    expect(sanitizeValue("", config)).toBe("");
  });

  it("should handle just minus sign", () => {
    const config = normalizeConfig({ allowNegative: true });
    expect(sanitizeValue("-", config)).toBe("-");
    expect(sanitizeValue("--", config)).toBe("-"); // multiple minus signs
  });
});
