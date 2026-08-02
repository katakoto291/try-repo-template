// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Greeting } from "./Greeting";

afterEach(() => {
  cleanup();
});

describe("Greeting", () => {
  it("renders a greeting for the given name", () => {
    render(<Greeting name="world" />);

    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });
});
