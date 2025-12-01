import { NumpadAction } from "./numpad";

export type ButtonActionType = Exclude<NumpadAction["type"], "set">;
export type ButtonVariant = "accent" | "ghost" | "default";
