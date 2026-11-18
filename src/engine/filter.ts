export type RuleKind = "Show" | "Hide" | "Minimal";
export type FilterLine =
  | { type: "comment" | "blank" | "raw"; value: string }
  | { type: "directive"; value: string }
  | { type: "rule"; kind: RuleKind; lines: FilterLine[] };

export interface ParseResult {
  lines: FilterLine[];
  diagnostics: { line: number; severity: "warning" | "error"; message: string }[];
}

const RULE_START = /^(Show|Hide|Minimal)\s*$/i;
const DIRECTIVE = /^(Import)\s+/i;

export function parseFilter(source: string): ParseResult {
  const root: FilterLine[] = [];
  const diagnostics: ParseResult["diagnostics"] = [];
  let current: Extract<FilterLine, { type: "rule" }> | null = null;

  source.replace(/^\uFEFF/, "").split(/\r?\n/).forEach((original, index) => {
    const trimmed = original.trim();
    if (!trimmed) {
      (current ? current.lines : root).push({ type: "blank", value: original });
      return;
    }
    if (trimmed.startsWith("#")) {
      (current ? current.lines : root).push({ type: "comment", value: original });
      return;
    }
    const match = trimmed.match(RULE_START);
    if (match) {
      current = { type: "rule", kind: (match[1][0].toUpperCase() + match[1].slice(1).toLowerCase()) as RuleKind, lines: [] };
      root.push(current);
      return;
    }
    if (DIRECTIVE.test(trimmed)) {
      root.push({ type: "directive", value: original });
      return;
    }
    if (current) {
      current.lines.push({ type: "raw", value: original });
    } else {
      root.push({ type: "raw", value: original });
      diagnostics.push({
        line: index + 1,
        severity: "warning",
        message: "Linha fora de um bloco de regra preservada sem interpretação."
      });
    }
  });

  if (root.length === 0) {
    diagnostics.push({ line: 1, severity: "warning", message: "O filtro está vazio." });
  }
  return { lines: root, diagnostics };
}

export function serializeFilter(lines: FilterLine[]): string {
  const output: string[] = [];
  const write = (items: FilterLine[]) => {
    for (const item of items) {
      if (item.type === "rule") {
        output.push(item.kind);
        write(item.lines);
      } else {
        output.push(item.value);
      }
    }
  };
  write(lines);
  return output.join("\n").replace(/\n+$/, "") + (output.length ? "\n" : "");
}

export function countRules(lines: FilterLine[]): number {
  return lines.reduce((total, line) => total + (line.type === "rule" ? 1 : 0), 0);
}