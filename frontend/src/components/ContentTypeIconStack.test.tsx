import { describe, expect, it } from "vitest";

import { visibleContentTypeIcons } from "./ContentTypeIconStack";

describe("visibleContentTypeIcons", () => {
  it("returns one icon per distinct type, max 4", () => {
    expect(
      visibleContentTypeIcons([
        "theory",
        "theory",
        "exercise",
        "project",
        "quiz",
      ]),
    ).toEqual(["lesson", "quiz", "exercise", "project"]);
  });

  it("keeps only types present in the module", () => {
    expect(visibleContentTypeIcons(["project", "exercise"])).toEqual([
      "exercise",
      "project",
    ]);
  });

  it("returns empty for missing types", () => {
    expect(visibleContentTypeIcons([])).toEqual([]);
    expect(visibleContentTypeIcons(null)).toEqual([]);
  });
});
