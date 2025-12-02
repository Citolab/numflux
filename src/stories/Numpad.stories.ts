import type { Meta, StoryObj } from "@storybook/html";
import { action } from "@storybook/addon-actions";

import { mountNumpad, type CssModulesNumpadOptions } from "@/integrations/css-modules";
import type { NumpadState, DisplayValue } from "@/types/numpad";

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
  title: "Numpad/Default",
  args: {
    initialValue: "",
    allowDecimal: true,
    allowNegative: true,
    maxDigits: null,
    minDigits: null,
    decimalSeparator: ".",
    minValue: null,
    maxValue: null,
    sync: false
  },
  argTypes: {
    maxDigits: { control: { type: "number" } },
    minDigits: { control: { type: "number" } },
    decimalSeparator: { control: { type: "text" } },
    minValue: { control: { type: "number" } },
    maxValue: { control: { type: "number" } },
    sync: { control: { type: "boolean" } },
    allowDecimal: {
      control: { type: "select" },
      options: [false, true, 1, 2, 3, 4]
    },
    theme: {
      control: { type: "select" },
      options: [undefined, "dark", "light"]
    },
    labelTheme: {
      control: { type: "select" },
      options: [undefined, "ascii", "unicode", "symbols", "minimal"]
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

export const Default: Story = {};

export const WithInitialValue: Story = {
  args: {
    initialValue: "123.4"
  }
};

export const IntegerOnly: Story = {
  args: {
    allowDecimal: false,
    allowNegative: false,
    maxDigits: 6
  }
};

export const TwoDecimalPlaces: Story = {
  args: {
    allowDecimal: 2,
    allowNegative: true,
    initialValue: "99.99"
  }
};

export const WithValidation: Story = {
  args: {
    minValue: 0,
    maxValue: 100,
    allowDecimal: true,
    allowNegative: false,
    initialValue: "50"
  }
};

export const SyncMode: Story = {
  args: {
    sync: true,
    allowDecimal: 2,
    allowNegative: true,
    initialValue: "0"
  }
};

export const CurrencyExample: Story = {
  args: {
    allowDecimal: 2,
    allowNegative: false,
    minValue: 0,
    maxValue: 9999.99,
    initialValue: "123.45"
  }
};

export const PercentageExample: Story = {
  args: {
    allowDecimal: 2,
    allowNegative: false,
    minValue: 0,
    maxValue: 100,
    initialValue: "85.5"
  }
};

export const LightTheme: Story = {
  args: {
    theme: "light",
    initialValue: "123.45"
  }
};

export const DarkTheme: Story = {
  args: {
    theme: "dark",
    initialValue: "999"
  }
};

export const AsciiLabels: Story = {
  args: {
    labelTheme: "ascii",
    initialValue: "123"
  }
};

export const UnicodeLabels: Story = {
  args: {
    labelTheme: "unicode",
    initialValue: "456"
  }
};

export const SymbolLabels: Story = {
  args: {
    labelTheme: "symbols",
    initialValue: "789"
  }
};

export const MinimalLabels: Story = {
  args: {
    labelTheme: "minimal",
    initialValue: "999"
  }
};

export const CustomLabels: Story = {
  args: {
    labelTheme: "unicode",
    labels: {
      delete: "Back",
      submit: "Done",
      clear: "Reset",
      toggleSign: "Flip"
    },
    initialValue: "100"
  }
};

export const ValidationErrors: Story = {
  args: {
    minValue: 10,
    maxValue: 50,
    minDigits: 2,
    maxDigits: 4,
    allowDecimal: true,
    allowNegative: true,
    initialValue: "75", // This should trigger maxValue error
    sync: true // Enable sync mode to see validation errors immediately
  }
};

export const DigitConstraints: Story = {
  args: {
    minDigits: 3,
    maxDigits: 6,
    allowDecimal: false,
    allowNegative: false,
    initialValue: "12", // Should show minDigits error
    sync: true
  }
};

export const MinValueValidation: Story = {
  args: {
    minValue: 25,
    maxValue: 100,
    allowDecimal: true,
    allowNegative: true,
    initialValue: "10", // This should trigger minValue error (10 < 25)
    sync: true // Enable sync mode to see validation errors immediately
  }
};

export const NegativeRangeValidation: Story = {
  args: {
    minValue: -50,
    maxValue: -10,
    allowDecimal: true,
    allowNegative: true,
    initialValue: "-75", // This should trigger minValue error (-75 < -50)
    sync: true
  }
};

export const PreciseDecimalValidation: Story = {
  args: {
    minValue: 99.95,
    maxValue: 100.05,
    allowDecimal: 2,
    allowNegative: false,
    initialValue: "99.90", // This should trigger minValue error (99.90 < 99.95)
    sync: true
  }
};
