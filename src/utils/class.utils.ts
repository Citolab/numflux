export type ClassModule = Record<string, string>;

export function moduleClassNames(
  styles: ClassModule,
  ...keys: Array<string | null | undefined | false>
): string {
  const resolved: string[] = [];

  for (const key of keys) {
    if (!key) continue;
    const value = styles[key];
    if (typeof value === "string" && value.length > 0) {
      resolved.push(value);
    }
  }

  return resolved.join(" ");
}

export function applyModuleClasses(
  element: Pick<HTMLElement, "className">,
  styles: ClassModule,
  ...keys: Array<string | null | undefined | false>
): void {
  element.className = moduleClassNames(styles, ...keys);
}
