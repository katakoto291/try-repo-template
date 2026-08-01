// @vitest-environment jsdom

import { Greeting } from "@frontend/components/Greeting";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  cleanup();
});

describe("Greeting", () => {
  it("renders a greeting for the given name", () => {
    render(<Greeting name="world" />);

    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });
});
