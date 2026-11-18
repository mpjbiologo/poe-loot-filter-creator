import { describe, expect, it } from "vitest";
import {
  CATALOG_VERSION, EXCLUDED_POE2_CONDITIONS, FILTER_OPERATORS,
  POE1_ACTIONS, POE1_BLOCKS, POE1_CONDITIONS, POE1_DIRECTIVES,
  findAction, findCondition,
} from "./catalog";

describe("PoE1 syntax catalog", () => {
  it("has a dated, explicit catalog version", () => {
    expect(CATALOG_VERSION).toBe("poe1-2026-11-18");
  });

  it("does not expose conditions marked PoE2-only by GGG", () => {
    const names = POE1_CONDITIONS.map(item => item.name);
    for (const excluded of EXCLUDED_POE2_CONDITIONS) expect(names).not.toContain(excluded.name);
    expect(EXCLUDED_POE2_CONDITIONS.length).toBeGreaterThan(0);
  });

  it("contains the documented PoE1 block and directive keywords", () => {
    expect(POE1_BLOCKS.map(item => item.name)).toEqual(["Show", "Hide", "Minimal"]);
    expect(POE1_DIRECTIVES.map(item => item.name)).toEqual(["Continue", "Import"]);
  });

  it("provides typed conditions and actions with examples", () => {
    expect(findCondition("rarity")?.valueKind).toBe("enum");
    expect(findCondition("ItemLevel")?.valueKind).toBe("number");
    expect(findAction("SetFontSize")?.arguments[0]?.range).toBe("1–45");
    expect(findAction("PlayAlertSound")?.arguments[0]?.range).toBe("1–16");
    expect(POE1_ACTIONS.every(item => item.example.length > 0)).toBe(true);
  });

  it("records the documented filter operators", () => {
    expect(FILTER_OPERATORS.map(item => item.token)).toEqual(["=", "!", "!=", "<=", ">=", "<", ">", "=="]);
  });
});
