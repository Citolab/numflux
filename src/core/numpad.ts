import type {
  DisplayValue,
  NumpadAction,
  NumpadConfig,
  NumpadDigit,
  NumpadState
} from "@/types/numpad";
import { sanitizeValue, toNumber } from "@/utils/validation.utils";

const DEFAULT_CONFIG: NumpadConfig = {
  allowDecimal: true,
  allowNegative: true,
  maxDigits: null,
  decimalSeparator: ".",
  min: null,
  max: null,
  sync: false
};

export function normalizeConfig(config: Partial<NumpadConfig> = {}): NumpadConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

export function createNumpadState(
  initialValue = "",
  config: Partial<NumpadConfig> = {}
): NumpadState {
  const normalized = sanitizeValue(initialValue, normalizeConfig(config));
  return { value: normalized, isPristine: true };
}

export function reduceNumpad(
  state: NumpadState,
  action: NumpadAction,
  config: Partial<NumpadConfig> = {}
): NumpadState {
  const normalizedConfig = normalizeConfig(config);
  const next: NumpadState = { ...state, lastAction: action.type, isPristine: false };

  switch (action.type) {
    case "digit":
      return { ...next, value: appendDigit(state.value, action.digit, normalizedConfig) };
    case "decimal":
      return { ...next, value: appendDecimal(state.value, normalizedConfig) };
    case "delete":
      return { ...next, value: deleteChar(state.value) };
    case "clear":
      return { ...next, value: "" };
    case "toggle-sign":
      return { ...next, value: toggleSign(state.value, normalizedConfig) };
    case "set":
      return { ...next, value: sanitizeValue(action.value, normalizedConfig) };
    case "submit":
      return next;
    default:
      return next;
  }
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
  let formatted =
    normalizedConfig.decimalSeparator === "."
      ? raw
      : raw.replace(".", normalizedConfig.decimalSeparator);

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

function appendDigit(current: string, digit: NumpadDigit, config: NumpadConfig): string {
  const isNegative = current.startsWith("-");
  const unsigned = isNegative ? current.slice(1) : current;
  const hasDecimal = unsigned.includes(".");
  const digitCount = unsigned.replace(".", "").length;

  if (config.maxDigits !== null && digitCount >= config.maxDigits) {
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
