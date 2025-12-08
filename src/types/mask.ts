/**
 * Mask-based input formatting types
 */

export type MaskSegmentType = "integer" | "fractional" | "numerator" | "denominator";

export interface MaskSegment {
  /** Type of segment */
  type: MaskSegmentType;
  /** Number of digit slots (underscore count) */
  length: number;
  /** Index in the mask string where this segment starts */
  startIndex: number;
  /** Positions where thousands separators should appear (e.g., [2] means after 2nd digit) */
  thousandsSeparators?: number[];
  /** Position where decimal separator should appear (e.g., 5 means after 5th digit) */
  decimalSeparator?: number;
}

export interface MaskFormat {
  /** Original mask string */
  mask: string;
  /** Parsed segments */
  segments: MaskSegment[];
  /** Prefix text (before all underscores) */
  prefix: string;
  /** Suffix text (after all underscores) */
  suffix: string;
  /** Type of mask format */
  type: "simple" | "fraction" | "decimal";
  /** Total number of digit slots */
  totalSlots: number;
}

export interface MaskState {
  /** Current value for each segment */
  segments: Record<MaskSegmentType, string>;
  /** Active segment being edited */
  activeSegment: MaskSegmentType;
}

export interface MaskDisplayOptions {
  /** Show individual character slots */
  showCharacterSlots?: boolean;
  /** Character width in CSS units */
  charWidth?: string;
  /** Locale for decimal separator */
  locale?: string;
}
