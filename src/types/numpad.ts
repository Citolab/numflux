import { LABEL_KEYS } from "@/constants";

export type NumpadDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface NumpadConfig {
  allowDecimal: boolean | number; // true/false or number of decimal places
  allowNegative: boolean;
  maxDigits: number | null;
  decimalSeparator: string;
  min?: number | null; // minimum value validation
  max?: number | null; // maximum value validation
  sync?: boolean; // real-time callbacks vs submit-only
}

export type NumpadAction =
  | { type: "digit"; digit: NumpadDigit }
  | { type: "decimal" }
  | { type: "delete" }
  | { type: "clear" }
  | { type: "toggle-sign" }
  | { type: "set"; value: string }
  | { type: "submit" };

export interface NumpadState {
  value: string;
  isPristine: boolean;
  lastAction?: NumpadAction["type"];
}

export interface DisplayValue {
  raw: string;
  formatted: string;
  numeric: number | null;
}

// Function types for customization
export interface DisplayRuleFunction {
  (value: string, config: NumpadConfig): string;
}

export interface KeyValidatorFunction {
  (key: string, currentValue: string, config: NumpadConfig): boolean;
}

// Enhanced configuration for components
export interface NumpadOptions {
  displayRule?: DisplayRuleFunction;
  keyValidator?: KeyValidatorFunction;
  position?:
    | "center"
    | "flex-start"
    | "flex-end"
    | "startBottomLeft"
    | "startBottomRight"
    | "startTopLeft"
    | "startTopRight";
  inline?: boolean;
}

// Label and icon system types
export type LabelType = (typeof LABEL_KEYS)[number];
export type LabelKey = LabelType;

export interface IconConfig {
  /** Text label or Unicode symbol */
  text?: string;
  /** SVG string or data URI */
  svg?: string;
  /** Image URL or data URI for PNG/other formats */
  image?: string;
  /** React component or render function for icons */
  component?: unknown; // Generic to avoid React dependency
  /** Element to clone/mount (for pre-created elements) */
  element?: HTMLElement;
  /** Alt text for accessibility */
  alt?: string;
  /** CSS class names to apply to the icon */
  className?: string;
  /** Custom render function for maximum flexibility */
  render?: (container: HTMLElement, alt?: string) => void;
}

export type LabelConfig = string | IconConfig;

export interface LabelTheme {
  clear?: LabelConfig;
  delete?: LabelConfig;
  submit?: LabelConfig;
  decimal?: LabelConfig;
  toggleSign?: LabelConfig;
}
