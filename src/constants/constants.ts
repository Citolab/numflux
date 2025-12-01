import { ButtonActionType, ButtonVariant } from "@/types";

export const BUTTON_VARIANTS: Record<ButtonActionType, ButtonVariant> = {
  submit: "accent",
  delete: "ghost",
  clear: "ghost",
  decimal: "ghost",
  "toggle-sign": "ghost",
  digit: "default"
};

export const LABEL_KEYS = ["clear", "delete", "submit", "decimal", "toggleSign"] as const;
