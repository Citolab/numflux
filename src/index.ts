// ============================================================================
// Numflux - Framework-agnostic numpad
// ============================================================================

// Core numpad logic and state management
export {
  createNumpadState,
  reduceNumpad,
  normalizeConfig,
  mapKeyToAction,
  formatDisplayValue
} from "@/core/numpad";

// Core DOM implementation
export { createNumpadDom, type NumpadDomOptions, type NumpadDomInstance } from "@/core/numpad-dom";

// Validation utilities
export {
  toNumber,
  getDecimalPlaces,
  isValidValue,
  isWithinDecimalLimit,
  sanitizeValue,
  normalizeLeadingZeros
} from "@/utils/validation.utils";

// Vanilla DOM implementation (CSS Modules integration)
export {
  mountNumpad,
  type VanillaNumpadOptions,
  type VanillaNumpadInstance
} from "@/integrations/vanilla";

// Styled numpad with automatic CSS injection (no imports required!)
export {
  createStyledNumpad,
  type StyledNumpadOptions,
  type StyledNumpadInstance
} from "@/integrations/styled";

// Convenience alias - works exactly like mountNumpad but with automatic CSS injection
export { createStyledNumpad as mountStyledNumpad } from "@/integrations/styled";

// Icon integration helpers
export {
  createSvgIconTheme,
  createCssIconTheme,
  createCustomIconTheme,
  createImageIconTheme,
  extractSvgString
} from "@/integrations/icons";

// Integration utilities for building custom integrations
export {
  withClassNames,
  withTheme,
  withEventHandlers,
  withAttributes,
  getButtonVariant,
  compose
} from "@/integrations/utils";
export { BUTTON_VARIANTS, LABEL_KEYS } from "@/constants/constants";
export type { LabelKey } from "@/types/numpad";

// Core types
export type {
  NumpadConfig,
  NumpadState,
  NumpadAction,
  NumpadDigit,
  DisplayValue,
  DisplayRuleFunction,
  KeyValidatorFunction,
  NumpadOptions
} from "@/types/numpad";

// Utility functions
export { applyModuleClasses } from "@/utils/class.utils";

// Label utilities and themes
export { getDefaultLabel, DEFAULT_LABELS, LABEL_THEMES } from "@/utils/label.utils";
