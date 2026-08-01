import { fileURLToPath } from "node:url";
import { createGreeting } from "@repo/shared";

export const main = (): string => createGreeting("backend").message;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(main());
}
