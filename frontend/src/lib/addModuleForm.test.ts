import { describe, expect, it } from "vitest";

import { parseAddModuleForm } from "@/lib/addModuleForm";

describe("parseAddModuleForm", () => {
  it("accepts title and half-day duration", () => {
    expect(parseAddModuleForm("Warmup", "0.5")).toEqual({
      values: { title: "Warmup", duration_days: 0.5 },
    });
  });

  it("trims title and defaults path when duration is 1", () => {
    expect(parseAddModuleForm("  Intro  ", "1")).toEqual({
      values: { title: "Intro", duration_days: 1 },
    });
  });

  it("rejects empty title", () => {
    expect(parseAddModuleForm("   ", "1")).toEqual({
      errors: { title: "Title is required." },
    });
  });

  it("rejects zero or negative duration", () => {
    expect(parseAddModuleForm("Intro", "0")).toEqual({
      errors: {
        duration_days: "Duration must be a positive number of days.",
      },
    });
    expect(parseAddModuleForm("Intro", "-1")).toEqual({
      errors: {
        duration_days: "Duration must be a positive number of days.",
      },
    });
  });
});
