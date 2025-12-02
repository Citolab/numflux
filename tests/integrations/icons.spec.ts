import { describe, expect, it, vi } from "vitest";
import {
  createCssIconTheme,
  createCustomIconTheme,
  createImageIconTheme,
  createSvgIconTheme,
  extractSvgString
} from "@/utils/icon.utils";

describe("createSvgIconTheme", () => {
  it("normalizes string and object icon inputs with alt fallbacks", () => {
    const theme = createSvgIconTheme({
      delete: "<svg>del</svg>",
      submit: { svg: "<svg>check</svg>" },
      clear: { svg: "<svg>x</svg>", alt: "Reset" }
    });

    expect(theme.delete).toEqual({ svg: "<svg>del</svg>", alt: "Delete" });
    expect(theme.submit).toEqual({ svg: "<svg>check</svg>", alt: "Submit" });
    expect(theme.clear).toEqual({ svg: "<svg>x</svg>", alt: "Reset" });
  });
});

describe("createCssIconTheme", () => {
  it("creates elements with provided class names and default alt", () => {
    const theme = createCssIconTheme({
      delete: "fa fa-times",
      submit: "fa fa-check"
    });

    expect(theme.delete.alt).toBe("Delete");
    expect(theme.delete.element.tagName.toLowerCase()).toBe("i");
    expect(theme.delete.element.className).toBe("fa fa-times");

    expect(theme.submit.alt).toBe("Submit");
    expect(theme.submit.element.className).toBe("fa fa-check");
  });
});

describe("createImageIconTheme", () => {
  it("builds image urls with base path and defaults alt", () => {
    const theme = createImageIconTheme("/icons", {
      delete: "del.svg",
      submit: "check.svg"
    });

    expect(theme.delete).toEqual({ image: "/icons/del.svg", alt: "Delete" });
    expect(theme.submit).toEqual({ image: "/icons/check.svg", alt: "Submit" });
  });
});

describe("createCustomIconTheme", () => {
  it("stores render callbacks and alt labels", () => {
    const renderDelete = vi.fn();
    const theme = createCustomIconTheme({ delete: renderDelete });
    const container = document.createElement("div");

    theme.delete.render(container);

    expect(renderDelete).toHaveBeenCalledWith(container);
    expect(theme.delete.alt).toBe("Delete");
  });
});

describe("extractSvgString", () => {
  it("returns string inputs unchanged", () => {
    expect(extractSvgString("<svg />")).toBe("<svg />");
  });

  it("returns svg property when present", () => {
    expect(extractSvgString({ svg: "<svg>icon</svg>" })).toBe("<svg>icon</svg>");
  });

  it("warns and returns empty string for components with render functions", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = extractSvgString({ render: () => null });
    expect(result).toBe("");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("stringifies unknown objects and falls back to empty for other types", () => {
    expect(extractSvgString({ toString: () => "icon-object" })).toBe("icon-object");
    expect(extractSvgString(123 as unknown)).toBe("");
  });
});
