import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContentTypeIcon, normalizeContentType } from "./ContentTypeIcon";

describe("normalizeContentType", () => {
  it("normalizes theory to lesson", () => {
    expect(normalizeContentType("theory")).toBe("lesson");
  });

  it("normalizes quiz", () => {
    expect(normalizeContentType("quiz")).toBe("quiz");
  });

  it("normalizes exercise variants", () => {
    expect(normalizeContentType("exercise")).toBe("exercise");
    expect(normalizeContentType("practica")).toBe("exercise");
  });

  it("normalizes project variants", () => {
    expect(normalizeContentType("project")).toBe("project");
    expect(normalizeContentType("proyecto")).toBe("project");
  });

  it("returns null for unknown types", () => {
    expect(normalizeContentType("unknown")).toBeNull();
    expect(normalizeContentType(null)).toBeNull();
  });
});

describe("ContentTypeIcon", () => {
  it("renders without crashing for each type", () => {
    const types = ["theory", "quiz", "exercise", "project"];
    for (const type of types) {
      const { unmount } = render(<ContentTypeIcon type={type} />);
      unmount();
    }
  });
});
