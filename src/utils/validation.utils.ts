import type { NumpadConfig } from "@/types/numpad";

/**
 * Convert a string value to a number, returning null for invalid values
 */
export function toNumber(value: string): number | null {
  if (!value || value === "-") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Get the number of decimal places allowed by the configuration
 */
export function getDecimalPlaces(config: NumpadConfig): number | null {
  if (typeof config.allowDecimal === "number") {
    return config.allowDecimal;
  }
  return config.allowDecimal ? null : 0;
}

/**
 * Validate if a value is within the configured minValue/maxValue bounds
 */
export function isValidValue(value: string, config: NumpadConfig): boolean {
  const numeric = toNumber(value);
  if (numeric === null) return true; // Allow empty/invalid during input

  if (config.minValue !== null && config.minValue !== undefined && numeric < config.minValue)
    return false;
  if (config.maxValue !== null && config.maxValue !== undefined && numeric > config.maxValue)
    return false;

  return true;
}

/**
 * Check if a value is within decimal places limit
 */
export function isWithinDecimalLimit(value: string, config: NumpadConfig): boolean {
  if (!config.allowDecimal || typeof config.allowDecimal !== "number") {
    return true;
  }

  const decimalIndex = value.indexOf(".");
  if (decimalIndex === -1) return true;

  const fractionalPart = value.slice(decimalIndex + 1);
  return fractionalPart.length <= config.allowDecimal;
}

/**
 * Normalize leading zeros in a numeric string
 */
export function normalizeLeadingZeros(value: string, hasDecimal: boolean): string {
  if (!value) return "";
  if (hasDecimal) {
    const [intPart, ...rest] = value.split(".");
    const trimmedInt = intPart.replace(/^0+(?=\d)/, "") || "0";
    const fractional = rest.join(".");
    return fractional ? `${trimmedInt}.${fractional}` : `${trimmedInt}.`;
  }
  return value.replace(/^0+(?=\d)/, "") || "0";
}

/**
 * Sanitize and normalize a value string according to numpad configuration
 */
/**
 * Check if the toggle-sign button should be enabled based on current value and constraints
 */
export function canToggleSign(value: string, config: NumpadConfig): boolean {
  if (!config.allowNegative) return false;
  if (!value || value === "-") return true;

  const numeric = toNumber(value);
  if (numeric === null) return true;

  // If current value is positive, check if negative version would be valid
  if (numeric > 0) {
    const negativeValue = -numeric;
    if (
      config.minValue !== null &&
      config.minValue !== undefined &&
      negativeValue < config.minValue
    ) {
      return false;
    }
    return true;
  }

  // If current value is negative, check if positive version would be valid
  if (numeric < 0) {
    const positiveValue = Math.abs(numeric);
    if (
      config.maxValue !== null &&
      config.maxValue !== undefined &&
      positiveValue > config.maxValue
    ) {
      return false;
    }
    return true;
  }

  // Value is zero, can always toggle
  return true;
}

/**
 * Check if adding a specific digit would result in a valid value
 */
export function canAddDigit(currentValue: string, digit: number, config: NumpadConfig): boolean {
  // Check maxDigits constraint
  if (config.maxDigits !== null && config.maxDigits !== undefined) {
    const digitCount = currentValue.replace(/[^0-9]/g, "").length;
    if (digitCount >= config.maxDigits) {
      return false;
    }
  }

  // Simulate adding the digit
  const hypotheticalValue = currentValue + digit.toString();
  const numeric = toNumber(hypotheticalValue);

  if (numeric === null) return true;

  // Check maxValue constraint
  if (config.maxValue !== null && config.maxValue !== undefined && numeric > config.maxValue) {
    return false;
  }

  // Check minValue constraint (only matters for negative numbers)
  if (config.minValue !== null && config.minValue !== undefined && numeric < config.minValue) {
    return false;
  }

  return true;
}

export function sanitizeValue(value: string, config: NumpadConfig): string {
  const normalizedChars: string[] = [];
  let hasDecimal = false;
  let isNegative = false;
  let digitCount = 0;

  const decimalChars = new Set([".", config.decimalSeparator]);

  for (const char of value.trim()) {
    if (char === "-" && config.allowNegative && !isNegative && normalizedChars.length === 0) {
      isNegative = true;
      continue;
    }

    if (decimalChars.has(char) && config.allowDecimal && !hasDecimal) {
      hasDecimal = true;
      normalizedChars.push(".");
      continue;
    }

    if (/[0-9]/.test(char)) {
      if (config.maxDigits && digitCount >= config.maxDigits) {
        continue;
      }
      normalizedChars.push(char);
      digitCount += 1;
    }
  }

  const unsignedValue = normalizeLeadingZeros(normalizedChars.join(""), hasDecimal);
  const prefix = isNegative ? "-" : "";

  return unsignedValue ? `${prefix}${unsignedValue}` : prefix ? "-" : "";
}
