/**
 * Mask parsing and formatting utilities
 */

import type { MaskFormat, MaskSegment, MaskSegmentType, MaskState } from "@/types/mask";

/**
 * Extract prefix, digit pattern, and suffix from a string that may contain
 * embedded thousands separators (dots)
 */
function extractPattern(str: string): {
  prefix: string;
  digitLength: number;
  suffix: string;
  thousandsSeparators: number[];
} | null {
  // Match: prefix, then underscores with optional dots, then suffix
  // Pattern: (prefix)(___.___ or ___)(suffix)
  const match = str.match(/^(.*?)((?:_+\.)*_+)(.*)$/);
  if (!match) return null;

  const prefix = match[1];
  const digitPattern = match[2];
  const suffix = match[3];

  // Track positions of thousands separators
  const thousandsSeparators: number[] = [];
  let digitCount = 0;

  for (let i = 0; i < digitPattern.length; i++) {
    if (digitPattern[i] === '_') {
      digitCount++;
    } else if (digitPattern[i] === '.') {
      // Record that a separator appears after this many digits
      thousandsSeparators.push(digitCount);
    }
  }

  const digitLength = digitCount;

  return { prefix, digitLength, suffix, thousandsSeparators };
}

/**
 * Parse a mask string into a structured format
 *
 * Mask syntax:
 * _ = placeholder for a single digit
 * . = thousands separator (when embedded in underscores)
 * / = division symbol for fractions
 * , = decimal separator
 * Any other characters = prefix/suffix literals
 *
 * @example
 * parseMask("___") → simple 3-digit number
 * parseMask("__.___ ") → 5-digit number with thousands separator
 * parseMask("__/_____") → fraction (2 digits / 5 digits)
 * parseMask("€ ____/__") → money with prefix (€ 4 digits / 2 digits)
 * parseMask("__,__") → decimal number (2 digits , 2 digits)
 * parseMask("€ __.___,__") → currency with thousands separator and decimals
 * parseMask("________ cm") → number with suffix
 */
export function parseMask(mask: string): MaskFormat {
  const hasFraction = mask.includes("/");
  const hasDecimal = mask.includes(",");

  let type: MaskFormat["type"] = "simple";
  const segments: MaskSegment[] = [];
  let prefix = "";
  let suffix = "";
  let totalSlots = 0;

  // Complex case: both decimal and fraction (e.g., "€ __.___,__/__")
  // This represents dividing a decimal number (like currency) by a whole number
  if (hasFraction && hasDecimal) {
    type = "fraction";
    const parts = mask.split("/");
    if (parts.length !== 2) {
      throw new Error("Fraction mask must have exactly one / separator");
    }

    // The numerator is a decimal number (e.g., "€ __.___,__")
    const numeratorPart = parts[0];
    const decimalParts = numeratorPart.split(",");
    if (decimalParts.length !== 2) {
      throw new Error("Complex mask: numerator must be a valid decimal format");
    }

    // Extract prefix and integer part of numerator
    const integerPattern = extractPattern(decimalParts[0]);
    if (!integerPattern) {
      throw new Error("Complex mask: numerator integer part must contain underscores");
    }
    prefix = integerPattern.prefix;
    const integerLength = integerPattern.digitLength;
    const integerThousandsSeps = integerPattern.thousandsSeparators;

    // Extract fractional part of numerator
    const fractionalPattern = extractPattern(decimalParts[1]);
    if (!fractionalPattern) {
      throw new Error("Complex mask: numerator fractional part must contain underscores");
    }
    const fractionalLength = fractionalPattern.digitLength;

    // The numerator is treated as a single segment with total length
    // The decimal separator appears after the integer part
    const numeratorLength = integerLength + fractionalLength;

    // Extract denominator
    const denominatorPattern = extractPattern(parts[1]);
    if (!denominatorPattern) {
      throw new Error("Complex mask: denominator must contain underscores");
    }
    const denominatorLength = denominatorPattern.digitLength;
    const denominatorThousandsSeps = denominatorPattern.thousandsSeparators;
    suffix = denominatorPattern.suffix;

    segments.push({
      type: "numerator",
      length: numeratorLength,
      startIndex: prefix.length,
      thousandsSeparators: integerThousandsSeps,
      decimalSeparator: integerLength // Decimal separator after integer digits
    });

    segments.push({
      type: "denominator",
      length: denominatorLength,
      startIndex: prefix.length + numeratorLength + 1, // +1 for '/'
      thousandsSeparators: denominatorThousandsSeps
    });

    totalSlots = numeratorLength + denominatorLength;
  } else if (hasFraction) {
    type = "fraction";
    const parts = mask.split("/");
    if (parts.length !== 2) {
      throw new Error("Fraction mask must have exactly one / separator");
    }

    // Extract numerator with support for thousands separators
    const numeratorPattern = extractPattern(parts[0]);
    if (!numeratorPattern) {
      throw new Error("Invalid fraction mask: numerator must contain underscores");
    }
    prefix = numeratorPattern.prefix;
    const numeratorLength = numeratorPattern.digitLength;
    const numeratorThousandsSeps = numeratorPattern.thousandsSeparators;

    // Extract denominator with support for thousands separators
    const denominatorPattern = extractPattern(parts[1]);
    if (!denominatorPattern) {
      throw new Error("Invalid fraction mask: denominator must contain underscores");
    }
    const denominatorLength = denominatorPattern.digitLength;
    const denominatorThousandsSeps = denominatorPattern.thousandsSeparators;
    suffix = denominatorPattern.suffix;

    segments.push({
      type: "numerator",
      length: numeratorLength,
      startIndex: prefix.length,
      thousandsSeparators: numeratorThousandsSeps.length > 0 ? numeratorThousandsSeps : undefined
    });

    segments.push({
      type: "denominator",
      length: denominatorLength,
      startIndex: prefix.length + numeratorLength + 1, // +1 for '/'
      thousandsSeparators: denominatorThousandsSeps.length > 0 ? denominatorThousandsSeps : undefined
    });

    totalSlots = numeratorLength + denominatorLength;
  } else if (hasDecimal) {
    type = "decimal";
    const parts = mask.split(",");
    if (parts.length !== 2) {
      throw new Error("Decimal mask must have exactly one , separator");
    }

    // Extract integer part with support for thousands separators
    const integerPattern = extractPattern(parts[0]);
    if (!integerPattern) {
      throw new Error("Invalid decimal mask: integer part must contain underscores");
    }
    prefix = integerPattern.prefix;
    const integerLength = integerPattern.digitLength;
    const integerThousandsSeps = integerPattern.thousandsSeparators;

    // Extract fractional part
    const fractionalPattern = extractPattern(parts[1]);
    if (!fractionalPattern) {
      throw new Error("Invalid decimal mask: fractional part must contain underscores");
    }
    const fractionalLength = fractionalPattern.digitLength;
    suffix = fractionalPattern.suffix;

    segments.push({
      type: "integer",
      length: integerLength,
      startIndex: prefix.length,
      thousandsSeparators: integerThousandsSeps.length > 0 ? integerThousandsSeps : undefined
    });

    segments.push({
      type: "fractional",
      length: fractionalLength,
      startIndex: prefix.length + integerLength + 1 // +1 for ','
    });

    totalSlots = integerLength + fractionalLength;
  } else {
    type = "simple";
    // Extract prefix and suffix with support for thousands separators
    const pattern = extractPattern(mask);
    if (!pattern) {
      throw new Error("Invalid mask: must contain at least one underscore");
    }
    prefix = pattern.prefix;
    const digitLength = pattern.digitLength;
    const thousandsSeps = pattern.thousandsSeparators;
    suffix = pattern.suffix;

    segments.push({
      type: "integer",
      length: digitLength,
      startIndex: prefix.length,
      thousandsSeparators: thousandsSeps.length > 0 ? thousandsSeps : undefined
    });

    totalSlots = digitLength;
  }

  return {
    mask,
    segments,
    prefix,
    suffix,
    type,
    totalSlots
  };
}

/**
 * Create initial mask state from a parsed format
 */
export function createMaskState(format: MaskFormat, initialValue = ""): MaskState {
  const segments: Record<string, string> = {};

  // Initialize all segments to empty strings
  format.segments.forEach(segment => {
    segments[segment.type] = "";
  });

  // Parse initial value if provided
  if (initialValue) {
    const parsed = parseMaskValue(initialValue, format);
    Object.assign(segments, parsed);
  }

  return {
    segments: segments as Record<MaskSegmentType, string>,
    activeSegment: format.segments[0]?.type || "integer"
  };
}

/**
 * Parse a value string according to a mask format
 */
export function parseMaskValue(
  value: string,
  format: MaskFormat
): Record<MaskSegmentType, string> {
  const result: Record<string, string> = {};

  // Remove prefix and suffix
  let cleanValue = value;
  if (format.prefix && cleanValue.startsWith(format.prefix)) {
    cleanValue = cleanValue.slice(format.prefix.length);
  }
  if (format.suffix && cleanValue.endsWith(format.suffix)) {
    cleanValue = cleanValue.slice(0, -format.suffix.length);
  }

  if (format.type === "fraction") {
    const parts = cleanValue.split("/");
    const numeratorSeg = format.segments.find(s => s.type === "numerator");
    const denominatorSeg = format.segments.find(s => s.type === "denominator");

    result.numerator = parts[0]?.trim() || "";
    result.denominator = parts[1]?.trim() || "";

    // Pad or truncate to match segment lengths
    if (numeratorSeg) {
      result.numerator = result.numerator.slice(0, numeratorSeg.length);
    }
    if (denominatorSeg) {
      result.denominator = result.denominator.slice(0, denominatorSeg.length);
    }
  } else if (format.type === "decimal") {
    const parts = cleanValue.split(",");
    const integerSeg = format.segments.find(s => s.type === "integer");
    const fractionalSeg = format.segments.find(s => s.type === "fractional");

    result.integer = parts[0]?.trim() || "";
    result.fractional = parts[1]?.trim() || "";

    // Pad or truncate to match segment lengths
    if (integerSeg) {
      result.integer = result.integer.slice(0, integerSeg.length);
    }
    if (fractionalSeg) {
      result.fractional = result.fractional.slice(0, fractionalSeg.length);
    }
  } else {
    const integerSeg = format.segments.find(s => s.type === "integer");
    result.integer = cleanValue.trim();

    if (integerSeg) {
      result.integer = result.integer.slice(0, integerSeg.length);
    }
  }

  return result as Record<MaskSegmentType, string>;
}

/**
 * Format mask state into a display string
 */
export function formatMaskValue(state: MaskState, format: MaskFormat): string {
  const { segments } = state;
  let result = "";

  if (format.type === "fraction") {
    const numerator = segments.numerator || "";
    const denominator = segments.denominator || "";
    result = `${numerator}/${denominator}`;
  } else if (format.type === "decimal") {
    const integer = segments.integer || "";
    const fractional = segments.fractional || "";
    result = `${integer},${fractional}`;
  } else {
    result = segments.integer || "";
  }

  return `${format.prefix}${result}${format.suffix}`;
}

/**
 * Get the raw numeric value from mask state (without prefix/suffix)
 */
export function getMaskRawValue(state: MaskState, format: MaskFormat): string {
  const { segments } = state;

  if (format.type === "fraction") {
    const numerator = segments.numerator || "";
    const denominator = segments.denominator || "";
    return `${numerator}/${denominator}`;
  } else if (format.type === "decimal") {
    const integer = segments.integer || "";
    const fractional = segments.fractional || "";
    return `${integer},${fractional}`;
  } else {
    return segments.integer || "";
  }
}

/**
 * Append a digit to the active segment in mask state
 */
export function appendDigitToMask(
  state: MaskState,
  digit: number,
  format: MaskFormat
): MaskState {
  const segment = format.segments.find(s => s.type === state.activeSegment);
  if (!segment) return state;

  const currentValue = state.segments[state.activeSegment] || "";

  // Check if we've reached the segment's length limit
  if (currentValue.length >= segment.length) {
    // Try to move to next segment if available
    const currentIndex = format.segments.findIndex(s => s.type === state.activeSegment);
    const nextSegment = format.segments[currentIndex + 1];

    if (nextSegment) {
      const nextValue = state.segments[nextSegment.type] || "";
      if (nextValue.length < nextSegment.length) {
        return {
          ...state,
          segments: {
            ...state.segments,
            [nextSegment.type]: nextValue + digit.toString()
          },
          activeSegment: nextSegment.type
        };
      }
    }

    return state;
  }

  return {
    ...state,
    segments: {
      ...state.segments,
      [state.activeSegment]: currentValue + digit.toString()
    }
  };
}

/**
 * Delete the last character from the active segment
 */
export function deleteCharFromMask(state: MaskState, format: MaskFormat): MaskState {
  const currentValue = state.segments[state.activeSegment] || "";

  if (currentValue.length > 0) {
    return {
      ...state,
      segments: {
        ...state.segments,
        [state.activeSegment]: currentValue.slice(0, -1)
      }
    };
  }

  // If current segment is empty, move to previous segment
  const currentIndex = format.segments.findIndex(s => s.type === state.activeSegment);
  if (currentIndex > 0) {
    const prevSegment = format.segments[currentIndex - 1];
    const prevValue = state.segments[prevSegment.type] || "";

    return {
      ...state,
      segments: {
        ...state.segments,
        [prevSegment.type]: prevValue.slice(0, -1)
      },
      activeSegment: prevSegment.type
    };
  }

  return state;
}

/**
 * Clear all mask segments
 */
export function clearMask(format: MaskFormat): MaskState {
  return createMaskState(format);
}

/**
 * Get locale-specific decimal separator
 */
export function getLocalizedDecimalSeparator(locale?: string): string {
  if (!locale) {
    locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  }

  // Special case: en-US uses period
  if (locale.startsWith("en-US")) {
    return ".";
  }

  // Most other locales use comma
  return ",";
}

/**
 * Replace decimal separator based on locale
 */
export function localizeDecimalSeparator(value: string, locale?: string): string {
  const separator = getLocalizedDecimalSeparator(locale);

  if (separator === ",") {
    return value.replace(/\./g, ",");
  }

  return value;
}

/**
 * Validate that a character is a valid digit
 */
export function isValidMaskDigit(char: string): boolean {
  return /^[0-9]$/.test(char);
}

/**
 * Check if mask state is complete (all segments filled)
 */
export function isMaskComplete(state: MaskState, format: MaskFormat): boolean {
  return format.segments.every(segment => {
    const value = state.segments[segment.type] || "";
    return value.length === segment.length;
  });
}

/**
 * Get the total number of characters entered across all segments
 */
export function getMaskFilledLength(state: MaskState): number {
  return Object.values(state.segments).reduce(
    (sum: number, value: string) => sum + value.length,
    0
  );
}
