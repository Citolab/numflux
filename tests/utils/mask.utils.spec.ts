import { describe, it, expect } from "vitest";
import {
  parseMask,
  createMaskState,
  formatMaskValue,
  getMaskRawValue,
  appendDigitToMask,
  deleteCharFromMask,
  clearMask,
  getLocalizedDecimalSeparator,
  localizeDecimalSeparator,
  isMaskComplete,
  getMaskFilledLength
} from "@/utils/mask.utils";

describe("parseMask", () => {
  it("should parse simple mask", () => {
    const result = parseMask("___");
    expect(result.type).toBe("simple");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].type).toBe("integer");
    expect(result.segments[0].length).toBe(3);
    expect(result.prefix).toBe("");
    expect(result.suffix).toBe("");
    expect(result.totalSlots).toBe(3);
  });

  it("should parse simple mask with prefix", () => {
    const result = parseMask("€ ___");
    expect(result.type).toBe("simple");
    expect(result.prefix).toBe("€ ");
    expect(result.suffix).toBe("");
    expect(result.segments[0].length).toBe(3);
  });

  it("should parse simple mask with suffix", () => {
    const result = parseMask("________ cm");
    expect(result.type).toBe("simple");
    expect(result.prefix).toBe("");
    expect(result.suffix).toBe(" cm");
    expect(result.segments[0].length).toBe(8);
  });

  it("should parse fraction mask", () => {
    const result = parseMask("__/___");
    expect(result.type).toBe("fraction");
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].type).toBe("numerator");
    expect(result.segments[0].length).toBe(2);
    expect(result.segments[1].type).toBe("denominator");
    expect(result.segments[1].length).toBe(3);
    expect(result.totalSlots).toBe(5);
  });

  it("should parse fraction mask with prefix and suffix", () => {
    const result = parseMask("€ ____/__");
    expect(result.type).toBe("fraction");
    expect(result.prefix).toBe("€ ");
    expect(result.segments[0].length).toBe(4);
    expect(result.segments[1].length).toBe(2);
  });

  it("should parse decimal mask", () => {
    const result = parseMask("__,__");
    expect(result.type).toBe("decimal");
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].type).toBe("integer");
    expect(result.segments[0].length).toBe(2);
    expect(result.segments[1].type).toBe("fractional");
    expect(result.segments[1].length).toBe(2);
    expect(result.totalSlots).toBe(4);
  });

  it("should parse decimal mask with prefix and suffix", () => {
    const result = parseMask("$ ___,__ USD");
    expect(result.type).toBe("decimal");
    expect(result.prefix).toBe("$ ");
    expect(result.suffix).toBe(" USD");
    expect(result.segments[0].length).toBe(3);
    expect(result.segments[1].length).toBe(2);
  });

  it("should throw error for mask with both / and ,", () => {
    expect(() => parseMask("__/__,__")).toThrow();
  });

  it("should throw error for mask without underscores", () => {
    expect(() => parseMask("abc")).toThrow();
  });

  it("should throw when complex decimal/fraction mask pieces are malformed", () => {
    expect(() => parseMask("€ ,__/__")).toThrow(/numerator integer part/);
    expect(() => parseMask("€ __.____/,")) // missing fractional underscores
      .toThrow(/numerator must be a valid decimal format/);
    expect(() => parseMask("€ __.___,__/")).toThrow(/denominator must contain underscores/);
  });

  it("should throw when simple fraction pieces are malformed", () => {
    expect(() => parseMask("/__")).toThrow(/numerator must contain underscores/);
    expect(() => parseMask("_/")).toThrow(/denominator must contain underscores/);
    expect(() => parseMask("__/_/_")).toThrow(/exactly one/);
  });
});

describe("createMaskState", () => {
  it("should create empty state for simple mask", () => {
    const format = parseMask("___");
    const state = createMaskState(format);
    expect(state.segments.integer).toBe("");
    expect(state.activeSegment).toBe("integer");
  });

  it("should create empty state for fraction mask", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format);
    expect(state.segments.numerator).toBe("");
    expect(state.segments.denominator).toBe("");
    expect(state.activeSegment).toBe("numerator");
  });

  it("should create state with initial value for simple mask", () => {
    const format = parseMask("___");
    const state = createMaskState(format, "123");
    expect(state.segments.integer).toBe("123");
  });

  it("should create state with initial value for fraction mask", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "12/345");
    expect(state.segments.numerator).toBe("12");
    expect(state.segments.denominator).toBe("345");
  });
});

describe("formatMaskValue", () => {
  it("should format simple mask value", () => {
    const format = parseMask("___");
    const state = createMaskState(format, "123");
    const formatted = formatMaskValue(state, format);
    expect(formatted).toBe("123");
  });

  it("should format simple mask with prefix and suffix", () => {
    const format = parseMask("€ ___ EUR");
    const state = createMaskState(format, "€ 100 EUR");
    const formatted = formatMaskValue(state, format);
    expect(formatted).toBe("€ 100 EUR");
  });

  it("should format fraction mask value", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "12/345");
    const formatted = formatMaskValue(state, format);
    expect(formatted).toBe("12/345");
  });

  it("should format decimal mask value", () => {
    const format = parseMask("__,__");
    const state = createMaskState(format, "12,34");
    const formatted = formatMaskValue(state, format);
    expect(formatted).toBe("12,34");
  });
});

describe("getMaskRawValue", () => {
  it("should get raw value for simple mask", () => {
    const format = parseMask("€ ___");
    const state = createMaskState(format, "€ 123");
    const raw = getMaskRawValue(state, format);
    expect(raw).toBe("123");
  });

  it("should get raw value for fraction mask", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "12/345");
    const raw = getMaskRawValue(state, format);
    expect(raw).toBe("12/345");
  });

  it("should get raw value for decimal mask", () => {
    const format = parseMask("__,__");
    const state = createMaskState(format, "12,34");
    const raw = getMaskRawValue(state, format);
    expect(raw).toBe("12,34");
  });
});

describe("appendDigitToMask", () => {
  it("should append digit to empty simple mask", () => {
    const format = parseMask("___");
    let state = createMaskState(format);
    state = appendDigitToMask(state, 1, format);
    expect(state.segments.integer).toBe("1");
  });

  it("should append multiple digits to simple mask", () => {
    const format = parseMask("___");
    let state = createMaskState(format);
    state = appendDigitToMask(state, 1, format);
    state = appendDigitToMask(state, 2, format);
    state = appendDigitToMask(state, 3, format);
    expect(state.segments.integer).toBe("123");
  });

  it("should not exceed max length for simple mask", () => {
    const format = parseMask("___");
    let state = createMaskState(format);
    state = appendDigitToMask(state, 1, format);
    state = appendDigitToMask(state, 2, format);
    state = appendDigitToMask(state, 3, format);
    state = appendDigitToMask(state, 4, format);
    expect(state.segments.integer).toBe("123");
  });

  it("should move to next segment when current is full (fraction)", () => {
    const format = parseMask("__/___");
    let state = createMaskState(format);
    state = appendDigitToMask(state, 1, format);
    state = appendDigitToMask(state, 2, format);
    state = appendDigitToMask(state, 3, format);
    expect(state.segments.numerator).toBe("12");
    expect(state.segments.denominator).toBe("3");
    expect(state.activeSegment).toBe("denominator");
  });

  it("should handle decimal mask segments", () => {
    const format = parseMask("__,__");
    let state = createMaskState(format);
    state = appendDigitToMask(state, 1, format);
    state = appendDigitToMask(state, 2, format);
    state = appendDigitToMask(state, 3, format);
    expect(state.segments.integer).toBe("12");
    expect(state.segments.fractional).toBe("3");
    expect(state.activeSegment).toBe("fractional");
  });
});

describe("deleteCharFromMask", () => {
  it("should delete character from simple mask", () => {
    const format = parseMask("___");
    let state = createMaskState(format, "123");
    state = deleteCharFromMask(state, format);
    expect(state.segments.integer).toBe("12");
  });

  it("should move to previous segment when current is empty (fraction)", () => {
    const format = parseMask("__/___");
    let state = createMaskState(format, "12/345");
    state.activeSegment = "denominator";
    state.segments.denominator = "";
    state = deleteCharFromMask(state, format);
    expect(state.segments.numerator).toBe("1");
    expect(state.activeSegment).toBe("numerator");
  });

  it("returns same state when nothing to delete at start", () => {
    const format = parseMask("___");
    const state = createMaskState(format);
    const result = deleteCharFromMask(state, format);
    expect(result).toEqual(state);
  });
});

describe("clearMask", () => {
  it("should clear all segments", () => {
    const format = parseMask("__/___");
    const state = clearMask(format);
    expect(state.segments.numerator).toBe("");
    expect(state.segments.denominator).toBe("");
  });
});

describe("getLocalizedDecimalSeparator", () => {
  it("should return period for en-US", () => {
    expect(getLocalizedDecimalSeparator("en-US")).toBe(".");
  });

  it("should return comma for most other locales", () => {
    expect(getLocalizedDecimalSeparator("nl-NL")).toBe(",");
    expect(getLocalizedDecimalSeparator("de-DE")).toBe(",");
    expect(getLocalizedDecimalSeparator("fr-FR")).toBe(",");
  });

  it("should fall back to navigator or default locale when none provided", () => {
    const separator = getLocalizedDecimalSeparator();
    expect(separator === "." || separator === ",").toBe(true);
  });
});

describe("localizeDecimalSeparator", () => {
  it("should replace period with comma for non-US locales", () => {
    expect(localizeDecimalSeparator("12.34", "nl-NL")).toBe("12,34");
  });

  it("should keep period for en-US locale", () => {
    expect(localizeDecimalSeparator("12.34", "en-US")).toBe("12.34");
  });

  it("should leave value unchanged when separator is dot", () => {
    expect(localizeDecimalSeparator("99.01", "en-US")).toBe("99.01");
  });
});

describe("isMaskComplete", () => {
  it("should return true when all segments are filled", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "12/345");
    expect(isMaskComplete(state, format)).toBe(true);
  });

  it("should return false when segments are not filled", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "1/34");
    expect(isMaskComplete(state, format)).toBe(false);
  });
});

describe("getMaskFilledLength", () => {
  it("should return total filled characters", () => {
    const format = parseMask("__/___");
    const state = createMaskState(format, "12/3");
    expect(getMaskFilledLength(state)).toBe(3);
  });

  it("should return 0 for empty mask", () => {
    const format = parseMask("___");
    const state = createMaskState(format);
    expect(getMaskFilledLength(state)).toBe(0);
  });
});
