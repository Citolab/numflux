import type { Meta, StoryObj } from "@storybook/html";
import { action } from "@storybook/addon-actions";

import { mountNumpad, type CssModulesNumpadOptions } from "@/integrations/css-modules";
import type { NumpadState, DisplayValue } from "@/types/numpad";

import "@/styles/numpad.module.css";

type StoryArgs = CssModulesNumpadOptions;
type ActionLogger = (data: { state: NumpadState; display: DisplayValue }) => void;

const createActionLogger = (name: string): ActionLogger => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const actionFn = action(name);
  return (data: { state: NumpadState; display: DisplayValue }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    actionFn(data);
  };
};

const logChange = createActionLogger("change");
const logSubmit = createActionLogger("submit");

const meta: Meta<StoryArgs> = {
  title: "Numpad/Mask-Based Input",
  args: {
    initialValue: "",
    sync: false
  },
  argTypes: {
    mask: {
      control: { type: "text" },
      description: "Mask format string (e.g., '___', '__/___', '__,__')"
    },
    locale: {
      control: { type: "text" },
      description: "Locale for decimal separator (e.g., 'en-US', 'nl-NL')"
    },
    theme: {
      control: { type: "select" },
      options: [undefined, "light", "dark"]
    }
  },
  render: (args: StoryArgs): HTMLElement => {
    const container = document.createElement("div");
    container.style.maxWidth = "320px";

    const target = document.createElement("div");
    container.appendChild(target);

    mountNumpad(target, {
      ...args,
      onChange: (state: NumpadState, display: DisplayValue) => logChange({ state, display }),
      onSubmit: (state: NumpadState, display: DisplayValue) => logSubmit({ state, display })
    });

    return container;
  }
};

export default meta;

type Story = StoryObj<StoryArgs>;

// ============================================================================
// Simple Masks
// ============================================================================

export const Simple3Digit: Story = {
  args: {
    mask: "___"
  }
};

export const SimpleWithPrefix: Story = {
  args: {
    mask: "€ ___"
  }
};

export const SimpleWithSuffix: Story = {
  args: {
    mask: "________ cm"
  }
};

export const LongSuffix: Story = {
  args: {
    mask: "___ stukken taart"
  }
};

// ============================================================================
// Fraction Masks
// ============================================================================

export const BasicFraction: Story = {
  args: {
    mask: "__/___"
  }
};

export const FractionWithPrefix: Story = {
  args: {
    mask: "€ ____/__"
  }
};

export const SmallFraction: Story = {
  args: {
    mask: "_/__"
  }
};

// ============================================================================
// Decimal Masks
// ============================================================================

export const BasicDecimal: Story = {
  args: {
    mask: "__,__"
  }
};

export const DecimalWithPrefixAndSuffix: Story = {
  args: {
    mask: "€ ___,__ EUR"
  }
};

// ============================================================================
// Currency Examples
// ============================================================================

export const EuroCurrency: Story = {
  args: {
    mask: "€ ____,__",
    theme: "light"
  }
};

export const DollarCurrency: Story = {
  args: {
    mask: "$ ____,__"
  }
};

export const PoundCurrency: Story = {
  args: {
    mask: "£ ___,__"
  }
};

// ============================================================================
// Measurement Examples
// ============================================================================

export const WeightInKg: Story = {
  args: {
    mask: "___,__ kg"
  }
};

export const HeightInCm: Story = {
  args: {
    mask: "___,__ cm"
  }
};

export const TemperatureInC: Story = {
  args: {
    mask: "__ °C"
  }
};

// ============================================================================
// Percentage Examples
// ============================================================================

export const PercentageWithDecimal: Story = {
  args: {
    mask: "__,__ %"
  }
};

export const SimplePercentage: Story = {
  args: {
    mask: "___ %"
  }
};

// ============================================================================
// Date-like Examples
// ============================================================================

export const DateFormat: Story = {
  args: {
    mask: "__/__/____"
  }
};

export const TimeFormat: Story = {
  args: {
    mask: "__:__"
  }
};

// ============================================================================
// Complex Examples
// ============================================================================

export const CurrencyWithThousandsAndFraction: Story = {
  args: {
    mask: "€ __.___,__/__"
  }
};

export const ComplexCurrencyWithEightDigits: Story = {
  args: {
    mask: "€ __.___.___,__"
  }
};

export const PriceWithTax: Story = {
  args: {
    mask: "€ ____,__ (incl. BTW)"
  }
};

// ============================================================================
// Locale Examples
// ============================================================================

export const LocaleNL: Story = {
  args: {
    mask: "__,__",
    locale: "nl-NL"
  }
};

export const LocaleUS: Story = {
  args: {
    mask: "__,__",
    locale: "en-US"
  }
};

export const LocaleDE: Story = {
  args: {
    mask: "__,__",
    locale: "de-DE"
  }
};

// ============================================================================
// Edge Cases
// ============================================================================

export const SingleDigit: Story = {
  args: {
    mask: "_"
  }
};

export const TwoDigits: Story = {
  args: {
    mask: "__"
  }
};

export const ManyDigits: Story = {
  args: {
    mask: "____________"
  }
};

export const OnlyPrefix: Story = {
  args: {
    mask: "Value: ___"
  }
};

export const OnlySuffix: Story = {
  args: {
    mask: "___ units"
  }
};
