import { describe, it, expect, beforeEach, vi } from "vitest";

import { mountNumpad, type CssModulesNumpadInstance } from "@/integrations/css-modules";

vi.mock("@/styles/numpad.module.css", () => ({
  default: {
    container: "container-class",
    display: "display-class",
    keypad: "keypad-class",
    button: "btn",
    buttonAccent: "btn-accent",
    buttonGhost: "btn-ghost"
  }
}));

// Mock DOM methods with proper dataset support
const createMockElement = (tagName = "div") => {
  let classSet = new Set<string>();
  const children: any[] = [];

  const element: any = {
    tagName: tagName.toUpperCase(),
    textContent: "",
    style: {},
    dataset: {},
    tabIndex: 0,
    get className() {
      return Array.from(classSet).join(" ");
    },
    set className(value: string) {
      classSet = new Set(value.split(" ").filter(Boolean));
    },
    classList: {
      add: (...tokens: string[]) => {
        tokens.forEach((token) => classSet.add(token));
      },
      remove: (...tokens: string[]) => {
        tokens.forEach((token) => classSet.delete(token));
      },
      contains: (token: string) => classSet.has(token),
      toggle: (token: string) => {
        if (classSet.has(token)) classSet.delete(token);
        else classSet.add(token);
      }
    },
    appendChild: (child: any) => {
      children.push(child);
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    remove: vi.fn(),
    querySelectorAll: (selector: string) => {
      if (selector === "button") {
        return children.filter((child) => child.tagName === "BUTTON");
      }
      return [];
    },
    querySelector: (selector: string) => {
      const [first] = element.querySelectorAll(selector) as any[];
      return first ?? null;
    },
    setAttribute: vi.fn()
  };

  return element;
};

// Mock document methods
Object.defineProperty(global, "document", {
  value: {
    createElement: vi.fn((tag?: string) => createMockElement(tag)),
    querySelector: vi.fn(() => null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

describe("mountNumpad", () => {
  let container: HTMLElement;
  let numpad: CssModulesNumpadInstance;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock container
    container = createMockElement() as unknown as HTMLElement;
  });

  it("should create numpad with default configuration", () => {
    numpad = mountNumpad(container);
    expect(numpad).toBeDefined();
    expect(numpad.root).toBeDefined();
    expect(numpad.getState).toBeDefined();
    expect(numpad.dispatch).toBeDefined();
    expect(numpad.destroy).toBeDefined();
  });

  it("should create numpad with custom configuration", () => {
    numpad = mountNumpad(container, {
      allowDecimal: true,
      allowNegative: true,
      maxDigits: 10
    });
    expect(numpad).toBeDefined();
    // Configuration is internal to the implementation
    expect(numpad.getState()).toBeDefined();
  });

  it("should handle initial value", () => {
    numpad = mountNumpad(container, { initialValue: "123" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should handle dispatch actions", () => {
    numpad = mountNumpad(container);

    const newState = numpad.dispatch({ type: "digit", digit: 1 });
    expect(newState.value).toBe("1");
    expect(numpad.getState().value).toBe("1");
  });

  it("should handle multiple digit actions", () => {
    numpad = mountNumpad(container);

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });

    expect(numpad.getState().value).toBe("123");
  });

  it("should handle clear action", () => {
    numpad = mountNumpad(container, { initialValue: "123" });
    expect(numpad.getState().value).toBe("123");

    numpad.dispatch({ type: "clear" });
    expect(numpad.getState().value).toBe("");
  });

  it("should handle delete action", () => {
    numpad = mountNumpad(container, { initialValue: "123" });

    numpad.dispatch({ type: "delete" });
    expect(numpad.getState().value).toBe("12");
  });

  it("should handle decimal action when allowed", () => {
    numpad = mountNumpad(container, { allowDecimal: true });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });
    numpad.dispatch({ type: "digit", digit: 5 });

    expect(numpad.getState().value).toBe("1.5");
  });

  it("should ignore decimal action when not allowed", () => {
    numpad = mountNumpad(container, { allowDecimal: false });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });

    expect(numpad.getState().value).toBe("1");
  });

  it("should handle toggle sign when allowed", () => {
    numpad = mountNumpad(container, { allowNegative: true, initialValue: "123" });

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("-123");

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should ignore toggle sign when not allowed", () => {
    numpad = mountNumpad(container, { allowNegative: false, initialValue: "123" });

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should handle set action", () => {
    numpad = mountNumpad(container);

    numpad.dispatch({ type: "set", value: "456" });
    expect(numpad.getState().value).toBe("456");
  });

  it("should trigger onChange callback in sync mode", () => {
    const onChange = vi.fn();
    numpad = mountNumpad(container, { onChange, sync: true });

    numpad.dispatch({ type: "digit", digit: 1 });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "1" }),
      expect.objectContaining({ raw: "1" })
    );
  });

  it("should trigger onSubmit callback", () => {
    const onSubmit = vi.fn();
    numpad = mountNumpad(container, { onSubmit, initialValue: "123" });

    numpad.dispatch({ type: "submit" });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ value: "123" }),
      expect.objectContaining({ raw: "123", numeric: 123 })
    );
  });

  it("should destroy properly", () => {
    numpad = mountNumpad(container);

    expect(() => numpad.destroy()).not.toThrow();
  });

  it("should handle maxDigits limit", () => {
    numpad = mountNumpad(container, { maxDigits: 3 });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });
    numpad.dispatch({ type: "digit", digit: 4 }); // Should be ignored

    expect(numpad.getState().value).toBe("123");
  });

  it("should handle decimal places limit", () => {
    numpad = mountNumpad(container, { allowDecimal: 2 });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });
    numpad.dispatch({ type: "digit", digit: 4 }); // Should be ignored

    expect(numpad.getState().value).toBe("1.23");
  });

  it("should handle sync mode", () => {
    numpad = mountNumpad(container, { sync: true });

    // In sync mode, invalid values should be corrected immediately
    numpad.dispatch({ type: "set", value: "abc123" });
    expect(numpad.getState().value).toBe("123");
  });

  it("applies theme and custom class names", () => {
    numpad = mountNumpad(container, { theme: "dark", className: "custom" });

    expect(numpad.root.dataset.theme).toBe("dark");
    expect(numpad.root.className).toContain("container-class");
    expect(numpad.root.classList.contains("custom")).toBe(true);
    expect(numpad.display.className).toBe("display-class");
    expect(numpad.keypad.className).toBe("keypad-class");
  });

  it("applies variant-specific button classes", () => {
    numpad = mountNumpad(container);

    const buttons = Array.from(numpad.keypad.querySelectorAll("button"));
    const submit = buttons.find((btn) => btn.dataset.action === "submit");
    const del = buttons.find((btn) => btn.dataset.action === "delete");
    const digit = buttons.find((btn) => btn.dataset.action === "digit");

    expect(submit?.className).toBe("btn btn-accent");
    expect(del?.className).toBe("btn btn-ghost");
    expect(digit?.className).toBe("btn");
  });
});
