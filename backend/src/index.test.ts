import { describe, expect, it } from "vitest";
import { main } from "./index";

describe("main", () => {
  it("returns a greeting for the backend", () => {
    expect(main()).toBe("Hello, backend!");
  });
});
