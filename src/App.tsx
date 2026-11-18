import { useMemo, useRef, useState } from "react";
import { countRules, parseFilter, type FilterLine } from "./engine/filter";

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

export default function App() {
  const [source, setSource] = useState(starter);
  const [filterName, setFilterName] = useState("Meu primeiro filtro");
  const [activeTab, setActiveTab] = useState<"visual" | "codigo">("visual");
  const fileRef = useRef<HTMLInputElement>(null);
  const parsed = useMemo(() => parseFilter(source), [source]);
  const rules = parsed.lines.filter((line): line is Extract<FilterLine, {type:"rule"}> => line.type === "rule");

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
    setActiveTab("codigo");
  }

  function addRule(kind: "Show" | "Hide" | "Minimal") {
    const addition = `${source.trimEnd()}\n\n${kind}\n    Class Currency\n`;
    setSource(addition);
    setActiveTab("codigo");
  }

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
          <div className="eyebrow"><span className="pulse" /> EDITOR DE FILTROS · VERSÃO INICIAL</div>
          <h1>Forje seu <em>filtro de loot.</em></h1>
          <p>Crie, organize e personalize as regras dos itens que aparecem em Wraeclast.</p>
        </div>
        <div className="intro-note"><span>01</span><div><b>Path of Exile 1</b><small>Compatibilidade em desenvolvimento</small></div></div>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="side-label">PROJETO</div>
          <label className="field-label" htmlFor="filter-name">Nome do filtro</label>
          <input id="filter-name" className="text-input" value={filterName} onChange={e => setFilterName(e.target.value)} />
          <div className="side-divider" />
          <div className="side-label">ESTRUTURA</div>
          <div className="stat-row"><span>Blocos de regra</span><b>{rules.length}</b></div>
          <div className="stat-row"><span>Avisos</span><b className={parsed.diagnostics.length ? "warn" : "ok"}>{parsed.diagnostics.length}</b></div>
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
              <div className="code-toolbar"><span>● PoE1 FILTER SYNTAX</span><span>{source.split("\n").length} linhas</span></div>
              <textarea className="code-editor" spellCheck={false} value={source} onChange={e => setSource(e.target.value)} aria-label="Código do filtro" />
            </div>
          ) : (
            <div className="rule-list">
              {rules.map((rule, index) => (
                <article className="rule-card" key={index}>
                  <div className="rule-card-head">
                    <span className={`rule-type ${rule.kind.toLowerCase()}`}>{rule.kind}</span>
                    <span className="rule-number">REGRA {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="rule-content">
                    {rule.lines.filter((line): line is Exclude<FilterLine, { type: "rule" }> => line.type !== "blank" && line.type !== "comment" && line.type !== "rule").map((line, i) => (
                      <code key={i}>{line.value}</code>
                    ))}
                    {rule.lines.length === 0 && <small>Sem condições ou ações.</small>}
                  </div>
                </article>
              ))}
              {rules.length === 0 && <div className="empty-state">Nenhum bloco reconhecido. Importe ou edite um filtro na aba Código.</div>}
              <button className="wide-add" onClick={() => addRule("Show")}>＋ Adicionar bloco Show</button>
            </div>
          )}
          <div className="diagnostics">
            <div className="diagnostics-title"><span>VALIDAÇÃO INICIAL</span><b>{parsed.diagnostics.length ? "Revisar avisos" : "Estrutura analisada"}</b></div>
            {parsed.diagnostics.length === 0 ? <p className="success-line">✓ Nenhum problema estrutural básico encontrado.</p> : parsed.diagnostics.map((item, i) => <p className="warning-line" key={i}>⚠ Linha {item.line}: {item.message}</p>)}
            <small>Esta verificação ainda não substitui a validação completa dentro do jogo.</small>
          </div>
        </section>

        <aside className="preview-panel">
          <div className="panel-kicker">PRÉVIA</div><h2>Aparência no jogo</h2>
          <p className="preview-desc">Exemplo ilustrativo de como estilos podem destacar itens no chão.</p>
          <div className="game-preview">
            <div className="preview-scene"><span className="scene-label">WRAECLAST · DROP PREVIEW</span><div className="loot-item currency"><i>✧</i><b>Chaos Orb</b></div><div className="loot-item unique"><i>◆</i><b>Headhunter</b></div><div className="loot-item rare"><i>◇</i><b>Rare Leather Belt</b></div></div>
          </div>
          <div className="legend"><span><i className="dot gold" /> Moeda</span><span><i className="dot orange" /> Único</span><span><i className="dot yellow" /> Raro</span></div>
          <div className="preview-tip"><b>Prévia demonstrativa</b><p>A simulação visual será conectada às ações reais de cada regra nas próximas etapas.</p></div>
        </aside>
      </section>
      <footer><span>POE FILTER FORGE <i>·</i> FEITO PARA A COMUNIDADE</span><span>Path of Exile é uma marca da Grinding Gear Games.</span></footer>
    </main>
  );
}