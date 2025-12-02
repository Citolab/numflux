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
  normalizeLeadingZeros,
  canAddDigit
} from "@/utils/validation.utils";

// Main numpad integration (requires CSS import)
export {
  createNumpad,
  type CreateNumpadOptions,
  type CreateNumpadInstance
} from "@/integrations/global-styles";

// Icon integration helpers
export {
  createSvgIconTheme,
  createCssIconTheme,
  createCustomIconTheme,
  createImageIconTheme,
  extractSvgString
} from "@/utils/icon.utils";

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

// Core types
export type {
  NumpadConfig,
  NumpadState,
  NumpadAction,
  NumpadDigit,
  DisplayValue,
  DisplayRuleFunction,
  KeyValidatorFunction,
  NumpadOptions,
  LabelKey
} from "@/types/numpad";

// Utility functions
export { applyModuleClasses } from "@/utils/class.utils";

// Label utilities and themes
export { getDefaultLabel, DEFAULT_LABELS, LABEL_THEMES } from "@/utils/label.utils";

// Mask utilities and display
export {
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
export { createMaskDisplay, getMaskDisplayString } from "@/core/numpad-mask";
