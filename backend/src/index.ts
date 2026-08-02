import { fileURLToPath } from "node:url";
import { createGreeting } from "@repo/shared";

export function main(): string {
  return createGreeting("backend").message;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(main());
}
