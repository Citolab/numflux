/**
 * Mask parsing and formatting utilities
 */

import type { MaskFormat, MaskSegment, MaskSegmentType, MaskState } from "@/types/mask";

/**
 * Parse a mask string into a structured format
 *
 * Mask syntax:
 * _ = placeholder for a single digit
 * / = division symbol for fractions
 * , = decimal separator
 * Any other characters = prefix/suffix literals
 *
 * @example
 * parseMask("___") → simple 3-digit number
 * parseMask("__/_____") → fraction (2 digits / 5 digits)
 * parseMask("€ ____/__") → money with prefix (€ 4 digits / 2 digits)
 * parseMask("__,__") → decimal number (2 digits , 2 digits)
 * parseMask("________ cm") → number with suffix
 */
export function parseMask(mask: string): MaskFormat {
  const hasFraction = mask.includes("/");
  const hasDecimal = mask.includes(",");

  if (hasFraction && hasDecimal) {
    throw new Error("Mask cannot contain both fraction (/) and decimal (,) separators");
  }

  let type: MaskFormat["type"] = "simple";
  const segments: MaskSegment[] = [];
  let prefix = "";
  let suffix = "";
  let totalSlots = 0;

  if (hasFraction) {
    type = "fraction";
    const parts = mask.split("/");
    if (parts.length !== 2) {
      throw new Error("Fraction mask must have exactly one / separator");
    }

    // Extract prefix from numerator part
    const numeratorMatch = parts[0].match(/^(.*?)(_+)$/);
    if (!numeratorMatch) {
      throw new Error("Invalid fraction mask: numerator must contain underscores");
    }
    prefix = numeratorMatch[1];
    const numeratorLength = numeratorMatch[2].length;

    // Extract suffix from denominator part
    const denominatorMatch = parts[1].match(/^(_+)(.*)$/);
    if (!denominatorMatch) {
      throw new Error("Invalid fraction mask: denominator must contain underscores");
    }
    const denominatorLength = denominatorMatch[1].length;
    suffix = denominatorMatch[2];

    segments.push({
      type: "numerator",
      length: numeratorLength,
      startIndex: prefix.length
    });

    segments.push({
      type: "denominator",
      length: denominatorLength,
      startIndex: prefix.length + numeratorLength + 1 // +1 for '/'
    });

    totalSlots = numeratorLength + denominatorLength;
  } else if (hasDecimal) {
    type = "decimal";
    const parts = mask.split(",");
    if (parts.length !== 2) {
      throw new Error("Decimal mask must have exactly one , separator");
    }

    // Extract prefix from integer part
    const integerMatch = parts[0].match(/^(.*?)(_+)$/);
    if (!integerMatch) {
      throw new Error("Invalid decimal mask: integer part must contain underscores");
    }
    prefix = integerMatch[1];
    const integerLength = integerMatch[2].length;

    // Extract suffix from fractional part
    const fractionalMatch = parts[1].match(/^(_+)(.*)$/);
    if (!fractionalMatch) {
      throw new Error("Invalid decimal mask: fractional part must contain underscores");
    }
    const fractionalLength = fractionalMatch[1].length;
    suffix = fractionalMatch[2];

    segments.push({
      type: "integer",
      length: integerLength,
      startIndex: prefix.length
    });

    segments.push({
      type: "fractional",
      length: fractionalLength,
      startIndex: prefix.length + integerLength + 1 // +1 for ','
    });

    totalSlots = integerLength + fractionalLength;
  } else {
    type = "simple";
    // Extract prefix and suffix
    const match = mask.match(/^(.*?)(_+)(.*)$/);
    if (!match) {
      throw new Error("Invalid mask: must contain at least one underscore");
    }
    prefix = match[1];
    const digitLength = match[2].length;
    suffix = match[3];

    segments.push({
      type: "integer",
      length: digitLength,
      startIndex: prefix.length
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
