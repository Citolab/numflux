import { describe, expect, it, vi } from "vitest";
import { createLabelElement, getDefaultLabel } from "@/utils/label.utils";

describe("getDefaultLabel", () => {
  it("returns decimal separator when provided", () => {
    expect(getDefaultLabel("decimal", ",")).toBe(",");
  });

  it("falls back to predefined labels or empty string", () => {
    expect(getDefaultLabel("clear")).toBe("C");
    expect(getDefaultLabel("delete")).toBe("←");
    expect(getDefaultLabel("submit")).toBe("OK");
    expect(getDefaultLabel("toggleSign")).toBe("+/-");
    expect(getDefaultLabel("unknown")).toBe("");
  });
});

describe("createLabelElement", () => {
  it("returns text node for plain strings", () => {
    const node = createLabelElement("OK");
    expect(node).toBeInstanceOf(Text);
    expect(node.textContent).toBe("OK");
  });

  it("uses render callback with class merging and alt forwarding", () => {
    const render = vi.fn((container: HTMLElement, alt?: string) => {
      container.textContent = alt || "missing";
    });
    const element = createLabelElement({ render, className: "extra" }, "Alt text");
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toContain("numpad-icon");
    expect(element.className).toContain("extra");
    expect(element.textContent).toBe("Alt text");
    expect(render).toHaveBeenCalledWith(element, "Alt text");
  });

  it("falls back to text when render throws", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = createLabelElement({ render: () => { throw new Error("boom"); } }, "Fail");
    expect(element.textContent).toBe("Fail");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("clones provided elements and appends className", () => {
    const icon = document.createElement("i");
    icon.className = "base";
    const result = createLabelElement({ element: icon, className: "extra" });

    expect(result).toBeInstanceOf(HTMLElement);
    expect(result).not.toBe(icon);
    expect(result.className).toContain("base");
    expect(result.className).toContain("extra");
  });

  it("builds elements from svg strings", () => {
    const element = createLabelElement(
      { svg: "<svg>icon</svg>", alt: "Icon Alt", className: "svg-class" },
      "fallback"
    );

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toContain("numpad-icon");
    expect(element.className).toContain("svg-class");
    expect(element.innerHTML).toBe("<svg>icon</svg>");
    expect(element.getAttribute("aria-label")).toBe("Icon Alt");
    expect(element.getAttribute("role")).toBe("img");
  });

  it("creates img elements with sizing", () => {
    const element = createLabelElement(
      { image: "/icons/x.svg", alt: "Delete", className: "img" },
      "fallback"
    );

    expect(element).toBeInstanceOf(HTMLImageElement);
    expect((element as HTMLImageElement).src).toContain("/icons/x.svg");
    expect((element as HTMLImageElement).alt).toBe("Delete");
    expect(element.className).toContain("numpad-icon");
    expect(element.className).toContain("img");
    expect((element as HTMLImageElement).style.width).toBe("1em");
    expect((element as HTMLImageElement).style.height).toBe("1em");
    expect((element as HTMLImageElement).style.display).toBe("inline-block");
  });

  it("returns text node when text field provided", () => {
    const node = createLabelElement({ text: "TXT" });
    expect(node).toBeInstanceOf(Text);
    expect(node.textContent).toBe("TXT");
  });

  it("uses alt fallback when config is unsupported", () => {
    const node = createLabelElement(123 as unknown, "Alt");
    expect(node).toBeInstanceOf(Text);
    expect(node.textContent).toBe("Alt");
  });
});
