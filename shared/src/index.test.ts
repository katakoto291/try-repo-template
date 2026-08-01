import { describe, expect, it } from "vitest";
import { createGreeting } from "./index.js";

describe("createGreeting", () => {
  it("greets by name", () => {
    expect(createGreeting("World")).toEqual({ message: "Hello, World!" });
  });
});
