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
 * Validate if a value is within the configured min/max bounds
 */
export function isValidValue(value: string, config: NumpadConfig): boolean {
  const numeric = toNumber(value);
  if (numeric === null) return true; // Allow empty/invalid during input

  if (config.min !== null && config.min !== undefined && numeric < config.min) return false;
  if (config.max !== null && config.max !== undefined && numeric > config.max) return false;

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
      if (config.maxDigits !== null && digitCount >= config.maxDigits) {
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
