# 🔢 Numflux

**Framework-agnostic numpad component**

A TypeScript library that provides a clean, extensible numpad implementation. Built agnostically, it works seamlessly with React, Vue, Angular, vanilla JS, or any other framework.

**[📺 View Live Demo](https://citolab.github.io/numflux/)**

## ✨ Features

- 🧮 **Pure Logic Core** - Side-effect-free reducer for numpad interactions
- 🏗️ **Composable Architecture** - Independent layers that can be mixed and matched
- ⚙️ **Highly Configurable** - Decimal places, validation, theming, custom separators, custom icon integration
- 🌐 **Framework Agnostic** - Works with React, Vue, Angular, Svelte, vanilla JS, or any other framework
- 📦 **Zero Dependencies** - Tiny bundle size, no runtime dependencies
- ✨ **Flexible Styling** - Use default styles, CSS Modules, custom CSS, or whatever you like
- ♿ **Accessible** - WCAG 2.1 AA compliant with screen reader support

## 🚀 Quick Start

```bash
npm install @citolab/numflux
```

```typescript
import { createStyledNumpad } from "@citolab/numflux";

const numpad = createStyledNumpad(document.getElementById("numpad"), {
  allowDecimal: 2,
  theme: "light", // or "dark"
  onChange: (state, display) => {
    console.log("Value:", display.numeric);
  }
});
```

## 📖 Basic Usage

<details>
<summary><strong>🎯 Pure State Logic (Framework-agnostic core)</strong></summary>

```typescript
import {
  NumpadAction,
  NumpadState,
  createNumpadState,
  formatDisplayValue,
  mapKeyToAction,
  reduceNumpad
} from "@citolab/numflux";

const config = {
  allowDecimal: 2,
  maxDigits: 8,
  min: 0,
  max: 9999.99,
  sync: false
};

let state: NumpadState = createNumpadState("", config);

const dispatch = (action: NumpadAction) => {
  state = reduceNumpad(state, action, config);
  return formatDisplayValue(state, config);
};

dispatch({ type: "digit", digit: 4 });
dispatch({ type: "digit", digit: 2 });
dispatch({ type: "decimal" });
dispatch({ type: "digit", digit: 5 });
// -> state.value === "42.5"
```

**Configuration Options:**
```typescript
const currencyConfig: NumpadConfig = {
  allowDecimal: 2,        // Exactly 2 decimal places
  allowNegative: false,   // No negative values
  maxDigits: 8,          // Max 8 total digits
  decimalSeparator: ".",  // Decimal separator
  min: 0,                // Minimum value
  max: 99999.99,         // Maximum value
  sync: true             // Real-time onChange callbacks
};
```

**Utility Functions:**
```typescript
import { toNumber, isValidValue, sanitizeValue } from "@citolab/numflux";

// Convert to number safely
const num = toNumber("42.50"); // -> 42.5

// Validate against constraints
const isValid = isValidValue("150", { max: 100 }); // -> false

// Clean user input
const clean = sanitizeValue("00042.500", { allowDecimal: 2 }); // -> "42.50"
```

</details>

<details>
<summary><strong>🎨 Ready-to-use Styled Numpad</strong></summary>

**Option 1: Zero imports (Recommended)**
```typescript
import { createStyledNumpad } from "@citolab/numflux";

const numpad = createStyledNumpad(document.getElementById("container"), {
  allowDecimal: 2,
  theme: "dark",
  onChange: (state, display) => {
    console.log("Value:", display.numeric);
  },
  onSubmit: (state, display) => {
    console.log("Submitted:", display.formatted);
  }
});

numpad.dispatch({ type: "clear" });
numpad.dispatch({ type: "set", value: "99.99" });
console.log("Current:", numpad.getState().value);
numpad.destroy();
```

<details>
<summary><strong>⚡ Framework-agnostic DOM (No styling)</strong></summary>

```typescript
import { createNumpadDom } from "@citolab/numflux";

const numpad = createNumpadDom(document.getElementById("container"), {
  allowDecimal: 2,
  theme: {
    name: "custom",
    cssVars: {
      "--numpad-bg": "#1a1a1a",
      "--numpad-text": "#ffffff"
    }
  },
  className: "my-custom-numpad",
  onChange: (state, display) => {
    console.log("Value:", display.numeric);
  }
});

// Access DOM elements directly
numpad.root;    // Main container
numpad.display; // Display element
numpad.keypad;  // Keypad container
```

Perfect for custom styling or framework integration.

</details>

## 🏗️ Architecture

Numflux uses a **layered architecture** where each layer is completely independent:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Framework     │    │    Styling       │    │   Custom        │
│  Integrations   │    │  Integrations    │    │ Integrations    │
│ (React, Vue...) │    │ (CSS, Tailwind)  │    │ (Your choice)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────────────────────────────────────┐
         │              🧰 Composable Utilities                  │
         │     (withTheme, withClassNames, withEvents...)        │
         └───────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────────────────────────────────────┐
         │              ⚡ Core DOM Implementation               │
         │         (Framework-agnostic DOM + Events)            │
         └───────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────────────────────────────────────┐
         │              🧮 Pure State Logic                      │
         │            (Reducers, Validation, Utils)             │
         └───────────────────────────────────────────────────────┘
```

**Benefits:**
- 🔄 **True Composability** - Mix and match any layers
- 🚫 **Zero Coupling** - Remove any integration without affecting others
- 📦 **Tree Shaking** - Import only what you need
- 🛠️ **Extensible** - Easy to add new integrations

## 🎨 Styling Options

Numflux offers three styling approaches with increasing levels of customization:

### 1. 🚀 **Styled Numpad** (Recommended)
Automatic CSS import, zero configuration, perfect for most projects.

```typescript
import { createStyledNumpad } from "@citolab/numflux";

const numpad = createStyledNumpad(container, {
  theme: "dark", // 'light' | 'dark'
  className: "my-numpad", // Additional CSS classes
  // Override CSS variables programmatically
  theme: {
    name: "custom",
    cssVars: { "--nf-accent": "#ff4757" }
  }
});
```

**Features:** Built-in themes, CSS variable overrides, automatic CSS import
**Best for:** Quick setup, most web applications

---

### 2. 🎛️ **CSS Modules** (Advanced)
Full control over themes and labels, requires CSS import.

```typescript
import { mountNumpad } from "@citolab/numflux";
import "@citolab/numflux/dist/styles/numpad.module.css";

const numpad = mountNumpad(container, {
  theme: "dark", // 'light' | 'dark'
  labelTheme: "unicode", // 'ascii' | 'unicode' | 'symbols' | 'minimal'
  labels: { delete: "Back", submit: "Done" } // Custom labels
});
```

**Features:** Label customization, icon integration, CSS Modules
**Best for:** Advanced theming, custom labels, design systems

---

### 3. 🛠️ **Custom Styling** (Full Control)
Unstyled core, build your own design with utilities.

```typescript
import { createNumpadDom, withTheme, withClassNames } from "@citolab/numflux";

let numpad = createNumpadDom(container);
numpad = withTheme(numpad, {
  cssVars: { "--nf-accent": "blue" }
});
numpad = withClassNames(numpad, {
  container: "rounded-lg shadow-xl" // Tailwind, etc.
});
```

**Features:** Zero styling, composable utilities, framework integration
**Best for:** Custom designs, CSS frameworks (Tailwind, etc.), full control

---

### 🎨 **Custom CSS Variables**
All approaches support CSS variable customization:

```css
.my-numpad {
  --nf-surface: #1a1a2e;      /* Background */
  --nf-text: #ffffff;         /* Text color */
  --nf-accent: #64ffda;       /* Accent color */
  --nf-button-radius: 12px;   /* Button corners */
  --nf-font-family: "Inter";  /* Typography */
}
```

---

### ♿ **Accessibility Options**
Numflux is WCAG 2.1 AA compliant with comprehensive accessibility features:

```typescript
const numpad = createStyledNumpad(container, {
  // Accessibility configuration
  a11y: {
    label: "Price input calculator",           // Component name
    description: "Enter price with decimal",  // Purpose description
    announceChanges: true                     // Screen reader announcements
  }
});
```

**Built-in Accessibility Features:**
- 🎯 **ARIA Labels** - Descriptive labels for all buttons and regions
- 📢 **Live Announcements** - Screen reader feedback for value changes
- ⌨️ **Keyboard Navigation** - Full keyboard support with focus management
- 🎨 **Focus Indicators** - High-contrast focus outlines
- 🏗️ **Semantic HTML** - Proper roles and ARIA attributes

## 🔌 Framework Integration

<details>
<summary><strong>⚛️ React</strong></summary>

**Styled Hook (Zero imports):**
```typescript
import { useEffect, useRef } from "react";
import { createStyledNumpad } from "@citolab/numflux";

function useStyledNumpad(options) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      instanceRef.current = createStyledNumpad(containerRef.current, options);
    }
    return () => instanceRef.current?.destroy();
  }, []);

  return { containerRef, instance: instanceRef.current };
}

function Calculator() {
  const { containerRef } = useStyledNumpad({
    allowDecimal: 2,
    theme: "dark",
    onChange: (state, display) => {
      console.log("Value:", display.numeric);
    }
  });

  return <div ref={containerRef} />;
}
```

**Custom Hook (Unstyled):**
```typescript
import { useEffect, useRef } from "react";
import { createNumpadDom } from "@citolab/numflux";

function useNumpad(options) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      instanceRef.current = createNumpadDom(containerRef.current, options);
    }
    return () => instanceRef.current?.destroy();
  }, []);

  return { containerRef, instance: instanceRef.current };
}
```

**Pure React Implementation:**
```typescript
import { useState } from "react";
import { createNumpadState, reduceNumpad, formatDisplayValue } from "@citolab/numflux";

function ReactNumpad() {
  const [state, setState] = useState(() => createNumpadState(""));
  const config = { allowDecimal: 2 };

  const dispatch = (action) => {
    setState(current => reduceNumpad(current, action, config));
  };

  const display = formatDisplayValue(state, config);

  return (
    <div className="numpad">
      <div className="display">{display.formatted}</div>
      <button onClick={() => dispatch({ type: "digit", digit: 1 })}>1</button>
      {/* ... more buttons ... */}
    </div>
  );
}
```

</details>

<details>
<summary><strong>🟢 Vue</strong></summary>

```vue
<template>
  <div ref="numpadRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createStyledNumpad } from '@citolab/numflux';
// No CSS import needed! ✨

const props = defineProps(['options']);
const emit = defineEmits(['change']);

const numpadRef = ref(null);
let numpadInstance = null;

onMounted(() => {
  if (numpadRef.value) {
    numpadInstance = createStyledNumpad(numpadRef.value, {
      theme: 'light',
      ...props.options,
      onChange: (state, display) => {
        emit('change', { state, display });
      }
    });
  }
});

onUnmounted(() => {
  numpadInstance?.destroy();
});
</script>
```

</details>

<details>
<summary><strong>🅰️ Angular</strong></summary>

```typescript
import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { createStyledNumpad, StyledNumpadOptions } from '@citolab/numflux';
// No CSS import needed! ✨

@Component({
  selector: 'app-numpad',
  template: '<div></div>'
})
export class NumpadComponent implements AfterViewInit, OnDestroy {
  @Input() options: StyledNumpadOptions = {};
  @Output() change = new EventEmitter();

  private numpadInstance: any;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.numpadInstance = createStyledNumpad(
      this.elementRef.nativeElement.firstChild,
      {
        theme: 'light',
        ...this.options,
        onChange: (state, display) => {
          this.change.emit({ state, display });
        }
      }
    );
  }

  ngOnDestroy() {
    this.numpadInstance?.destroy();
  }
}
```

</details>

<details>
<summary><strong>🔥 Svelte</strong></summary>

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { createStyledNumpad } from '@citolab/numflux';
  // No CSS import needed! ✨

  export let options = {};
  export let theme = 'light';

  let container;
  let numpadInstance;

  onMount(() => {
    if (container) {
      numpadInstance = createStyledNumpad(container, {
        theme,
        ...options,
        onChange: (state, display) => {
          // Handle changes
          console.log('Value:', display.numeric);
        }
      });
    }
  });

  onDestroy(() => {
    numpadInstance?.destroy();
  });
</script>

<div bind:this={container}></div>
```

</details>

<details>
<summary><strong>🎨 Styling Framework Integration</strong></summary>

**Tailwind CSS:**
```typescript
import { createNumpadDom, withClassNames } from "@citolab/numflux";

function createTailwindNumpad(container, options) {
  const numpad = createNumpadDom(container, options);

  return withClassNames(numpad, {
    container: "bg-white rounded-lg shadow-md p-4",
    display: "text-2xl font-mono text-right bg-gray-100 p-3 rounded mb-4",
    keypad: "grid grid-cols-4 gap-2",
    button: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition",
    buttonAccent: "bg-green-500 hover:bg-green-600",
    buttonGhost: "bg-gray-300 hover:bg-gray-400 text-black"
  });
}
```

**Styled Components:**
```typescript
import { createNumpadDom, withTheme } from "@citolab/numflux";

function createStyledNumpad(container, theme, options) {
  const numpad = createNumpadDom(container, options);

  return withTheme(numpad, {
    cssVars: {
      "--nf-surface": theme.colors.background,
      "--nf-text": theme.colors.text,
      "--nf-accent": theme.colors.primary
    }
  });
}
```
</details>

## 👨‍🍳 Cookbook

> **📚 [View Full Cookbook](./COOKBOOK.md)**

## 🛠️ Advanced Usage

<details>
<summary><strong>🧩 Composable Utilities</strong></summary>

Create custom integrations using composable utilities:

```typescript
import {
  createNumpadDom,
  withClassNames,
  withTheme,
  withEventHandlers,
  withAttributes,
  compose
} from "@citolab/numflux";

// Compose multiple enhancements
const createCustomNumpad = compose(
  (numpad) => withTheme(numpad, {
    cssVars: { "--nf-accent": "#ff4757" }
  }),
  (numpad) => withClassNames(numpad, {
    container: "my-numpad",
    button: "my-button"
  }),
  (numpad) => withEventHandlers(numpad, {
    onFocus: () => console.log("Focused!"),
    onBlur: () => console.log("Blurred!")
  }),
  (numpad) => withAttributes(numpad, {
    container: { "data-testid": "numpad" }
  })
);

const numpad = createCustomNumpad(
  createNumpadDom(container, options)
);
```

**Available Utilities:**
- `withClassNames()` - Apply CSS classes
- `withTheme()` - Apply theme variables
- `withEventHandlers()` - Add event listeners
- `withAttributes()` - Set HTML attributes
- `compose()` - Combine multiple utilities

</details>

<details>
<summary><strong>🎯 Custom Validation</strong></summary>

```typescript
import { mountNumpad } from "@citolab/numflux";

const numpad = mountNumpad(container, {
  allowDecimal: 2,
  min: 0,
  max: 1000000,
  keyValidator: (key, currentValue, config) => {
    // Custom validation logic
    if (key === "5" && currentValue.includes("5")) {
      return false; // Don't allow multiple 5s
    }
    return true;
  },
  displayRule: (value, config) => {
    // Custom formatting
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }
});
```

</details>

<details>
<summary><summary><strong>🔄 Real-time Sync</strong></summary>

```typescript
const numpad = mountNumpad(container, {
  sync: true, // Enable real-time onChange
  onChange: (state, display) => {
    // Called on every keystroke
    updateUI(display.formatted);
  },
  onSubmit: (state, display) => {
    // Called only on submit
    submitForm(display.numeric);
  }
});
```

</details>

## 📚 API Reference

<details>
<summary><strong>📦 Core Exports</strong></summary>

```typescript
// Pure state management
import {
  createNumpadState,
  reduceNumpad,
  formatDisplayValue,
  mapKeyToAction,
  normalizeConfig
} from "@citolab/numflux";

// DOM implementations
import {
  createNumpadDom,    // Framework-agnostic DOM (unstyled)
  createStyledNumpad, // Styled with automatic CSS injection (zero imports!)
  mountNumpad         // Styled with CSS modules (advanced)
} from "@citolab/numflux";

// Composable utilities
import {
  withClassNames,
  withTheme,
  withEventHandlers,
  withAttributes,
  compose
} from "@citolab/numflux";

// Icon integration helpers
import {
  createSvgIconTheme,
  createCssIconTheme,
  createCustomIconTheme,
  extractSvgString
} from "@citolab/numflux";

// Validation utilities
import {
  toNumber,
  isValidValue,
  sanitizeValue,
  getDecimalPlaces
} from "@citolab/numflux";
```

</details>

<details>
<summary><strong>⚙️ Configuration Options</strong></summary>

```typescript
interface NumpadConfig {
  // Input validation
  allowDecimal?: boolean | number;  // true, false, or max decimal places
  allowNegative?: boolean;          // Allow negative numbers
  maxDigits?: number | null;        // Maximum total digits
  min?: number | null;              // Minimum value
  max?: number | null;              // Maximum value

  // Formatting
  decimalSeparator?: "." | ",";     // Decimal separator character

  // Behavior
  sync?: boolean;                   // Real-time onChange vs submit-only

  // Accessibility
  a11y?: {
    label?: string;                 // Component accessible name
    description?: string;           // Component description
    announceChanges?: boolean;      // Screen reader announcements (default: true)
  };

  // Custom validation & formatting
  keyValidator?: (key: string, value: string, config: NumpadConfig) => boolean;
  displayRule?: (value: string, config: NumpadConfig) => string;
}
```

</details>

<details>
<summary><strong>🎬 Actions & State</strong></summary>

```typescript
// Available actions
type NumpadAction =
  | { type: "digit"; digit: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }
  | { type: "decimal" }
  | { type: "delete" }
  | { type: "clear" }
  | { type: "submit" }
  | { type: "toggle-sign" }
  | { type: "set"; value: string };

// State structure
interface NumpadState {
  value: string;        // Raw string value
  cursorPos: number;    // Cursor position
  submitted: boolean;   // Whether value was submitted
}

// Display value
interface DisplayValue {
  raw: string;          // Raw string value
  formatted: string;    // Formatted for display
  numeric: number | null; // Parsed number or null if invalid
}
```

</details>

## 🤝 Contributing

<details>
<summary><strong>🚀 Development Setup</strong></summary>

```bash
# Clone and install
git clone https://github.com/your-org/numflux.git
cd numflux
npm install

# Development commands
npm run dev          # Start development mode
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Type checking
npm run lint         # Lint code
npm run build        # Build for production
npm run storybook    # Start Storybook playground
```

</details>

<details>
<summary><strong>🧪 Testing</strong></summary>

- **Unit Tests**: Comprehensive test suite with 100+ tests
- **Integration Tests**: Real DOM testing with jsdom
- **Type Tests**: Full TypeScript coverage
- **Visual Tests**: Storybook for component testing

```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
npm run test:ui            # Open Vitest UI
```

</details>

<details>
<summary><strong>📝 Project Structure</strong></summary>

```
src/
├── core/                  # Pure logic & DOM implementation
│   ├── numpad.ts         # State management
│   └── numpad-dom.ts     # Framework-agnostic DOM
├── integrations/         # Framework & styling integrations
│   ├── vanilla.ts        # CSS Modules integration

│   ├── icons.ts          # Icon integration helpers
│   └── utils.ts          # Composable utilities
├── utils/                # Validation & utility functions
├── types/                # TypeScript definitions
└── styles/               # CSS modules & themes
```

</details>

---

---

## 🎯 Which Integration Should I Use?

| Integration | Best For | Bundle Size | CSS Import Required |
|-------------|----------|-------------|-------------------|
| `createStyledNumpad` | **Most projects** - Drop-in styled numpad | ~12kb gzipped | ❌ No (auto-injected) |
| `mountNumpad` | Advanced CSS Modules features, label customization | ~8kb gzipped | ✅ Yes (CSS Modules) |
| `createNumpadDom` | Custom styling, framework integration | ~6kb gzipped | ✅ Yes (your styles) |

**📋 Recommendation:** Start with `createStyledNumpad` for the best developer experience!

---

**Bundle Size:** 6-12kb gzipped (depending on integration)
**Dependencies:** Zero
**Browser Support:** Modern browsers (ES2019+)
