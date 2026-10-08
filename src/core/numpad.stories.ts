import type { Meta, StoryObj } from "@storybook/html";
import { action } from "@storybook/addon-actions";
import { expect, within } from "@storybook/test";

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
  title: "Numpad",
  args: {
    initialValue: "",
    allowDecimal: true,
    allowNegative: true,
    maxDigits: null,
    decimalSeparator: ".",
    minValue: null,
    maxValue: null,
    sync: false
  },
  argTypes: {
    maxDigits: { control: { type: "number" } },
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
      options: [undefined, "light", "dark"]
    },
    labelTheme: {
      control: { type: "select" },
      options: [undefined, "ascii", "unicode", "symbols", "minimal"]
    },
    mask: {
      control: { type: "text" },
      description: "Mask format string (e.g., '___', '__/___', '__,__')"
    },
    locale: {
      control: { type: "text" },
      description: "Locale for decimal separator (e.g., 'en-US', 'nl-NL')"
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
    mask: "€ ____,__",
    initialValue: ""
  }
};

export const PercentageExample: Story = {
  args: {
    mask: "__,__ %",
    initialValue: ""
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
    initialValue: "456.78"
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

export const HiddenSubmit: Story = {
  args: {
    hideSubmit: true,
    initialValue: "42"
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("gridcell");
    const actions = buttons.map((button) => button.dataset.action);

    // Submit is gone, everything else is still there: 10 digits + delete, clear, sign, decimal
    await expect(actions).not.toContain("submit");
    await expect(buttons).toHaveLength(14);

    // The zero key still spans two columns
    const zero = buttons.find((button) => button.dataset.digit === "0");
    await expect(zero && getComputedStyle(zero).gridColumnStart).toBe("span 2");
  }
};
