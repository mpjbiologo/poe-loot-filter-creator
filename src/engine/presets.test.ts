import { describe, expect, it } from "vitest";
import { parseFilter } from "./filter";
import { POE1_PRESETS } from "./presets";

describe("PoE1 filter presets", () => {
  it("provides the expected starter filters", () => {
    expect(POE1_PRESETS.map(preset => preset.id)).toEqual([
      "leveling",
      "semi-restrito",
      "restrito",
      "muito-restrito",
      "endgame-mapas",
      "minimalista-ruthless",
    ]);
  });

  it.each(POE1_PRESETS.map(preset => [preset.name, preset.source] as const))(
    "%s has a parseable rule structure",
    (_name, source) => {
      const parsed = parseFilter(source);
      expect(parsed.diagnostics).toEqual([]);
      expect(parsed.lines.some(line => line.type === "rule")).toBe(true);
    },
  );

  it("keeps Ruthless Minimal blocks exclusive to the Ruthless preset", () => {
    const presetsWithMinimal = POE1_PRESETS.filter(preset =>
      parseFilter(preset.source).lines.some(line => line.type === "rule" && line.kind === "Minimal"),
    );
    expect(presetsWithMinimal.map(preset => preset.id)).toEqual(["minimalista-ruthless"]);
  });
});
