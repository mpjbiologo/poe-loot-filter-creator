import { useEffect, useMemo, useRef, useState } from "react";
import { parseFilter, serializeFilter, type FilterLine, type RuleKind } from "./engine/filter";
import { POE1_ACTIONS, POE1_CONDITIONS } from "./engine/catalog";

const STORAGE_KEY = "poe-filter-forge-project-v1";

function loadSaved(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

const starter = `# PoE Loot Filter Creator — Path of Exile 1
# Regras são avaliadas na ordem em que aparecem.

Show
    Class Currency
    SetTextColor 255 220 120
    SetBorderColor 220 160 70
    SetFontSize 40

Show
    Rarity Unique
    SetTextColor 255 190 90
    SetBorderColor 255 120 40
    SetFontSize 42
    PlayAlertSound 6 180

Hide
    Rarity Normal
`;

type Rule = Extract<FilterLine, { type: "rule" }>;

type RulePreview = {
  textColor: string;
  borderColor: string;
  backgroundColor: string;
  fontSize: number;
  itemName: string;
  minimap?: { size: number; color: string; shape: string };
  effect?: string;
};

function getRulePreview(rule?: Rule): RulePreview {
  const preview: RulePreview = {
    textColor: "rgb(241, 209, 126)",
    borderColor: "rgb(185, 150, 76)",
    backgroundColor: "rgba(18, 18, 15, 0.92)",
    fontSize: 18,
    itemName: "Chaos Orb",
  };
  if (!rule) return preview;

  for (const line of rule.lines) {
    if (line.type !== "raw") continue;
    const value = line.value.trim();
    const color = value.match(/^(SetTextColor|SetBorderColor|SetBackgroundColor)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/i);
    if (color) {
      const [, command, r, g, b, alpha] = color;
      const opacity = Math.max(0, Math.min(255, Number(alpha ?? 255))) / 255;
      const rgba = `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
      if (command.toLowerCase() === "settextcolor") preview.textColor = `rgb(${r}, ${g}, ${b})`;
      if (command.toLowerCase() === "setbordercolor") preview.borderColor = `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;
      if (command.toLowerCase() === "setbackgroundcolor") preview.backgroundColor = rgba;
    }
    const font = value.match(/^SetFontSize\s+(\d+)/i);
    if (font) preview.fontSize = Math.max(1, Math.min(45, Number(font[1])));
    const icon = value.match(/^MinimapIcon\s+(-?\d+)\s+(\w+)\s+(\w+)/i);
    if (icon) preview.minimap = { size: Number(icon[1]), color: icon[2], shape: icon[3] };
    const effect = value.match(/^PlayEffect\s+(\w+)/i);
    if (effect) preview.effect = effect[1];
    const base = value.match(/^BaseType\s+(?:=\s*)?"([^"]+)"/i);
    const itemClass = value.match(/^Class\s+(?:=\s*)?"?([^"]+?)"?$/i);
    const rarity = value.match(/^Rarity\s+(?:=\s*)?(Normal|Magic|Rare|Unique)/i);
    if (base) preview.itemName = base[1];
    else if (itemClass && /currency/i.test(itemClass[1])) preview.itemName = "Chaos Orb";
    else if (rarity?.[1] === "Unique") preview.itemName = "Headhunter";
    else if (rarity?.[1] === "Rare") preview.itemName = "Rare Leather Belt";
  }
  return preview;
}

function defaultActionArgument(actionName: string, argument: { name: string; type: string; range?: string; optional?: boolean; default?: string; values?: readonly string[] }): string {
  if (argument.default !== undefined) return argument.default;
  if (argument.values?.length) return argument.values[0];
  if (argument.type !== "number") return "";
  const name = argument.name.toLowerCase();
  if (name === "id") return "1";
  if (name === "volume") return "100";
  if (name === "alpha") return "255";
  if (["red", "green", "blue"].includes(name)) return "255";
  if (actionName === "SetFontSize") return "30";
  if (actionName === "MinimapIcon" && name === "size") return "2";
  const minimum = argument.range?.match(/-?\d+/)?.[0];
  return minimum ?? "1";
}

function replaceRule(source: string, ruleIndex: number, transform: (rule: Rule) => Rule): string {
  const parsed = parseFilter(source);
  let seen = -1;
  const next = parsed.lines.map(line => {
    if (line.type !== "rule") return line;
    seen += 1;
    return seen === ruleIndex ? transform(line) : line;
  });
  return serializeFilter(next);
}

function RuleCard({ rule, index, total, onChange, onMove, onDuplicate, onDelete, onPreview, selected }: {
  rule: Rule;
  index: number;
  total: number;
  onChange: (lines: FilterLine[]) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onPreview: () => void;
  selected: boolean;
}) {
  const [condition, setCondition] = useState(POE1_CONDITIONS[0]?.name ?? "Class");
  const [conditionOperator, setConditionOperator] = useState("=");
  const [conditionValue, setConditionValue] = useState("Currency");
  const [action, setAction] = useState(POE1_ACTIONS[0]?.name ?? "SetTextColor");
  const [actionValues, setActionValues] = useState<string[]>([]);
  const conditionDefinition = POE1_CONDITIONS.find(item => item.name === condition);
  const actionDefinition = POE1_ACTIONS.find(item => item.name === action);
  const isColorAction = ["SetTextColor", "SetBorderColor", "SetBackgroundColor"].includes(action);
  const colorHex = "#" + [0, 1, 2].map(i => Math.max(0, Math.min(255, Number(actionValues[i] ?? 0) || 0)).toString(16).padStart(2, "0")).join("");

  useEffect(() => {
    if (!conditionDefinition) return;
    setConditionOperator(conditionDefinition.operators[0] ?? "=");
    setConditionValue(conditionDefinition.values?.[0] ?? (conditionDefinition.valueKind === "number" ? "1" : conditionDefinition.valueKind === "boolean" ? "True" : ""));
  }, [condition]);

  useEffect(() => {
    if (!actionDefinition) return;
    setActionValues(actionDefinition.arguments.map(argument => defaultActionArgument(actionDefinition.name, argument)));
  }, [action]);

  function updateLine(lineIndex: number, value: string) {
    const next = [...rule.lines];
    const rawIndex = next.map((line, i) => line.type === "raw" ? i : -1).filter(i => i >= 0)[lineIndex];
    if (rawIndex !== undefined) next[rawIndex] = { type: "raw", value };
    onChange(next);
  }

  function removeLine(lineIndex: number) {
    const rawIndices = rule.lines.map((line, i) => line.type === "raw" ? i : -1).filter(i => i >= 0);
    const removeAt = rawIndices[lineIndex];
    onChange(rule.lines.filter((_, i) => i !== removeAt));
  }

  function addCondition() {
    if (!conditionDefinition || !conditionValue.trim()) return;
    const value = conditionDefinition.valueKind === "text"
      ? '"' + conditionValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'
      : conditionValue.trim();
    onChange([...rule.lines, { type: "raw", value: "    " + conditionDefinition.name + " " + conditionOperator + (conditionDefinition.valueKind === "boolean" || conditionDefinition.valueKind === "enum" ? " " : " ") + value }]);
  }

  function addAction() {
    if (!actionDefinition) return;
    const args = actionDefinition.arguments.map((argument, i) => {
      const value = (actionValues[i] ?? "").trim();
      if (!value && argument.optional) return "";
      if (argument.type === "file path") return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
      return value;
    }).filter(Boolean);
    if (actionDefinition.arguments.some((argument, i) => !argument.optional && !(actionValues[i] ?? "").trim())) return;
    onChange([...rule.lines, { type: "raw", value: "    " + actionDefinition.name + (args.length ? " " + args.join(" ") : "") }]);
  }

  return (
    <article className={selected ? "rule-card selected" : "rule-card"}>
      <div className="rule-card-head">
        <span className={`rule-type ${rule.kind.toLowerCase()}`}>{rule.kind}</span>
        <span className="rule-number">REGRA {String(index + 1).padStart(2, "0")}</span>
        <button className="preview-rule-button" onClick={onPreview} aria-pressed={selected}>{selected ? "Prévia ativa" : "Ver prévia"}</button>
        <div className="rule-tools">
          <button title="Mover para cima" aria-label="Mover regra para cima" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
          <button title="Mover para baixo" aria-label="Mover regra para baixo" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
          <button title="Duplicar regra" aria-label="Duplicar regra" onClick={onDuplicate}>⧉</button>
          <button title="Excluir regra" aria-label="Excluir regra" className="danger-tool" onClick={onDelete}>×</button>
        </div>
      </div>
      <div className="rule-lines">
        {rule.lines.map((line, lineIndex) => {
          if (line.type === "raw") {
            const rawIndex = rule.lines.slice(0, lineIndex).filter(item => item.type === "raw").length;
            return (
              <div className="rule-line-edit" key={lineIndex}>
                <input aria-label={`Linha ${rawIndex + 1} da regra ${index + 1}`} value={line.value.trim()} onChange={event => updateLine(rawIndex, "    " + event.target.value)} />
                <button title="Remover linha" aria-label="Remover linha" onClick={() => removeLine(rawIndex)}>×</button>
              </div>
            );
          }
          if (line.type === "comment") return <div className="rule-comment" key={lineIndex}>{line.value.trim()}</div>;
          if (line.type === "blank") return <div className="rule-blank" key={lineIndex} />;
          if (line.type === "rule") return null;
          return <code key={lineIndex}>{line.value}</code>;
        })}
        {rule.lines.length === 0 && <small className="muted-note">Esta regra ainda não possui condições ou ações.</small>}
      </div>
      <div className="rule-builder">
        <section className="builder-section">
          <div className="builder-heading"><b>CONDIÇÃO</b><span>{conditionDefinition?.description}</span></div>
          <div className="builder-row">
            <select aria-label="Selecionar condição" value={condition} onChange={event => setCondition(event.target.value)}>
              {POE1_CONDITIONS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
            <select className="operator-select" aria-label="Operador da condição" value={conditionOperator} onChange={event => setConditionOperator(event.target.value)}>
              {(conditionDefinition?.operators ?? ["="]).map(operator => <option key={operator} value={operator}>{operator}</option>)}
            </select>
          </div>
          <div className="builder-row value-row">
            {conditionDefinition?.values ? (
              <select aria-label="Valor da condição" value={conditionValue} onChange={event => setConditionValue(event.target.value)}>
                {conditionDefinition.values.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            ) : (
              <input aria-label="Valor da condição" type={conditionDefinition?.valueKind === "number" ? "number" : "text"} min={conditionDefinition?.numericRange?.[0]} max={conditionDefinition?.numericRange?.[1]} placeholder={conditionDefinition?.valueKind === "number" ? "Informe um número" : conditionDefinition?.valueKind === "socket-pattern" ? "Ex.: 5GGG" : "Informe o valor"} value={conditionValue} onChange={event => setConditionValue(event.target.value)} />
            )}
            <button className="mini-add" onClick={addCondition} disabled={!conditionValue.trim()}>＋ Adicionar condição</button>
          </div>
        </section>
        <section className="builder-section">
          <div className="builder-heading"><b>AÇÃO</b><span>{actionDefinition?.description}</span></div>
          <div className="builder-row">
            <select aria-label="Selecionar ação" value={action} onChange={event => setAction(event.target.value)}>
              {POE1_ACTIONS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </div>
          {actionDefinition?.arguments.map((argument, argumentIndex) => (
            <div className="action-argument" key={argument.name}>
              <label>{argument.name}{argument.optional ? " (opcional)" : ""}{argument.range ? <small> · {argument.range}</small> : ""}</label>
              {argument.values ? (
                <select aria-label={argument.name} value={actionValues[argumentIndex] ?? ""} onChange={event => setActionValues(values => values.map((value, i) => i === argumentIndex ? event.target.value : value))}>
                  {argument.values.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              ) : (
                <input aria-label={argument.name} type={argument.type === "number" ? "number" : "text"} value={actionValues[argumentIndex] ?? ""} placeholder={argument.type === "file path" ? "Nome do arquivo" : argument.default ?? argument.name} onChange={event => setActionValues(values => values.map((value, i) => i === argumentIndex ? event.target.value : value))} />
              )}
            </div>
          ))}
          {isColorAction && (
            <div className="color-picker-row">
              <label htmlFor={"action-color-" + index}>Seletor visual de cor</label>
              <div><input id={"action-color-" + index} type="color" value={colorHex} onChange={event => {
                const hex = event.target.value;
                const rgb = [1, 3, 5].map(offset => String(parseInt(hex.slice(offset, offset + 2), 16)));
                setActionValues(values => values.map((value, i) => i < 3 ? rgb[i] : value));
              }} /><code>{colorHex.toUpperCase()}</code></div>
            </div>
          )}
          <div className="builder-row action-submit">
            <button className="mini-add" onClick={addAction} disabled={!!actionDefinition?.arguments.some((argument, i) => !argument.optional && !(actionValues[i] ?? "").trim())}>＋ Adicionar ação</button>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function App() {
  const [source, setSource] = useState(() => loadSaved(`${STORAGE_KEY}:source`, starter));
  const [filterName, setFilterName] = useState(() => loadSaved(`${STORAGE_KEY}:name`, "Meu primeiro filtro"));
  const [activeTab, setActiveTab] = useState<"visual" | "codigo">("visual");
  const [previewRuleIndex, setPreviewRuleIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseFilter(source), [source]);
  const rules = parsed.lines.filter((line): line is Rule => line.type === "rule");

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}:source`, source);
      localStorage.setItem(`${STORAGE_KEY}:name`, filterName);
    } catch {
      // O editor continua funcional mesmo se o navegador bloquear o armazenamento local.
    }
  }, [source, filterName]);

  function download() {
    const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = (filterName.trim() || "meu-filtro").replace(/[^a-z0-9-_]+/gi, "-") + ".filter";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file?: File) {
    if (!file) return;
    setSource(await file.text());
    setFilterName(file.name.replace(/\.filter$/i, ""));
    setActiveTab("visual");
    if (fileRef.current) fileRef.current.value = "";
  }

  function addRule(kind: RuleKind) {
    const next = source.trimEnd() + (source.trim() ? "\n\n" : "") + kind + "\n";
    setSource(next);
    setActiveTab("visual");
  }

  function updateRule(index: number, lines: FilterLine[]) {
    setSource(replaceRule(source, index, current => ({ ...current, lines })));
  }

  function moveRule(index: number, direction: -1 | 1) {
    const parsedLines = [...parsed.lines];
    const positions = parsedLines.map((line, i) => line.type === "rule" ? i : -1).filter(i => i >= 0);
    const from = positions[index];
    const to = positions[index + direction];
    if (from === undefined || to === undefined) return;
    [parsedLines[from], parsedLines[to]] = [parsedLines[to], parsedLines[from]];
    setSource(serializeFilter(parsedLines));
  }

  function duplicateRule(index: number) {
    let seen = -1;
    const next: FilterLine[] = [];
    for (const line of parsed.lines) {
      next.push(line);
      if (line.type === "rule") {
        seen += 1;
        if (seen === index) next.push({ type: "rule", kind: line.kind, lines: line.lines.map(item => ({ ...item })) });
      }
    }
    setSource(serializeFilter(next));
  }

  function deleteRule(index: number) {
    let seen = -1;
    setSource(serializeFilter(parsed.lines.filter(line => {
      if (line.type !== "rule") return true;
      seen += 1;
      return seen !== index;
    })));
  }

  const previewRule = rules[previewRuleIndex];
  const rulePreview = getRulePreview(previewRule);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="PoE Loot Filter Creator início">
          <span className="brand-mark">✦</span>
          <span><strong>POE FILTER FORGE</strong><small>PATH OF EXILE 1 · COMMUNITY TOOL</small></span>
        </a>
        <div className="top-actions">
          <span className="game-pill">POE 1</span>
          <button className="button ghost" onClick={() => fileRef.current?.click()}>Importar .filter</button>
          <input ref={fileRef} type="file" accept=".filter,.txt" hidden onChange={e => void importFile(e.target.files?.[0])} />
          <button className="button primary" onClick={download}>Exportar filtro ↗</button>
        </div>
      </header>

      <section className="intro">
        <div>
          <div className="eyebrow"><span className="pulse" /> EDITOR DE FILTROS · POE1</div>
          <h1>Forje seu <em>filtro de loot.</em></h1>
          <p>Monte regras visuais, personalize condições e ações e exporte seu filtro para usar no jogo.</p>
        </div>
        <div className="intro-note"><span>01</span><div><b>Path of Exile 1</b><small>Editor visual em evolução</small></div></div>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="side-label">PROJETO</div>
          <label className="field-label" htmlFor="filter-name">Nome do filtro</label>
          <input id="filter-name" className="text-input" value={filterName} onChange={e => setFilterName(e.target.value)} />
          <div className="side-divider" />
          <div className="side-label">ESTRUTURA</div>
          <div className="stat-row"><span>Blocos de regra</span><b>{rules.length}</b></div>
          <div className="stat-row"><span>Linhas configuradas</span><b>{rules.reduce((sum, rule) => sum + rule.lines.filter(line => line.type === "raw").length, 0)}</b></div>
          <div className="stat-row"><span>Avisos estruturais</span><b className={parsed.diagnostics.length ? "warn" : "ok"}>{parsed.diagnostics.length}</b></div>
          <div className="side-divider" />
          <div className="side-label">ADICIONAR REGRA</div>
          <button className="add-rule show" onClick={() => addRule("Show")}><span>＋</span><div><b>Mostrar item</b><small>Show</small></div></button>
          <button className="add-rule hide" onClick={() => addRule("Hide")}><span>－</span><div><b>Ocultar item</b><small>Hide</small></div></button>
          <button className="add-rule minimal" onClick={() => addRule("Minimal")}><span>◌</span><div><b>Exibição mínima</b><small>Minimal · Ruthless</small></div></button>
          <div className="sidebar-foot">SEUS DADOS FICAM NO NAVEGADOR</div>
        </aside>

        <section className="editor-panel">
          <div className="panel-head">
            <div><span className="panel-kicker">EDITOR</span><h2>Regras do filtro</h2></div>
            <div className="tabs">
              <button className={activeTab === "visual" ? "tab active" : "tab"} onClick={() => setActiveTab("visual")}>Visual</button>
              <button className={activeTab === "codigo" ? "tab active" : "tab"} onClick={() => setActiveTab("codigo")}>Código</button>
            </div>
          </div>
          {activeTab === "codigo" ? (
            <div className="code-wrap">
              <div className="code-toolbar"><span>● SINTAXE DE FILTRO POE1</span><span>{source.split("\n").length} linhas</span></div>
              <textarea className="code-editor" spellCheck={false} value={source} onChange={e => setSource(e.target.value)} aria-label="Código do filtro" />
            </div>
          ) : (
            <div className="rule-list">
              {rules.map((rule, index) => (
                <RuleCard key={index} rule={rule} index={index} total={rules.length} selected={previewRuleIndex === index} onPreview={() => setPreviewRuleIndex(index)}
                  onChange={lines => updateRule(index, lines)}
                  onMove={direction => moveRule(index, direction)}
                  onDuplicate={() => duplicateRule(index)}
                  onDelete={() => deleteRule(index)} />
              ))}
              {rules.length === 0 && <div className="empty-state">Nenhum bloco de regra. Comece adicionando um bloco Show, Hide ou Minimal.</div>}
              <button className="wide-add" onClick={() => addRule("Show")}>＋ Adicionar bloco Show</button>
            </div>
          )}
          <div className="diagnostics">
            <div className="diagnostics-title"><span>VALIDAÇÃO ESTRUTURAL</span><b>{parsed.diagnostics.length ? "Revisar avisos" : "Estrutura analisada"}</b></div>
            {parsed.diagnostics.length === 0 ? <p className="success-line">✓ Nenhum problema estrutural básico encontrado.</p> : parsed.diagnostics.map((item, i) => <p className="warning-line" key={i}>⚠ Linha {item.line}: {item.message}</p>)}
            <small>O catálogo auxilia a montagem; ainda é necessário validar a compatibilidade final no jogo.</small>
          </div>
        </section>

        <aside className="preview-panel">
          <div className="panel-kicker">PRÉVIA EM TEMPO REAL</div><h2>Aparência da regra</h2>
          <p className="preview-desc">{previewRule ? `Visualização da regra ${previewRuleIndex + 1}. Selecione “Ver prévia” em outra regra para comparar.` : "Adicione uma regra para visualizar sua aparência."}</p>
          <div className="game-preview">
            <div className="preview-scene">
              <span className="scene-label">WRAECLAST · ITEM DROP</span>
              {rulePreview.effect && <span className={`preview-beam effect-${rulePreview.effect.toLowerCase()}`}>{rulePreview.effect} effect</span>}
              <div className="loot-item live-loot" style={{ color: rulePreview.textColor, borderColor: rulePreview.borderColor, backgroundColor: rulePreview.backgroundColor, fontSize: `${rulePreview.fontSize}px` }}>
                {rulePreview.minimap && rulePreview.minimap.size >= 0 && <i className="preview-minimap" title={`MinimapIcon ${rulePreview.minimap.size} ${rulePreview.minimap.color} ${rulePreview.minimap.shape}`}>◆</i>}
                <b>{rulePreview.itemName}</b>
              </div>
            </div>
          </div>
          <div className="preview-specs">
            <span><i style={{background:rulePreview.textColor}} /> Texto</span>
            <span><i style={{background:rulePreview.borderColor}} /> Borda</span>
            <span><i style={{background:rulePreview.backgroundColor}} /> Fundo</span>
            <span>Fonte: {rulePreview.fontSize}px</span>
            {rulePreview.minimap && <span>Minimapa: {rulePreview.minimap.color} · {rulePreview.minimap.shape}</span>}
          </div>
          <div className="preview-tip"><b>Prévia ilustrativa</b><p>A imagem representa as ações visuais configuradas na regra selecionada. A correspondência real de itens e a renderização exata do jogo ainda dependem da validação no PoE1.</p></div>
        </aside>
      </section>
      <footer><span>POE FILTER FORGE <i>·</i> FEITO PARA A COMUNIDADE</span><span>Path of Exile é uma marca da Grinding Gear Games.</span></footer>
    </main>
  );
}
