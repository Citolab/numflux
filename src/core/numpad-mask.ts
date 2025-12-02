/**
 * Mask display component - renders mask-based input with character slots
 */

import type { MaskFormat, MaskState, MaskDisplayOptions } from "@/types/mask";
import { getLocalizedDecimalSeparator } from "@/utils/mask.utils";

export interface MaskDisplayElement {
  container: HTMLElement;
  update: (state: MaskState) => void;
  destroy: () => void;
}

/**
 * Create a mask display element with character slots
 */
export function createMaskDisplay(
  format: MaskFormat,
  options: MaskDisplayOptions = {}
): MaskDisplayElement {
  console.log('[MASK DISPLAY] Creating mask display', { format, options });

  const {
    showCharacterSlots = true,
    charWidth = "1.2ch",
    locale
  } = options;

  const container = document.createElement("div");
  container.className = "numflux-mask-display";
  container.dataset.maskType = format.type;

  // Apply CSS variables
  container.style.setProperty("--char-width", charWidth);

  console.log('[MASK DISPLAY] Format type:', format.type);

  if (format.type === "fraction") {
    createFractionDisplay(container, format, showCharacterSlots);
  } else if (format.type === "decimal") {
    createDecimalDisplay(container, format, showCharacterSlots, locale);
  } else {
    createSimpleDisplay(container, format, showCharacterSlots);
  }

  console.log('[MASK DISPLAY] Container created, children:', container.children.length);
  console.log('[MASK DISPLAY] Container HTML:', container.innerHTML);

  const update = (state: MaskState) => {
    updateMaskDisplay(container, state, format);
  };

  const destroy = () => {
    container.remove();
  };

  return { container, update, destroy };
}

/**
 * Create fraction display (numerator / denominator with division line)
 */
function createFractionDisplay(
  container: HTMLElement,
  format: MaskFormat,
  showCharacterSlots: boolean
): void {
  const wrapper = document.createElement("div");
  wrapper.className = "numflux-mask-fraction";

  // Prefix
  if (format.prefix) {
    const prefix = document.createElement("span");
    prefix.className = "numflux-mask-prefix";
    prefix.textContent = format.prefix;
    wrapper.appendChild(prefix);
  }

  // Fraction container
  const fractionContainer = document.createElement("div");
  fractionContainer.className = "numflux-mask-fraction-container";

  // Numerator
  const numeratorSeg = format.segments.find(s => s.type === "numerator");
  if (numeratorSeg) {
    const numerator = document.createElement("span");
    numerator.className = "numflux-mask-numerator";
    numerator.dataset.segment = "numerator";
    createSegmentSlots(numerator, numeratorSeg.length, showCharacterSlots);
    fractionContainer.appendChild(numerator);
  }

  // Division line
  const divisionLine = document.createElement("span");
  divisionLine.className = "numflux-mask-division-line";
  divisionLine.textContent = "/";
  fractionContainer.appendChild(divisionLine);

  // Denominator
  const denominatorSeg = format.segments.find(s => s.type === "denominator");
  if (denominatorSeg) {
    const denominator = document.createElement("span");
    denominator.className = "numflux-mask-denominator";
    denominator.dataset.segment = "denominator";
    createSegmentSlots(denominator, denominatorSeg.length, showCharacterSlots);
    fractionContainer.appendChild(denominator);
  }

  wrapper.appendChild(fractionContainer);

  // Suffix
  if (format.suffix) {
    const suffix = document.createElement("span");
    suffix.className = "numflux-mask-suffix";
    suffix.textContent = format.suffix;
    wrapper.appendChild(suffix);
  }

  container.appendChild(wrapper);
}

/**
 * Create decimal display (integer , fractional)
 */
function createDecimalDisplay(
  container: HTMLElement,
  format: MaskFormat,
  showCharacterSlots: boolean,
  locale?: string
): void {
  const wrapper = document.createElement("div");
  wrapper.className = "numflux-mask-decimal";

  // Prefix
  if (format.prefix) {
    const prefix = document.createElement("span");
    prefix.className = "numflux-mask-prefix";
    prefix.textContent = format.prefix;
    wrapper.appendChild(prefix);
  }

  // Integer part
  const integerSeg = format.segments.find(s => s.type === "integer");
  if (integerSeg) {
    const integer = document.createElement("span");
    integer.className = "numflux-mask-integer";
    integer.dataset.segment = "integer";
    createSegmentSlots(integer, integerSeg.length, showCharacterSlots);
    wrapper.appendChild(integer);
  }

  // Decimal separator
  const separator = document.createElement("span");
  separator.className = "numflux-mask-separator";
  separator.textContent = getLocalizedDecimalSeparator(locale);
  wrapper.appendChild(separator);

  // Fractional part
  const fractionalSeg = format.segments.find(s => s.type === "fractional");
  if (fractionalSeg) {
    const fractional = document.createElement("span");
    fractional.className = "numflux-mask-fractional";
    fractional.dataset.segment = "fractional";
    createSegmentSlots(fractional, fractionalSeg.length, showCharacterSlots);
    wrapper.appendChild(fractional);
  }

  // Suffix
  if (format.suffix) {
    const suffix = document.createElement("span");
    suffix.className = "numflux-mask-suffix";
    suffix.textContent = format.suffix;
    wrapper.appendChild(suffix);
  }

  container.appendChild(wrapper);
}

/**
 * Create simple display (prefix + digits + suffix)
 */
function createSimpleDisplay(
  container: HTMLElement,
  format: MaskFormat,
  showCharacterSlots: boolean
): void {
  const wrapper = document.createElement("div");
  wrapper.className = "numflux-mask-simple";

  // Prefix
  if (format.prefix) {
    const prefix = document.createElement("span");
    prefix.className = "numflux-mask-prefix";
    prefix.textContent = format.prefix;
    wrapper.appendChild(prefix);
  }

  // Integer part
  const integerSeg = format.segments.find(s => s.type === "integer");
  if (integerSeg) {
    const integer = document.createElement("span");
    integer.className = "numflux-mask-integer";
    integer.dataset.segment = "integer";
    createSegmentSlots(integer, integerSeg.length, showCharacterSlots);
    wrapper.appendChild(integer);
  }

  // Suffix
  if (format.suffix) {
    const suffix = document.createElement("span");
    suffix.className = "numflux-mask-suffix";
    suffix.textContent = format.suffix;
    wrapper.appendChild(suffix);
  }

  container.appendChild(wrapper);
}

/**
 * Create character slots for a segment
 */
function createSegmentSlots(
  segment: HTMLElement,
  length: number,
  showCharacterSlots: boolean
): void {
  if (!showCharacterSlots) {
    segment.textContent = "";
    return;
  }

  for (let i = 0; i < length; i++) {
    const slot = document.createElement("span");
    slot.className = "numflux-mask-char-slot";
    slot.dataset.index = i.toString();
    slot.dataset.filled = "false";
    slot.textContent = "_";
    segment.appendChild(slot);
  }
}

/**
 * Update mask display with current state
 */
function updateMaskDisplay(
  container: HTMLElement,
  state: MaskState,
  format: MaskFormat
): void {
  format.segments.forEach(segmentInfo => {
    const segmentValue = state.segments[segmentInfo.type] || "";
    const segmentElement = container.querySelector(
      `[data-segment="${segmentInfo.type}"]`
    ) as HTMLElement;

    if (!segmentElement) return;

    const slots = segmentElement.querySelectorAll(".numflux-mask-char-slot");

    if (slots.length > 0) {
      // Update character slots
      slots.forEach((slot, index) => {
        const char = segmentValue[index];
        (slot as HTMLElement).textContent = char || "_";
        (slot as HTMLElement).dataset.filled = char ? "true" : "false";
      });

      // Mark active segment
      segmentElement.dataset.active =
        state.activeSegment === segmentInfo.type ? "true" : "false";
    } else {
      // Simple text display without slots
      segmentElement.textContent = segmentValue || "";
    }
  });
}

/**
 * Get the display string from a mask state
 */
export function getMaskDisplayString(state: MaskState, format: MaskFormat): string {
  if (format.type === "fraction") {
    const numerator = state.segments.numerator || "";
    const denominator = state.segments.denominator || "";
    return `${format.prefix}${numerator}/${denominator}${format.suffix}`;
  } else if (format.type === "decimal") {
    const integer = state.segments.integer || "";
    const fractional = state.segments.fractional || "";
    return `${format.prefix}${integer},${fractional}${format.suffix}`;
  } else {
    const integer = state.segments.integer || "";
    return `${format.prefix}${integer}${format.suffix}`;
  }
}
