import { describe, expect, it } from "vitest";
import { renderGreeting } from "./index.js";

describe("renderGreeting", () => {
  it("renders a greeting for the given name", () => {
    expect(renderGreeting("frontend")).toBe("Hello, frontend!");
  });
});
