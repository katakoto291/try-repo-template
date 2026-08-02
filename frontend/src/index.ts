import { fileURLToPath } from "node:url";
import { createGreeting } from "@repo/shared";

export function renderGreeting(name: string): string {
  return createGreeting(name).message;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(renderGreeting("frontend"));
}
