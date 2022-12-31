import { MathItem } from "@/configs";

export interface Scene {
  id: string;
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
