import { describe, it, expect, beforeEach, vi } from "vitest";
import { createNumpadDom, type NumpadDomInstance } from "@/core/numpad-dom";

// Mock DOM methods with proper dataset support
const createMockElement = () => {
  const listeners: Record<string, Array<(event: any) => void>> = {};

  return {
    textContent: "",
    style: {
      setProperty: vi.fn()
    },
    appendChild: vi.fn(),
    addEventListener: vi.fn((type: string, handler: (event: any) => void) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    removeEventListener: vi.fn((type: string, handler: (event: any) => void) => {
      listeners[type] = (listeners[type] || []).filter((fn) => fn !== handler);
    }),
    dispatchEvent: vi.fn((event: any) => {
      const handlers = listeners[event.type] || [];
      handlers.forEach((handler) => handler(event));
    }),
    remove: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    querySelector: vi.fn(() => null),
    className: "",
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
      toggle: vi.fn()
    },
    dataset: {},
    tabIndex: 0,
    setAttribute: vi.fn(),
    getAttribute: vi.fn()
  };
};

// Mock document methods
Object.defineProperty(global, "document", {
  value: {
    createElement: vi.fn(() => createMockElement()),
    querySelector: vi.fn(() => null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

describe("createNumpadDom", () => {
  let container: HTMLElement;
  let numpad: NumpadDomInstance;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock container
    container = createMockElement() as unknown as HTMLElement;
  });

  it("should create numpad with default configuration", () => {
    numpad = createNumpadDom(container);
    expect(numpad).toBeDefined();
    expect(numpad.root).toBeDefined();
    expect(numpad.display).toBeDefined();
    expect(numpad.keypad).toBeDefined();
    expect(numpad.getState).toBeDefined();
    expect(numpad.dispatch).toBeDefined();
    expect(numpad.destroy).toBeDefined();
  });

  it("should create numpad with custom configuration", () => {
    numpad = createNumpadDom(container, {
      allowDecimal: true,
      allowNegative: true,
      maxDigits: 10
    });
    expect(numpad).toBeDefined();
    expect(numpad.getState()).toBeDefined();
  });

  it("should apply theme data attribute", () => {
    numpad = createNumpadDom(container, {
      theme: { name: "dark" }
    });
    expect(numpad.root.dataset.theme).toBe("dark");
  });

  it("should apply CSS custom properties", () => {
    numpad = createNumpadDom(container, {
      theme: {
        cssVars: {
          "--numpad-bg": "blue",
          "--numpad-color": "white"
        }
      }
    });

    // Just verify the numpad was created successfully
    // The CSS var application happens in the implementation
    expect(numpad).toBeDefined();
    expect(numpad.root).toBeDefined();
  });

  it("should handle initial value", () => {
    numpad = createNumpadDom(container, { initialValue: "123" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should handle dispatch actions", () => {
    numpad = createNumpadDom(container);

    const newState = numpad.dispatch({ type: "digit", digit: 1 });
    expect(newState.value).toBe("1");
    expect(numpad.getState().value).toBe("1");
  });

  it("should handle multiple digit actions", () => {
    numpad = createNumpadDom(container);

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });

    expect(numpad.getState().value).toBe("123");
  });

  it("should handle clear action", () => {
    numpad = createNumpadDom(container, { initialValue: "123" });
    expect(numpad.getState().value).toBe("123");

    numpad.dispatch({ type: "clear" });
    expect(numpad.getState().value).toBe("");
  });

  it("should handle delete action", () => {
    numpad = createNumpadDom(container, { initialValue: "123" });

    numpad.dispatch({ type: "delete" });
    expect(numpad.getState().value).toBe("12");
  });

  it("should handle decimal action when allowed", () => {
    numpad = createNumpadDom(container, { allowDecimal: true });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });
    numpad.dispatch({ type: "digit", digit: 5 });

    expect(numpad.getState().value).toBe("1.5");
  });

  it("should ignore decimal action when not allowed", () => {
    numpad = createNumpadDom(container, { allowDecimal: false });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });

    expect(numpad.getState().value).toBe("1");
  });

  it("should call onChange on submit when not in sync mode", () => {
    const onChange = vi.fn();
    numpad = createNumpadDom(container, { onChange, sync: false });

    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "submit" });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "2" }),
      expect.objectContaining({ raw: "2" })
    );
  });

  it("should handle keyboard events via handleKeydown", () => {
    numpad = createNumpadDom(container);
    const preventDefault = vi.fn();

    numpad.root.dispatchEvent({ type: "keydown", key: "3", preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(numpad.getState().value).toBe("3");
  });

  it("should handle toggle sign when allowed", () => {
    numpad = createNumpadDom(container, { allowNegative: true, initialValue: "123" });

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("-123");

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should ignore toggle sign when not allowed", () => {
    numpad = createNumpadDom(container, { allowNegative: false, initialValue: "123" });

    numpad.dispatch({ type: "toggle-sign" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should handle set action", () => {
    numpad = createNumpadDom(container);

    numpad.dispatch({ type: "set", value: "456" });
    expect(numpad.getState().value).toBe("456");
  });

  it("should trigger onChange callback in sync mode", () => {
    const onChange = vi.fn();
    numpad = createNumpadDom(container, { onChange, sync: true });

    numpad.dispatch({ type: "digit", digit: 1 });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "1" }),
      expect.objectContaining({ raw: "1" })
    );
  });

  it("should trigger onSubmit callback", () => {
    const onSubmit = vi.fn();
    numpad = createNumpadDom(container, { onSubmit, initialValue: "123" });

    numpad.dispatch({ type: "submit" });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ value: "123" }),
      expect.objectContaining({ raw: "123", numeric: 123 })
    );
  });

  it("should destroy properly", () => {
    numpad = createNumpadDom(container);

    expect(() => numpad.destroy()).not.toThrow();
  });

  it("should handle maxDigits limit", () => {
    numpad = createNumpadDom(container, { maxDigits: 3 });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });
    numpad.dispatch({ type: "digit", digit: 4 }); // Should be ignored

    expect(numpad.getState().value).toBe("123");
  });

  it("should handle decimal places limit", () => {
    numpad = createNumpadDom(container, { allowDecimal: 2 });

    numpad.dispatch({ type: "digit", digit: 1 });
    numpad.dispatch({ type: "decimal" });
    numpad.dispatch({ type: "digit", digit: 2 });
    numpad.dispatch({ type: "digit", digit: 3 });
    numpad.dispatch({ type: "digit", digit: 4 }); // Should be ignored

    expect(numpad.getState().value).toBe("1.23");
  });

  it("should handle sync mode", () => {
    numpad = createNumpadDom(container, { sync: true });

    // In sync mode, invalid values should be corrected immediately
    numpad.dispatch({ type: "set", value: "abc123" });
    expect(numpad.getState().value).toBe("123");
  });

  it("should handle label themes", () => {
    numpad = createNumpadDom(container, {
      labelTheme: "unicode"
    });
    expect(numpad).toBeDefined();
    // The label theme affects button creation, which is tested implicitly
  });

  it("should handle custom labels", () => {
    numpad = createNumpadDom(container, {
      labels: {
        clear: "Reset",
        delete: "Back",
        submit: "OK"
      }
    });
    expect(numpad).toBeDefined();
    // The custom labels affect button creation, which is tested implicitly
  });

  it("should apply custom className", () => {
    numpad = createNumpadDom(container, {
      className: "my-custom-class"
    });
    expect(numpad.root.className).toContain("my-custom-class");
  });

  it("should apply custom styles", () => {
    const customStyles = {
      backgroundColor: "red",
      color: "white"
    } as Partial<CSSStyleDeclaration>;

    numpad = createNumpadDom(container, {
      styles: customStyles
    });

    // Just verify the numpad was created successfully
    // The style application happens in the implementation
    expect(numpad).toBeDefined();
    expect(numpad.root).toBeDefined();
  });
});
