import { useState } from "react";

type Props = { source: string; setSource: (value: string) => void };

const UNIQUE_CLASSES = [
  "Amulets", "Belts", "Body Armours", "Boots", "Gloves", "Helmets",
  "Rings", "Shields", "One Hand Axes", "One Hand Maces", "One Hand Swords",
  "Two Hand Axes", "Two Hand Maces", "Two Hand Swords", "Bows", "Staves",
  "Daggers", "Claws", "Wands", "Sceptres", "Jewels", "Flasks",
] as const;

// Bases historicamente associadas a únicos procurados. A lista é editável:
// base não garante que o único correspondente tenha preço alto na liga atual.
const DEFAULT_BASES = [
  "Leather Belt", "Heavy Belt", "Stygian Vise", "Vaal Regalia",
  "Hubris Circlet", "Sorcerer Boots", "Two-Toned Boots",
  "Imperial Bow", "Spine Bow", "Thicket Bow", "Jewelled Foil",
];

function quote(value: string) {
  return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function makeActions(options: {
  text: string; border: string; background: string; font: number;
  sound: number; volume: number; effect: string; icon: string; shape: string; iconSize: number;
}) {
  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(" ");
  return [
    `    SetTextColor ${rgb(options.text)}`,
    `    SetBorderColor ${rgb(options.border)}`,
    `    SetBackgroundColor ${rgb(options.background)} 220`,
    `    SetFontSize ${options.font}`,
    ...(options.sound > 0 ? [`    PlayAlertSound ${options.sound} ${options.volume}`] : []),
    ...(options.effect !== "None" ? [`    PlayEffect ${options.effect}`] : []),
    ...(options.icon !== "None" ? [`    MinimapIcon ${options.iconSize} ${options.icon} ${options.shape}`] : []),
  ].join("\n");
}

function makeRule(kind: "Show" | "Hide", conditions: string[], actions: string) {
  return [kind, ...conditions.map(value => "    " + value), ...(kind === "Show" ? actions.split("\n") : [])].join("\n");
}

export default function UnidentifiedUniques({ source, setSource }: Props) {
  const [mode, setMode] = useState<"Show" | "Hide">("Show");
  const [allUniques, setAllUniques] = useState(true);
  const [classes, setClasses] = useState<string[]>([]);
  const [baseText, setBaseText] = useState(DEFAULT_BASES.join("\n"));
  const [minItemLevel, setMinItemLevel] = useState("75");
  const [useItemLevel, setUseItemLevel] = useState(false);
  const [text, setText] = useState("#F5D77A");
  const [border, setBorder] = useState("#FF9A38");
  const [background, setBackground] = useState("#38200F");
  const [font, setFont] = useState(42);
  const [sound, setSound] = useState(6);
  const [volume, setVolume] = useState(160);
  const [effect, setEffect] = useState("Yellow");
  const [icon, setIcon] = useState("Yellow");
  const [shape, setShape] = useState("Star");
  const [iconSize, setIconSize] = useState(2);
  const [baseStyle, setBaseStyle] = useState(true);
  const [status, setStatus] = useState("");

  const bases = [...new Set(baseText.split(/\r?\n/).map(value => value.trim()).filter(Boolean))];
  const actions = makeActions({ text, border, background, font, sound, volume, effect, icon, shape, iconSize });

  function toggleClass(value: string) {
    setClasses(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }

  function addRules() {
    if (!allUniques && classes.length === 0 && bases.length === 0) {
      setStatus("Selecione todos os únicos, uma ou mais classes ou informe bases prioritárias.");
      return;
    }

    const rules: string[] = [];
    const levelCondition = useItemLevel && Number.isFinite(Number(minItemLevel)) && Number(minItemLevel) >= 1
      ? [`ItemLevel >= ${Math.min(100, Math.floor(Number(minItemLevel)))}`]
      : [];

    // Bases prioritárias vêm primeiro para receber identidade visual própria.
    if (baseStyle) {
      for (const base of bases) {
        rules.push(makeRule("Show", [`Rarity Unique`, "Identified False", `BaseType ${quote(base)}`, ...levelCondition], actions));
      }
    }

    // Classes escolhidas são regras independentes e editáveis no editor principal.
    for (const itemClass of classes) {
      rules.push(makeRule(mode, ["Rarity Unique", "Identified False", `Class ${quote(itemClass)}`, ...levelCondition], actions));
    }

    if (allUniques) {
      rules.push(makeRule(mode, ["Rarity Unique", "Identified False", ...levelCondition], actions));
    }

    const block = [
      "# === POE FILTER FORGE: UNIDENTIFIED UNIQUE RULES ===",
      "# Regras geradas pelo assistente de únicos não identificados; podem ser editadas livremente.",
      ...rules,
      "# === END POE FILTER FORGE: UNIDENTIFIED UNIQUE RULES ===",
    ].join("\n");

    const start = source.indexOf("# === POE FILTER FORGE: UNIDENTIFIED UNIQUE RULES ===");
    const endMarker = "# === END POE FILTER FORGE: UNIDENTIFIED UNIQUE RULES ===";
    let next = source;
    if (start >= 0) {
      const end = source.indexOf(endMarker, start);
      if (end >= 0) next = source.slice(0, start) + source.slice(end + endMarker.length).replace(/^\s*\n/, "");
      else next = source.slice(0, start);
    }
    const firstRule = next.search(/^(?:Show|Hide|Minimal)\s*$/im);
    if (firstRule >= 0) next = next.slice(0, firstRule) + block + "\n\n" + next.slice(firstRule);
    else next = next.trimEnd() + (next.trim() ? "\n\n" : "") + block + "\n";
    setSource(next);
    setStatus(`${rules.length} regra(s) adicionada(s). As bases prioritárias foram posicionadas antes das regras gerais.`);
  }

  return (
    <section className="unidentified-uniques" aria-label="Únicos não identificados">
      <div className="unique-head">
        <div><span className="panel-kicker">FILTRO ESPECIAL</span><h3>Únicos não identificados</h3></div>
        <span className="unique-tag">RAROS · POTENCIALMENTE VALIOSOS</span>
      </div>
      <p>Crie regras para destacar únicos antes de identificá-los. O filtro não consegue saber o preço real ou os afixos ocultos; a seleção por base é uma estimativa de potencial, não uma cotação.</p>

      <div className="unique-options-grid">
        <div className="unique-option">
          <b>REGRA GERAL</b>
          <label className="unique-check"><input type="checkbox" checked={allUniques} onChange={event => setAllUniques(event.target.checked)} /> Todos os únicos não identificados</label>
          <div className="unique-inline">
            <label>Comportamento das regras gerais/classes</label>
            <select value={mode} onChange={event => setMode(event.target.value as "Show" | "Hide")}>
              <option value="Show">Mostrar</option><option value="Hide">Ocultar</option>
            </select>
          </div>
          <label className="unique-check"><input type="checkbox" checked={useItemLevel} onChange={event => setUseItemLevel(event.target.checked)} /> Exigir nível mínimo do item</label>
          {useItemLevel && <input type="number" min="1" max="100" value={minItemLevel} onChange={event => setMinItemLevel(event.target.value)} aria-label="Nível mínimo do item" />}
        </div>

        <div className="unique-option">
          <b>CLASSES DE ITENS</b>
          <small>Selecione classes para criar regras separadas.</small>
          <div className="unique-class-grid">
            {UNIQUE_CLASSES.map(item => <label key={item} className="unique-check"><input type="checkbox" checked={classes.includes(item)} onChange={() => toggleClass(item)} /> {item}</label>)}
          </div>
        </div>

        <div className="unique-option unique-bases">
          <b>BASES POTENCIALMENTE VALIOSAS</b>
          <small>Uma base por linha. Essas regras são sempre adicionadas antes da regra geral.</small>
          <textarea rows={6} value={baseText} onChange={event => setBaseText(event.target.value)} aria-label="Lista de bases únicas prioritárias" />
          <label className="unique-check"><input type="checkbox" checked={baseStyle} onChange={event => setBaseStyle(event.target.checked)} /> Criar destaque especial para essas bases</label>
          <small>Lista inicial editável; revise conforme a liga e a economia. A base, sozinha, não garante valor.</small>
        </div>

        <div className="unique-option unique-appearance">
          <b>APARÊNCIA E ALERTAS</b>
          <div className="unique-control-grid">
            <label>Texto <input type="color" value={text} onChange={event => setText(event.target.value)} /></label>
            <label>Borda <input type="color" value={border} onChange={event => setBorder(event.target.value)} /></label>
            <label>Fundo <input type="color" value={background} onChange={event => setBackground(event.target.value)} /></label>
            <label>Fonte (1–45) <input type="number" min="1" max="45" value={font} onChange={event => setFont(Math.max(1, Math.min(45, Number(event.target.value) || 1)))} /></label>
            <label>Som (0 = nenhum) <select value={sound} onChange={event => setSound(Number(event.target.value))}>{Array.from({ length: 17 }, (_, i) => <option key={i} value={i}>{i === 0 ? "Sem som" : `Alerta ${i}`}</option>)}</select></label>
            <label>Volume (0–300) <input type="number" min="0" max="300" value={volume} onChange={event => setVolume(Math.max(0, Math.min(300, Number(event.target.value) || 0)))} /></label>
            <label>Efeito <select value={effect} onChange={event => setEffect(event.target.value)}>{["None","Red","Green","Blue","Brown","White","Yellow","Cyan","Grey","Orange","Pink","Purple"].map(value => <option key={value} value={value}>{value === "None" ? "Nenhum" : value}</option>)}</select></label>
            <label>Ícone no minimapa <select value={icon} onChange={event => setIcon(event.target.value)}>{["None","Red","Green","Blue","Brown","White","Yellow","Cyan","Grey","Orange","Pink","Purple"].map(value => <option key={value} value={value}>{value === "None" ? "Nenhum" : value}</option>)}</select></label>
            <label>Formato do ícone <select value={shape} onChange={event => setShape(event.target.value)}>{["Circle","Diamond","Hexagon","Square","Star","Triangle","Cross","Moon","Raindrop","Kite","Pentagon","UpsideDownHouse"].map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Tamanho do ícone <select value={iconSize} onChange={event => setIconSize(Number(event.target.value))}><option value={0}>0 · Pequeno</option><option value={1}>1 · Médio</option><option value={2}>2 · Grande</option></select></label>
          </div>
        </div>
      </div>
      <div className="unique-footer">
        <span>{bases.length} bases · {classes.length} classes selecionadas · {allUniques ? "regra geral ativa" : "sem regra geral"}</span>
        <button className="button primary" onClick={addRules}>＋ Adicionar regras ao filtro</button>
      </div>
      {status && <div className="unique-status" role="status">{status}</div>}
    </section>
  );
}
