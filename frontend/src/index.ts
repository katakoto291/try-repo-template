import { fileURLToPath } from "node:url";
import { createGreeting } from "@repo/shared";

export const renderGreeting = (name: string): string =>
  createGreeting(name).message;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(renderGreeting("frontend"));
}
