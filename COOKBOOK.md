# 👨‍🍳 NumFlux Cookbook

Real-world recipes for common use cases.

## Table of Contents

- [⚛️ React: Complete Currency Input Component](#-react-complete-currency-input-component)
- [⚛️ React: Multi-Field Form with Validation](#-react-multi-field-form-with-validation)
- [🎯 React Hook: useNumpadInput](#-react-hook-usenumpadinput)
- [🔮 Vue: Reactive Numeric Input](#-vue-reactive-numeric-input)
- [🅰️ Angular: Reusable Numpad Component](#️-angular-reusable-numpad-component)

---

## ⚛️ React: Complete Currency Input Component

A React component with proper state management, validation, and TypeScript:

```tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createStyledNumpad } from 'numflux';
import type { NumpadDomInstance, DisplayValue } from 'numflux';

interface CurrencyInputProps {
  /** Initial value in cents (e.g., 1234 = $12.34) */
  initialValue?: number;
  /** Maximum amount in cents */
  maxAmount?: number;
  /** Minimum amount in cents */
  minAmount?: number;
  /** Currency symbol to display */
  currency?: string;
  /** Called when value changes */
  onChange?: (cents: number, formatted: string) => void;
  /** Called on form submission */
  onSubmit?: (cents: number, formatted: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

export function CurrencyInput({
  initialValue = 0,
  maxAmount = 99999999, // $999,999.99
  minAmount = 0,
  currency = '$',
  onChange,
  onSubmit,
  className = '',
  disabled = false,
  error = false,
  errorMessage
}: CurrencyInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const numpadRef = useRef<NumpadDomInstance | null>(null);
  const [value, setValue] = useState(initialValue);
  const [isVisible, setIsVisible] = useState(false);

  // Convert cents to decimal string for numpad
  const centsToDecimal = useCallback((cents: number): string => {
    return (cents / 100).toFixed(2);
  }, []);

  // Convert decimal string to cents
  const decimalToCents = useCallback((decimal: string): number => {
    return Math.round(parseFloat(decimal || '0') * 100);
  }, []);

  // Format currency for display
  const formatCurrency = useCallback((cents: number): string => {
    return `${currency}${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }, [currency]);

  // Validate amount
  const validateAmount = useCallback((cents: number): boolean => {
    return cents >= minAmount && cents <= maxAmount;
  }, [minAmount, maxAmount]);

  // Handle numpad changes
  const handleNumpadChange = useCallback((state: any, display: DisplayValue) => {
    const cents = decimalToCents(display.formatted);

    if (validateAmount(cents)) {
      setValue(cents);
      onChange?.(cents, formatCurrency(cents));
    }
  }, [decimalToCents, validateAmount, onChange, formatCurrency]);

  // Handle numpad submission
  const handleNumpadSubmit = useCallback((state: any, display: DisplayValue) => {
    const cents = decimalToCents(display.formatted);

    if (validateAmount(cents)) {
      setValue(cents);
      onSubmit?.(cents, formatCurrency(cents));
      setIsVisible(false);
    }
  }, [decimalToCents, validateAmount, onSubmit, formatCurrency]);

  // Initialize numpad
  useEffect(() => {
    if (!containerRef.current || disabled) return;

    numpadRef.current = createStyledNumpad(containerRef.current, {
      allowDecimal: 2,
      maxDigits: 8,
      initialValue: centsToDecimal(value),
      theme: error ? 'light' : 'light', // You could have error themes
      className: error ? 'numpad-error' : '',
      sync: true,
      onChange: handleNumpadChange,
      onSubmit: handleNumpadSubmit,
      a11y: {
        label: `Currency input for ${currency} amounts`,
        description: `Enter amount between ${formatCurrency(minAmount)} and ${formatCurrency(maxAmount)}`,
        announceChanges: true
      }
    });

    return () => {
      numpadRef.current?.destroy();
    };
  }, [
    value, disabled, error, currency, minAmount, maxAmount,
    centsToDecimal, handleNumpadChange, handleNumpadSubmit, formatCurrency
  ]);

  // Update numpad when external value changes
  useEffect(() => {
    if (numpadRef.current && !isVisible) {
      numpadRef.current.dispatch({
        type: 'set',
        value: centsToDecimal(value)
      });
    }
  }, [value, isVisible, centsToDecimal]);

  return (
    <div className={`currency-input ${className}`}>
      {/* Display Field */}
      <div
        className={`currency-display ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsVisible(!isVisible)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Current amount: ${formatCurrency(value)}`}
      >
        <span className="currency-symbol">{currency}</span>
        <span className="amount">{(value / 100).toFixed(2)}</span>
        {!disabled && (
          <span className="edit-hint">Click to edit</span>
        )}
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Numpad Container */}
      {isVisible && !disabled && (
        <div className="numpad-overlay">
          <div className="numpad-container">
            <div className="numpad-header">
              <h3>Enter Amount</h3>
              <button
                onClick={() => setIsVisible(false)}
                aria-label="Close numpad"
              >
                ✕
              </button>
            </div>
            <div ref={containerRef} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### CSS Styles

```css
.currency-input {
  position: relative;
}

.currency-display {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.currency-display:hover {
  border-color: #cbd5e1;
}

.currency-display.error {
  border-color: #ef4444;
}

.currency-display.disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.currency-symbol {
  font-weight: 600;
  margin-right: 8px;
}

.amount {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 18px;
  flex: 1;
}

.edit-hint {
  font-size: 12px;
  color: #64748b;
}

.error-message {
  margin-top: 4px;
  font-size: 14px;
  color: #ef4444;
}

.numpad-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.numpad-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.numpad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.numpad-header button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
}
```

### Usage Example

```tsx
function App() {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');

  const handleAmountChange = (cents: number, formatted: string) => {
    setAmount(cents);
    setError(''); // Clear error on change
  };

  const handleSubmit = (cents: number, formatted: string) => {
    if (cents < 100) { // Minimum $1.00
      setError('Minimum amount is $1.00');
      return;
    }

    console.log('Submitting:', formatted);
    // Submit to your API
  };

  return (
    <CurrencyInput
      initialValue={amount}
      minAmount={100}
      maxAmount={50000} // $500.00
      onChange={handleAmountChange}
      onSubmit={handleSubmit}
      error={!!error}
      errorMessage={error}
    />
  );
}
```

---

## ⚛️ React: Multi-Field Form with Validation

A complete form with multiple numeric inputs, validation, and proper React patterns:

```tsx
import React, { useState, useCallback } from 'react';
import { createStyledNumpad } from 'numflux';
import type { NumpadDomInstance, DisplayValue } from 'numflux';

interface FormData {
  price: number;
  quantity: number;
  discount: number;
  tax: number;
}

interface FormErrors {
  price?: string;
  quantity?: string;
  discount?: string;
  tax?: string;
}

const FIELD_CONFIGS = {
  price: {
    label: 'Price',
    allowDecimal: 2,
    maxDigits: 8,
    min: 0.01,
    max: 99999.99,
    placeholder: '0.00'
  },
  quantity: {
    label: 'Quantity',
    allowDecimal: false,
    maxDigits: 4,
    min: 1,
    max: 9999,
    placeholder: '1'
  },
  discount: {
    label: 'Discount %',
    allowDecimal: 2,
    maxDigits: 5,
    min: 0,
    max: 100,
    placeholder: '0.00'
  },
  tax: {
    label: 'Tax %',
    allowDecimal: 2,
    maxDigits: 5,
    min: 0,
    max: 50,
    placeholder: '0.00'
  }
} as const;

export function OrderForm() {
  const [formData, setFormData] = useState<FormData>({
    price: 0,
    quantity: 1,
    discount: 0,
    tax: 0
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [activeField, setActiveField] = useState<keyof FormData | null>(null);

  // Validation function
  const validateField = useCallback((field: keyof FormData, value: number): string | undefined => {
    const config = FIELD_CONFIGS[field];

    if (value < config.min) {
      return `${config.label} must be at least ${config.min}`;
    }

    if (value > config.max) {
      return `${config.label} cannot exceed ${config.max}`;
    }

    return undefined;
  }, []);

  // Calculate totals
  const calculations = React.useMemo(() => {
    const { price, quantity, discount, tax } = formData;
    const subtotal = price * quantity;
    const discountAmount = subtotal * (discount / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * (tax / 100);
    const total = discountedSubtotal + taxAmount;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      taxAmount,
      total
    };
  }, [formData]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof FormData) => {
    return (state: any, display: DisplayValue) => {
      const value = display.numeric || 0;

      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      // Validate and clear error if valid
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    };
  }, [validateField]);

  // Handle field submission (close numpad)
  const handleFieldSubmit = useCallback((field: keyof FormData) => {
    return (state: any, display: DisplayValue) => {
      const value = display.numeric || 0;
      const error = validateField(field, value);

      if (!error) {
        setActiveField(null);
      }
    };
  }, [validateField]);

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    (Object.keys(FIELD_CONFIGS) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (!hasErrors) {
      console.log('Submitting order:', { formData, calculations });
      // Submit to your API
    }
  };

  return (
    <div className="order-form">
      <form onSubmit={handleSubmit}>
        <h2>Order Details</h2>

        <div className="form-grid">
          {(Object.keys(FIELD_CONFIGS) as Array<keyof FormData>).map(field => {
            const config = FIELD_CONFIGS[field];
            const isActive = activeField === field;

            return (
              <NumericField
                key={field}
                label={config.label}
                value={formData[field]}
                placeholder={config.placeholder}
                isActive={isActive}
                error={errors[field]}
                config={config}
                onChange={handleFieldChange(field)}
                onSubmit={handleFieldSubmit(field)}
                onFocus={() => setActiveField(field)}
                onClose={() => setActiveField(null)}
              />
            );
          })}
        </div>

        {/* Calculations Summary */}
        <div className="calculations">
          <div className="calc-row">
            <span>Subtotal:</span>
            <span>${calculations.subtotal.toFixed(2)}</span>
          </div>
          <div className="calc-row">
            <span>Discount:</span>
            <span>-${calculations.discountAmount.toFixed(2)}</span>
          </div>
          <div className="calc-row">
            <span>Tax:</span>
            <span>${calculations.taxAmount.toFixed(2)}</span>
          </div>
          <div className="calc-row total">
            <span>Total:</span>
            <span>${calculations.total.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Create Order
        </button>
      </form>
    </div>
  );
}

// Reusable numeric field component
function NumericField({
  label,
  value,
  placeholder,
  isActive,
  error,
  config,
  onChange,
  onSubmit,
  onFocus,
  onClose
}: {
  label: string;
  value: number;
  placeholder: string;
  isActive: boolean;
  error?: string;
  config: typeof FIELD_CONFIGS[keyof typeof FIELD_CONFIGS];
  onChange: (state: any, display: DisplayValue) => void;
  onSubmit: (state: any, display: DisplayValue) => void;
  onFocus: () => void;
  onClose: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const numpadRef = React.useRef<NumpadDomInstance | null>(null);

  // Initialize numpad when active
  React.useEffect(() => {
    if (!isActive || !containerRef.current) {
      numpadRef.current?.destroy();
      numpadRef.current = null;
      return;
    }

    numpadRef.current = createStyledNumpad(containerRef.current, {
      allowDecimal: config.allowDecimal,
      maxDigits: config.maxDigits,
      initialValue: value.toString(),
      onChange,
      onSubmit,
      sync: true,
      a11y: {
        label: `Enter ${label.toLowerCase()}`,
        announceChanges: true
      }
    });

    return () => {
      numpadRef.current?.destroy();
    };
  }, [isActive, config, value, onChange, onSubmit, label]);

  const displayValue = config.allowDecimal
    ? value.toFixed(2)
    : value.toString();

  return (
    <div className={`field ${error ? 'error' : ''}`}>
      <label>{label}</label>
      <div
        className={`field-input ${isActive ? 'active' : ''}`}
        onClick={onFocus}
        role="button"
        tabIndex={0}
      >
        {displayValue || placeholder}
      </div>
      {error && <div className="field-error">{error}</div>}

      {isActive && (
        <div className="numpad-popup">
          <div className="numpad-header">
            <span>Enter {label}</span>
            <button type="button" onClick={onClose}>✕</button>
          </div>
          <div ref={containerRef} />
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 React Hook: useNumpadInput

A reusable React hook that encapsulates numpad logic:

```tsx
import { useEffect, useRef, useCallback, useState } from 'react';
import { createStyledNumpad } from 'numflux';
import type { NumpadDomInstance, NumpadDomOptions, DisplayValue } from 'numflux';

interface UseNumpadInputOptions extends Omit<NumpadDomOptions, 'onChange' | 'onSubmit'> {
  /** Called when value changes */
  onValueChange?: (value: number, formatted: string, display: DisplayValue) => void;
  /** Called when numpad is submitted */
  onSubmit?: (value: number, formatted: string, display: DisplayValue) => void;
  /** Format function for display value */
  formatter?: (value: number) => string;
  /** Parse function for input value */
  parser?: (value: string) => number;
}

export function useNumpadInput(options: UseNumpadInputOptions = {}) {
  const {
    onValueChange,
    onSubmit,
    formatter = (value) => value.toString(),
    parser = (value) => parseFloat(value) || 0,
    ...numpadOptions
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const numpadRef = useRef<NumpadDomInstance | null>(null);

  // Handle numpad changes
  const handleChange = useCallback((state: any, display: DisplayValue) => {
    const numericValue = parser(display.formatted);
    setValue(numericValue);
    onValueChange?.(numericValue, formatter(numericValue), display);
  }, [onValueChange, formatter, parser]);

  // Handle numpad submission
  const handleSubmit = useCallback((state: any, display: DisplayValue) => {
    const numericValue = parser(display.formatted);
    setValue(numericValue);
    onSubmit?.(numericValue, formatter(numericValue), display);
    setIsOpen(false);
  }, [onSubmit, formatter, parser]);

  // Initialize/destroy numpad based on open state
  useEffect(() => {
    if (!containerRef.current) return;

    if (isOpen) {
      numpadRef.current = createStyledNumpad(containerRef.current, {
        ...numpadOptions,
        initialValue: value.toString(),
        onChange: handleChange,
        onSubmit: handleSubmit,
        sync: true
      });
    } else {
      numpadRef.current?.destroy();
      numpadRef.current = null;
    }

    return () => {
      numpadRef.current?.destroy();
    };
  }, [isOpen, value, numpadOptions, handleChange, handleSubmit]);

  // API for controlling the numpad
  const numpadAPI = {
    // Open the numpad
    open: () => setIsOpen(true),

    // Close the numpad
    close: () => setIsOpen(false),

    // Toggle the numpad
    toggle: () => setIsOpen(prev => !prev),

    // Set value programmatically
    setValue: (newValue: number) => {
      setValue(newValue);
      if (numpadRef.current) {
        numpadRef.current.dispatch({
          type: 'set',
          value: newValue.toString()
        });
      }
    },

    // Get current state
    getValue: () => value,
    getFormattedValue: () => formatter(value),
    isOpen,

    // Ref for the numpad container
    containerRef
  };

  return numpadAPI;
}
```

### Example Component Using the Hook

```tsx
export function SmartNumericInput({
  label,
  placeholder = "0",
  currency,
  ...options
}: UseNumpadInputOptions & {
  label: string;
  placeholder?: string;
  currency?: string;
}) {
  const numpad = useNumpadInput({
    ...options,
    formatter: currency
      ? (value) => `${currency}${value.toFixed(2)}`
      : undefined
  });

  return (
    <div className="smart-input">
      <label>{label}</label>

      {/* Input Display */}
      <div
        className={`input-display ${numpad.isOpen ? 'active' : ''}`}
        onClick={numpad.toggle}
        role="button"
        tabIndex={0}
      >
        {numpad.getFormattedValue() || placeholder}
      </div>

      {/* Numpad Modal */}
      {numpad.isOpen && (
        <div className="numpad-modal">
          <div className="modal-backdrop" onClick={numpad.close} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enter {label}</h3>
              <button onClick={numpad.close}>×</button>
            </div>
            <div ref={numpad.containerRef} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Usage Examples

```tsx
function ExampleUsage() {
  return (
    <div>
      {/* Simple numeric input */}
      <SmartNumericInput
        label="Age"
        allowDecimal={false}
        maxDigits={3}
      />

      {/* Currency input */}
      <SmartNumericInput
        label="Price"
        currency="$"
        allowDecimal={2}
        maxDigits={8}
      />

      {/* Percentage input */}
      <SmartNumericInput
        label="Discount"
        allowDecimal={2}
        maxDigits={5}
        formatter={(value) => `${value}%`}
      />
    </div>
  );
}
```

---

## 🔮 Vue: Reactive Numeric Input

A reactive Vue 3 input that keeps the numpad in sync with your model and emits updates.

```vue
<template>
  <div class="vue-currency">
    <label class="vue-currency__label">Amount</label>
    <div class="vue-currency__value" @click="togglePad">
      {{ formatted }}
    </div>
    <div v-if="open" class="vue-currency__pad">
      <div ref="padRef"></div>
      <button class="vue-currency__close" @click="closePad">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from "vue";
import { createStyledNumpad } from "numflux";
import type { NumpadDomInstance } from "numflux";

const props = defineProps<{
  modelValue?: number;
  min?: number;
  max?: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const padRef = ref<HTMLElement | null>(null);
const padInstance = ref<NumpadDomInstance | null>(null);
const open = ref(false);

const value = ref(props.modelValue ?? 0);
const formatted = computed(() => (value.value / 100).toFixed(2));

watch(
  () => props.modelValue,
  (next) => {
    if (typeof next === "number") {
      value.value = next;
      padInstance.value?.dispatch({ type: "set", value: (next / 100).toFixed(2) });
    }
  }
);

const closePad = () => (open.value = false);
const togglePad = () => (open.value = !open.value);

onMounted(() => {
  if (!padRef.value) return;

  padInstance.value = createStyledNumpad(padRef.value, {
    allowDecimal: 2,
    theme: "light",
    sync: true,
    initialValue: (value.value / 100).toFixed(2),
    onChange: (_, display) => {
      const cents = Math.round((display.numeric ?? 0) * 100);
      if (typeof props.min === "number" && cents < props.min) return;
      if (typeof props.max === "number" && cents > props.max) return;
      value.value = cents;
      emit("update:modelValue", cents);
    },
    onSubmit: () => closePad()
  });
});

onUnmounted(() => {
  padInstance.value?.destroy();
});
</script>

<style scoped>
.vue-currency {
  display: grid;
  gap: 8px;
  max-width: 240px;
}
.vue-currency__label {
  font-weight: 600;
}
.vue-currency__value {
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-family: "SFMono-Regular", Menlo, monospace;
}
.vue-currency__pad {
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}
.vue-currency__close {
  margin-top: 8px;
  width: 100%;
}
</style>
```

## 🅰️ Angular: Reusable Numpad Component

Create a reusable Angular component that wraps `createStyledNumpad`, emits changes, and cleans up properly.

```ts
// numpad.component.ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from "@angular/core";
import { createStyledNumpad, type NumpadDomInstance, type DisplayValue } from "numflux";

@Component({
  selector: "app-numpad",
  template: `<div #padContainer></div>`,
  standalone: true
})
export class NumpadComponent implements AfterViewInit, OnDestroy {
  @ViewChild("padContainer", { static: true }) padContainer!: ElementRef<HTMLDivElement>;

  @Input() allowDecimal: number | boolean = 2;
  @Input() allowNegative = false;
  @Input() theme: "light" | "dark" = "light";
  @Input() initialValue = "0";

  @Output() change = new EventEmitter<{ state: any; display: DisplayValue }>();
  @Output() submit = new EventEmitter<{ state: any; display: DisplayValue }>();

  private instance: NumpadDomInstance | null = null;

  ngAfterViewInit() {
    this.instance = createStyledNumpad(this.padContainer.nativeElement, {
      allowDecimal: this.allowDecimal,
      allowNegative: this.allowNegative,
      initialValue: this.initialValue,
      theme: this.theme,
      sync: true,
      onChange: (state, display) => this.change.emit({ state, display }),
      onSubmit: (state, display) => this.submit.emit({ state, display })
    });
  }

  ngOnDestroy() {
    this.instance?.destroy();
  }
}
```

```html
<!-- usage in a template -->
<app-numpad
  [allowDecimal]="2"
  [allowNegative]="false"
  [theme]="'dark'"
  [initialValue]="'123.45'"
  (change)="onChange($event)"
  (submit)="onSubmit($event)"
></app-numpad>
```

```ts
// parent.component.ts
onChange(event: { state: any; display: DisplayValue }) {
  console.log("changed", event.display.numeric);
}

onSubmit(event: { state: any; display: DisplayValue }) {
  console.log("submitted", event.display.numeric);
}
```

---

## 💡 Tips & Best Practices

### Performance Optimization
- Always destroy numpad instances in cleanup functions
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Consider debouncing value changes for expensive operations

### Accessibility
- Always provide meaningful `aria-label` attributes
- Use proper semantic HTML roles
- Test with screen readers
- Ensure keyboard navigation works properly

### State Management
- Keep numpad state separate from form state
- Use controlled components for better predictability
- Validate on both change and submit events

### Error Handling
- Provide clear, user-friendly error messages
- Validate ranges and formats appropriately
- Handle edge cases like empty values and invalid inputs

### UX Considerations
- Provide visual feedback for user interactions
- Use appropriate input modes for different number types
- Consider mobile users and touch interactions
- Implement proper loading and disabled states
