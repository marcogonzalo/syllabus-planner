import { describe, it, expect } from "vitest";
import { resolveContentDisplay } from "./content";

describe("resolveContentDisplay", () => {
  it("returns title and body when body exists", () => {
    const result = resolveContentDisplay({
      title: "Lesson Title",
      body: "Some body text",
    });
    expect(result).toEqual({ title: "Lesson Title", body: "Some body text" });
  });

  it("splits on newline when no body", () => {
    const result = resolveContentDisplay({
      title: "Title\n- Detail one\n- Detail two",
    });
    expect(result.title).toBe("Title");
    expect(result.body).toBe("- Detail one\n- Detail two");
  });

  it("splits on inline bullets when no body", () => {
    const result = resolveContentDisplay({
      title: "Lesson - Point one - Point two",
    });
    expect(result.title).toBe("Lesson");
    expect(result.body).toContain("Point one");
    expect(result.body).toContain("Point two");
  });

  it("returns title only when no body and no split", () => {
    const result = resolveContentDisplay({ title: "Simple title" });
    expect(result).toEqual({ title: "Simple title", body: null });
  });
});
