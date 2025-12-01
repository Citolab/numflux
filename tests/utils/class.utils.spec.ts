import { describe, expect, it } from "vitest";
import { applyModuleClasses, moduleClassNames } from "@/utils/class.utils";

const styles = {
  root: "root_class",
  active: "active_class",
  empty: ""
};

describe("moduleClassNames", () => {
  it("maps keys to class values and skips falsy or missing entries", () => {
    const result = moduleClassNames(styles, "root", null, "active", "missing", false, undefined);
    expect(result).toBe("root_class active_class");
  });

  it("returns empty string when nothing resolves", () => {
    expect(moduleClassNames(styles, "missing", null, false, undefined, "empty")).toBe("");
  });
});

describe("applyModuleClasses", () => {
  it("assigns className using moduleClassNames", () => {
    const element = { className: "" };
    applyModuleClasses(element as unknown as HTMLElement, styles, "root", "active");
    expect(element.className).toBe("root_class active_class");
  });
});
