import { sanitizeValue, toNumber } from "@/utils/validation.utils";
import {
  parseMask,
  createMaskState,
  appendDigitToMask,
  deleteCharFromMask,
  clearMask,
  formatMaskValue,
  getMaskRawValue
} from "@/utils/mask.utils";

import type {
  DisplayValue,
  NumpadAction,
  NumpadConfig,
  NumpadDigit,
  NumpadState,
  ValidationError
} from "@/types/numpad";
import type { MaskFormat, MaskState } from "@/types/mask";

/**
 * Validate a numeric value against configuration constraints
 */
function validateValue(value: string, config: NumpadConfig): ValidationError {
  if (!value || value === "-") return null;

  const numericValue = toNumber(value);
  if (numericValue === null) return null;

  // Check minValue constraint
  if (config.minValue !== null && config.minValue !== undefined && numericValue < config.minValue) {
    return "minValue";
  }

  // Check maxValue constraint
  if (config.maxValue !== null && config.maxValue !== undefined && numericValue > config.maxValue) {
    return "maxValue";
  }

  // Check digit count constraints
  const digitCount = value.replace(/[-.]/g, "").length;

  if (
    config.minDigits !== null &&
    config.minDigits !== undefined &&
    digitCount < config.minDigits
  ) {
    return "minDigits";
  }

  if (
    config.maxDigits !== null &&
    config.maxDigits !== undefined &&
    digitCount > config.maxDigits
  ) {
    return "maxDigits";
  }

  return null;
}

const DEFAULT_CONFIG: NumpadConfig = {
  allowDecimal: true,
  allowNegative: true,
  maxDigits: null,
  minDigits: null,
  decimalSeparator: ".",
  minValue: null,
  maxValue: null,
  sync: false,
  mask: undefined
};

export function normalizeConfig(config: Partial<NumpadConfig> = {}): NumpadConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

export function createNumpadState(
  initialValue = "",
  config: Partial<NumpadConfig> = {}
): NumpadState {
  const normalizedConfig = normalizeConfig(config);

  // Check if mask mode is enabled
  if (normalizedConfig.mask) {
    try {
      const maskFormat = parseMask(normalizedConfig.mask);
      const maskState = createMaskState(maskFormat, initialValue);
      const value = getMaskRawValue(maskState, maskFormat);

      return {
        value,
        isPristine: true,
        maskState,
        validationError: validateValue(value, normalizedConfig)
      };
    } catch (error) {
      console.warn("Invalid mask format, falling back to standard mode:", error);
    }
  }

  // Standard mode
  const normalized = sanitizeValue(initialValue, normalizedConfig);
  return {
    value: normalized,
    isPristine: true,
    validationError: validateValue(normalized, normalizedConfig)
  };
}

type MaskActionHandler = (
  state: NumpadState,
  action: NumpadAction,
  maskFormat: MaskFormat
) => { value: string; maskState: MaskState };

type StandardActionHandler = (
  state: NumpadState,
  action: NumpadAction,
  config: NumpadConfig
) => Pick<NumpadState, "value">;

// Action handlers for mask mode
const maskActionHandlers: Record<string, MaskActionHandler> = {
  digit: (state, action, maskFormat) => {
    // maskState must exist when these handlers are called
    const maskState = (state.maskState ?? createMaskState(maskFormat, state.value)) as MaskState;

    if (action.type !== "digit") {
      return { value: state.value, maskState };
    }
    const newMaskState = appendDigitToMask(maskState, action.digit, maskFormat);
    return {
      value: getMaskRawValue(newMaskState, maskFormat),
      maskState: newMaskState
    };
  },
  delete: (state, _action, maskFormat) => {
    // maskState must exist when these handlers are called
    const maskState = (state.maskState ?? createMaskState(maskFormat, state.value)) as MaskState;

    const newMaskState = deleteCharFromMask(maskState, maskFormat);
    return {
      value: getMaskRawValue(newMaskState, maskFormat),
      maskState: newMaskState
    };
  },
  clear: (_state, _action, maskFormat) => {
    const newMaskState = clearMask(maskFormat);
    return {
      value: getMaskRawValue(newMaskState, maskFormat),
      maskState: newMaskState
    };
  },
  set: (_state, action, maskFormat) => {
    const value = action.type === "set" ? action.value : "";
    const newMaskState = createMaskState(maskFormat, value);
    return {
      value: getMaskRawValue(newMaskState, maskFormat),
      maskState: newMaskState
    };
  }
};

// Action handlers for standard mode
const standardActionHandlers: Record<string, StandardActionHandler> = {
  digit: (state, action, config) => {
    if (action.type !== "digit") return { value: state.value };
    return { value: appendDigit(state.value, action.digit, config) };
  },
  decimal: (state, _action, config) => ({
    value: appendDecimal(state.value, config)
  }),
  delete: (state) => ({
    value: deleteChar(state.value)
  }),
  clear: () => ({
    value: ""
  }),
  "toggle-sign": (state, _action, config) => ({
    value: toggleSign(state.value, config)
  }),
  set: (_state, action, config) => {
    if (action.type !== "set") return { value: "" };
    return { value: sanitizeValue(action.value, config) };
  }
};

export function reduceNumpad(
  state: NumpadState,
  action: NumpadAction,
  config: Partial<NumpadConfig> = {}
): NumpadState {
  const normalizedConfig = normalizeConfig(config);
  const next: NumpadState = { ...state, lastAction: action.type, isPristine: false };

  // Submit action returns immediately
  if (action.type === "submit") {
    return next;
  }

  // Mask mode
  if (normalizedConfig.mask && state.maskState) {
    try {
      const maskFormat = parseMask(normalizedConfig.mask);
      const handler = maskActionHandlers[action.type];

      if (handler) {
        const updates = handler(state, action, maskFormat);
        const validationError = validateValue(updates.value, normalizedConfig);
        return { ...next, ...updates, validationError };
      }

      // Unsupported actions in mask mode (decimal, toggle-sign)
      return next;
    } catch (error) {
      console.warn("Mask operation failed:", error);
      return next;
    }
  }

  // Standard mode
  const handler = standardActionHandlers[action.type];
  if (handler) {
    const updates = handler(state, action, normalizedConfig);
    const validationError = validateValue(updates.value, normalizedConfig);
    return { ...next, ...updates, validationError };
  }

  return next;
}

export function mapKeyToAction(
  key: string,
  config: Partial<NumpadConfig> = {},
  currentValue = "",
  keyValidator?: (key: string, value: string, config: NumpadConfig) => boolean
): NumpadAction | null {
  const normalizedConfig = normalizeConfig(config);

  // Use custom key validator if provided
  if (keyValidator) {
    try {
      if (!keyValidator(key, currentValue, normalizedConfig)) {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (/^[0-9]$/.test(key)) {
    return { type: "digit", digit: Number(key) as NumpadDigit };
  }

  if ((key === "." || key === normalizedConfig.decimalSeparator) && normalizedConfig.allowDecimal) {
    return { type: "decimal" };
  }

  if (key === "Backspace") {
    return { type: "delete" };
  }

  if (key === "Delete") {
    return { type: "clear" };
  }

  if (key === "-" && normalizedConfig.allowNegative) {
    return { type: "toggle-sign" };
  }

  if (key === "Enter") {
    return { type: "submit" };
  }

  return null;
}

export function formatDisplayValue(
  state: NumpadState,
  config: Partial<NumpadConfig> = {},
  displayRule?: (value: string, config: NumpadConfig) => string
): DisplayValue {
  const normalizedConfig = normalizeConfig(config);
  const raw = state.value;

  // Mask mode formatting
  if (typeof normalizedConfig.mask === "string" && state.maskState) {
    try {
      const maskFormat = parseMask(normalizedConfig.mask);
      const formatted = formatMaskValue(state.maskState as MaskState, maskFormat);

      // For mask mode, numeric conversion depends on type
      let numeric: number | null = null;
      if (maskFormat.type === "decimal") {
        // Convert decimal format to standard decimal number
        const decimalValue = raw.replace(",", ".");
        numeric = toNumber(decimalValue);
      } else if (maskFormat.type === "simple") {
        numeric = toNumber(raw);
      }
      // For fractions, numeric stays null as it's not a simple number

      return { raw, formatted, numeric };
    } catch (error) {
      console.warn("Mask formatting failed:", error);
    }
  }

  // Standard mode formatting
  let formatted =
    normalizedConfig.decimalSeparator === "."
      ? raw
      : raw.replace(".", normalizedConfig.decimalSeparator);

  // Pad decimal places if allowDecimal is a number
  if (typeof normalizedConfig.allowDecimal === "number" && normalizedConfig.allowDecimal > 0) {
    formatted = padDecimalPlaces(
      formatted,
      normalizedConfig.allowDecimal,
      normalizedConfig.decimalSeparator
    );
  }

  // Apply custom display rule if provided
  if (displayRule) {
    try {
      const customFormatted = displayRule(raw, normalizedConfig);
      if (typeof customFormatted === "string") {
        formatted = customFormatted;
      }
    } catch {
      // Fall back to default formatting if custom rule fails
    }
  }

  const numeric = toNumber(state.value);

  return { raw, formatted, numeric };
}

/**
 * Pad decimal places with zeros to match the specified precision
 */
function padDecimalPlaces(value: string, decimalPlaces: number, separator: string): string {
  if (!value) return `0${separator}${"0".repeat(decimalPlaces)}`;

  const [integerPart = "0", fractionalPart = ""] = value.split(separator);

  // Pad fractional part with zeros
  const paddedFractional = fractionalPart.padEnd(decimalPlaces, "0");

  return `${integerPart}${separator}${paddedFractional}`;
}

function appendDigit(current: string, digit: NumpadDigit, config: NumpadConfig): string {
  const isNegative = current.startsWith("-");
  const unsigned = isNegative ? current.slice(1) : current;
  const hasDecimal = unsigned.includes(".");
  const digitCount = unsigned.replace(".", "").length;

  if (
    config.maxDigits !== null &&
    config.maxDigits !== undefined &&
    digitCount >= config.maxDigits
  ) {
    return current;
  }

  // Check decimal places limit
  if (hasDecimal && typeof config.allowDecimal === "number") {
    const [, fractionalPart = ""] = unsigned.split(".");
    if (fractionalPart.length >= config.allowDecimal) {
      return current;
    }
  }

  if (unsigned === "" || unsigned === "0") {
    const nextUnsigned = digit === 0 && !hasDecimal ? "0" : String(digit);
    return isNegative ? `-${nextUnsigned}` : nextUnsigned;
  }

  return `${isNegative ? "-" : ""}${unsigned}${digit}`;
}

function appendDecimal(current: string, config: NumpadConfig): string {
  if (!config.allowDecimal) return current;

  const isNegative = current.startsWith("-");
  const unsigned = isNegative ? current.slice(1) : current;

  if (unsigned.includes(".")) return current;

  const base = unsigned === "" ? "0" : unsigned;
  return `${isNegative ? "-" : ""}${base}.`;
}

function deleteChar(current: string): string {
  if (current === "") return current;
  const next = current.slice(0, -1);
  return next === "-" ? "" : next;
}

function toggleSign(current: string, config: NumpadConfig): string {
  if (!config.allowNegative) return current;
  if (!current) return "-";
  return current.startsWith("-") ? current.slice(1) : `-${current}`;
}
