import { describe, expect, it } from "vitest";
import { countRules, parseFilter, serializeFilter } from "./filter";

describe("PoE1 filter parser", () => {
  it("recognizes ordered Show and Hide blocks", () => {
    const result = parseFilter('Show\n  Class Currency\n\nHide\n  Rarity Normal\n');
    expect(countRules(result.lines)).toBe(2);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("preserves comments, unknown lines and imports", () => {
    const source = '# header\nImport "extra.filter"\nShow\nFutureCondition 1\n';
    const parsed = parseFilter(source);
    expect(serializeFilter(parsed.lines)).toBe(source);
  });

  it("warns about a condition outside a rule and keeps it", () => {
    const parsed = parseFilter("Class Currency\n");
    expect(parsed.diagnostics[0]?.severity).toBe("warning");
    expect(serializeFilter(parsed.lines)).toBe("Class Currency\n");
  });
});