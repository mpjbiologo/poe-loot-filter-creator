import { useMemo, useRef, useState } from "react";
import { parseFilter, serializeFilter, type FilterLine, type RuleKind } from "./engine/filter";
import { POE1_ACTIONS, POE1_CONDITIONS } from "./engine/catalog";

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

function ruleLines(rule: Rule): string[] {
  return rule.lines.filter((line): line is { type: "raw"; value: string } => line.type === "raw").map(line => line.value.trim());
}

function RuleCard({ rule, index, total, onChange, onMove, onDuplicate, onDelete }: {
  rule: Rule;
  index: number;
  total: number;
  onChange: (lines: FilterLine[]) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [condition, setCondition] = useState(POE1_CONDITIONS[0]?.name ?? "Class");
  const [action, setAction] = useState(POE1_ACTIONS[0]?.name ?? "SetTextColor");

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
    const definition = POE1_CONDITIONS.find(item => item.name === condition);
    if (!definition) return;
    onChange([...rule.lines, { type: "raw", value: "    " + definition.example }]);
  }

  function addAction() {
    const definition = POE1_ACTIONS.find(item => item.name === action);
    if (!definition) return;
    onChange([...rule.lines, { type: "raw", value: "    " + definition.example }]);
  }

  return (
    <article className="rule-card">
      <div className="rule-card-head">
        <span className={`rule-type ${rule.kind.toLowerCase()}`}>{rule.kind}</span>
        <span className="rule-number">REGRA {String(index + 1).padStart(2, "0")}</span>
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
        <div className="builder-row">
          <select aria-label="Selecionar condição" value={condition} onChange={event => setCondition(event.target.value)}>
            {POE1_CONDITIONS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
          <button className="mini-add" onClick={addCondition}>＋ Condição</button>
        </div>
        <div className="builder-row">
          <select aria-label="Selecionar ação" value={action} onChange={event => setAction(event.target.value)}>
            {POE1_ACTIONS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
          <button className="mini-add" onClick={addAction}>＋ Ação</button>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [source, setSource] = useState(starter);
  const [filterName, setFilterName] = useState("Meu primeiro filtro");
  const [activeTab, setActiveTab] = useState<"visual" | "codigo">("visual");
  const fileRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseFilter(source), [source]);
  const rules = parsed.lines.filter((line): line is Rule => line.type === "rule");

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

  const sampleStyle = source.match(/SetTextColor\s+(\d+)\s+(\d+)\s+(\d+)/i);
  const previewTextColor = sampleStyle ? `rgb(${sampleStyle[1]}, ${sampleStyle[2]}, ${sampleStyle[3]})` : "#f1d17e";

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
                <RuleCard key={index} rule={rule} index={index} total={rules.length}
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
          <div className="panel-kicker">PRÉVIA</div><h2>Aparência no jogo</h2>
          <p className="preview-desc">A cor do texto abaixo acompanha a primeira ação SetTextColor encontrada no filtro.</p>
          <div className="game-preview">
            <div className="preview-scene"><span className="scene-label">WRAECLAST · DROP PREVIEW</span><div className="loot-item currency" style={{ color: previewTextColor }}><i>✧</i><b>Chaos Orb</b></div><div className="loot-item unique"><i>◆</i><b>Headhunter</b></div><div className="loot-item rare"><i>◇</i><b>Rare Leather Belt</b></div></div>
          </div>
          <div className="legend"><span><i className="dot gold" /> Moeda</span><span><i className="dot orange" /> Único</span><span><i className="dot yellow" /> Raro</span></div>
          <div className="preview-tip"><b>Sobre a prévia</b><p>Esta representação é ilustrativa. A simulação completa de itens e correspondência das regras será implementada em uma próxima etapa.</p></div>
        </aside>
      </section>
      <footer><span>POE FILTER FORGE <i>·</i> FEITO PARA A COMUNIDADE</span><span>Path of Exile é uma marca da Grinding Gear Games.</span></footer>
    </main>
  );
}
