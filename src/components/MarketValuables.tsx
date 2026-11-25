import { useEffect, useMemo, useState } from "react";

type League = { id: string; name: string };
type CurrencyLine = { currencyTypeName: string; detailsId: string; chaosEquivalent: number };
type CurrencyResponse = { lines?: CurrencyLine[] };

type ValuableItem = {
  id: string;
  name: string;
  chaosValue: number;
  category: "Currency" | "Fragment";
};

const API = "https://poe.ninja/poe1/api/economy";
const CACHE_MS = 10 * 60 * 1000;
const CACHE_KEY = "poe-filter-forge-poeninja-v1";

async function cachedJson<T>(url: string): Promise<T> {
  try {
    const cached = localStorage.getItem(CACHE_KEY + ":" + url);
    if (cached) {
      const parsed = JSON.parse(cached) as { savedAt: number; data: T };
      if (Date.now() - parsed.savedAt < CACHE_MS) return parsed.data;
    }
  } catch { /* Cache inválido: buscar novamente. */ }
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("poe.ninja respondeu com HTTP " + response.status + ".");
  const data = await response.json() as T;
  try { localStorage.setItem(CACHE_KEY + ":" + url, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* Cache opcional. */ }
  return data;
}

function quoteFilter(value: string): string {
  return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function makeValuableRule(item: ValuableItem, settings: {
  sound: number; volume: number; effect: string; minimapColor: string; fontSize: number;
}): string {
  const colors: Record<string, [number, number, number]> = {
    Yellow: [255, 230, 100], Orange: [255, 160, 70], Red: [255, 90, 90],
    Green: [100, 255, 130], Blue: [100, 180, 255], Purple: [210, 130, 255], White: [255, 255, 255],
  };
  const [r, g, b] = colors[settings.minimapColor] ?? colors.Yellow;
  const text = item.chaosValue >= 100 ? [255, 235, 150] : item.chaosValue >= 20 ? [255, 190, 100] : [230, 210, 150];
  const border = item.chaosValue >= 100 ? [255, 190, 70] : item.chaosValue >= 20 ? [230, 145, 65] : [180, 150, 90];
  const effectLine = settings.effect === "None" ? "" : "    PlayEffect " + settings.effect + " Temp\\n";
  const soundLine = settings.sound === 0 ? "" : "    PlayAlertSound " + settings.sound + " " + settings.volume + "\\n";
  const minimapLine = "    MinimapIcon " + (item.chaosValue >= 100 ? 2 : 1) + " " + settings.minimapColor + " Star\\n";
  return "# poe.ninja · " + item.chaosValue.toFixed(1) + " chaos · " + item.category + "\\n" +
    "Show\\n    BaseType " + quoteFilter(item.name) + "\\n" +
    "    SetTextColor " + text.join(" ") + "\\n" +
    "    SetBorderColor " + border.join(" ") + "\\n" +
    "    SetBackgroundColor 35 25 12 235\\n" +
    "    SetFontSize " + settings.fontSize + "\\n" +
    soundLine + effectLine + minimapLine;
}

export default function MarketValuables({ source, setSource }: {
  source: string;
  setSource: (value: string) => void;
}) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [league, setLeague] = useState("");
  const [items, setItems] = useState<ValuableItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [minimum, setMinimum] = useState("10");
  const [search, setSearch] = useState("");
  const [sound, setSound] = useState("6");
  const [volume, setVolume] = useState("160");
  const [effect, setEffect] = useState("Yellow");
  const [minimapColor, setMinimapColor] = useState("Yellow");
  const [fontSize, setFontSize] = useState("38");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    cachedJson<League[]>(API + "/leagues")
      .then(data => {
        if (!active) return;
        setLeagues(data);
        const preferred = data.find(entry => /covens/i.test(entry.id + " " + entry.name)) ?? data[0];
        if (preferred) setLeague(preferred.id);
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar as ligas."); });
    return () => { active = false; };
  }, []);

  async function loadMarket() {
    if (!league) return;
    setLoading(true); setError(""); setStatus("");
    try {
      const [currency, fragments] = await Promise.all(
        (["Currency", "Fragment"] as const).map(type =>
          cachedJson<CurrencyResponse>(API + "/stash/current/currency/overview?league=" + encodeURIComponent(league) + "&type=" + type)
        )
      );
      const merged = [
        ...(currency.lines ?? []).map(line => ({ id: "Currency:" + line.currencyTypeName, name: line.currencyTypeName, chaosValue: Number(line.chaosEquivalent) || 0, category: "Currency" as const })),
        ...(fragments.lines ?? []).map(line => ({ id: "Fragment:" + line.currencyTypeName, name: line.currencyTypeName, chaosValue: Number(line.chaosEquivalent) || 0, category: "Fragment" as const })),
      ].filter(item => item.name && Number.isFinite(item.chaosValue)).sort((a, b) => b.chaosValue - a.chaosValue);
      setItems(merged);
      const floor = Number(minimum) || 0;
      setSelected(merged.filter(item => item.chaosValue >= floor).map(item => item.id));
      setStatus(merged.length + " itens recebidos de poe.ninja. Valores em Chaos Orbs.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao consultar poe.ninja.");
    } finally { setLoading(false); }
  }

  const selectedItems = useMemo(() => items.filter(item => selected.includes(item.id)), [items, selected]);
  const visibleItems = useMemo(() => items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    item.chaosValue >= (Number(minimum) || 0)
  ), [items, minimum, search]);

  function addSelected() {
    if (!selectedItems.length) return;
    const existing = new Set(Array.from(source.matchAll(/^\\s*BaseType\\s+"((?:[^"\\\\]|\\\\.)*)"/gim), match => match[1].replace(/\\\\(["\\\\])/g, "$1").toLowerCase()));
    const fresh = selectedItems.filter(item => !existing.has(item.name.toLowerCase()));
    if (!fresh.length) { setStatus("Os itens selecionados já possuem regras no filtro."); return; }
    const block = fresh.map(item => makeValuableRule(item, {
      sound: Number(sound), volume: Math.max(0, Math.min(300, Number(volume) || 0)),
      effect, minimapColor, fontSize: Math.max(18, Math.min(45, Number(fontSize) || 38)),
    })).join("\\n");
    const firstRule = source.search(/^(?:Show|Hide|Minimal)\\s*$/im);
    const insertion = firstRule < 0 ? source.trimEnd() + (source.trim() ? "\\n\\n" : "") + block
      : source.slice(0, firstRule).trimEnd() + (source.slice(0, firstRule).trim() ? "\\n\\n" : "") + block + "\\n\\n" + source.slice(firstRule);
    setSource(insertion);
    setStatus(fresh.length + " regra(s) adicionada(s). Edite-as no editor visual ou na aba Código.");
  }

  return (
    <section className="market-valuables" aria-label="Itens valiosos do poe.ninja">
      <div className="market-head">
        <div><span className="panel-kicker">ECONOMIA DA LIGA · POE.NINJA</span><h3>Adicionar itens valiosos</h3></div>
        <a href="https://poe.ninja/poe1/economy/covens/currency" target="_blank" rel="noreferrer">Abrir poe.ninja ↗</a>
      </div>
      <p>Consulte preços da liga e crie regras específicas para os drops mais valiosos. Cada regra já recebe som, feixe colorido, ícone no minimapa e destaque visual; tudo continua editável no filtro.</p>
      <div className="market-load-row">
        <select aria-label="Liga do poe.ninja" value={league} onChange={event => setLeague(event.target.value)}>
          {leagues.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
        <button className="button primary" onClick={() => void loadMarket()} disabled={!league || loading}>{loading ? "Consultando..." : "Atualizar preços"}</button>
      </div>
      <div className="market-settings">
        <label>Preço mínimo (chaos)<input type="number" min="0" step="1" value={minimum} onChange={event => setMinimum(event.target.value)} /></label>
        <label>Som<select value={sound} onChange={event => setSound(event.target.value)}><option value="0">Sem som</option>{[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => <option key={n} value={n}>Som {n}</option>)}</select></label>
        <label>Volume<input type="number" min="0" max="300" value={volume} onChange={event => setVolume(event.target.value)} /></label>
        <label>Brilho / feixe<select value={effect} onChange={event => setEffect(event.target.value)}>{["Yellow","Orange","Red","Green","Blue","Purple","White","None"].map(v => <option key={v} value={v}>{v === "None" ? "Sem feixe" : v}</option>)}</select></label>
        <label>Cor do minimapa<select value={minimapColor} onChange={event => setMinimapColor(event.target.value)}>{["Yellow","Orange","Red","Green","Blue","Purple","White"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Tamanho do texto<input type="number" min="18" max="45" value={fontSize} onChange={event => setFontSize(event.target.value)} /></label>
      </div>
      {error && <p className="market-error">{error} Verifique a conexão ou tente novamente mais tarde. A API pública pode mudar e pode limitar requisições.</p>}
      {status && <p className="market-status">{status}</p>}
      {items.length > 0 && <>
        <div className="market-list-toolbar">
          <input aria-label="Buscar item" placeholder="Buscar moeda ou fragmento..." value={search} onChange={event => setSearch(event.target.value)} />
          <button className="mini-add" onClick={() => setSelected(visibleItems.map(item => item.id))}>Selecionar acima do mínimo</button>
          <span>{selectedItems.length} selecionados</span>
        </div>
        <div className="market-items">
          {visibleItems.map(item => <label className="market-item" key={item.id}>
            <input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />
            <span className="market-item-name">{item.name}<small>{item.category === "Fragment" ? "Fragmentos" : "Moeda"}</small></span>
            <b>{item.chaosValue.toFixed(1)} c</b>
          </label>)}
          {visibleItems.length === 0 && <div className="empty-state">Nenhum item atende ao preço mínimo e à busca.</div>}
        </div>
        <button className="button primary market-add-button" onClick={addSelected} disabled={!selectedItems.length}>＋ Adicionar {selectedItems.length} item(ns) ao filtro</button>
      </>}
      <small className="market-footnote">Dados de economia fornecidos por poe.ninja; preços são estimativas e podem variar. Atualização manual e cache local de 10 minutos para evitar consultas excessivas. As regras são inseridas antes das demais para que o destaque não seja neutralizado por regras genéricas de ocultação.</small>
    </section>
  );
}
