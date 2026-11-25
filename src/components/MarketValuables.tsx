import { useEffect, useMemo, useState } from "react";

type League = { id: string; name: string };
type ValuableItem = {
  id: string;
  name: string;
  chaosValue: number;
  category: "Currency" | "Fragment";
};
type MarketSnapshot = {
  schemaVersion: number;
  generatedAt: string;
  league: League;
  items: ValuableItem[];
};

const SNAPSHOT_URL = "https://raw.githubusercontent.com/mpjbiologo/poe-loot-filter-creator/market-data/poe-ninja-market.json";
const CACHE_MS = 10 * 60 * 1000;
const CACHE_KEY = "poe-filter-forge-poeninja-snapshot-v2";

async function loadSnapshot(force = false): Promise<MarketSnapshot> {
  if (!force) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { savedAt: number; data: MarketSnapshot };
        if (Date.now() - parsed.savedAt < CACHE_MS) return parsed.data;
      }
    } catch { /* Cache inválido: buscar novamente. */ }
  }

  const response = await fetch(SNAPSHOT_URL, { cache: "no-cache", headers: { Accept: "application/json" } });
  if (response.status === 404) {
    throw new Error("A primeira atualização dos dados ainda não foi concluída. Aguarde alguns minutos e tente novamente.");
  }
  if (!response.ok) throw new Error("O espelho de dados respondeu com HTTP " + response.status + ".");
  const data = await response.json() as MarketSnapshot;
  if (!data.league || !Array.isArray(data.items)) {
    throw new Error("O arquivo de dados recebido está incompleto. Tente novamente mais tarde.");
  }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* Cache opcional. */ }
  return data;
}

function quoteFilter(value: string): string {
  return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function makeValuableRule(item: ValuableItem, settings: {
  sound: number; volume: number; effect: string; minimapColor: string; fontSize: number;
}): string {
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

  async function loadMarket(force = false) {
    setLoading(true); setError(""); setStatus("");
    try {
      const snapshot = await loadSnapshot(force);
      setLeagues([snapshot.league]);
      setLeague(snapshot.league.id);
      setItems(snapshot.items);
      const floor = Number(minimum) || 0;
      setSelected(snapshot.items.filter(item => item.chaosValue >= floor).map(item => item.id));
      const updatedAt = new Date(snapshot.generatedAt);
      const dateLabel = Number.isNaN(updatedAt.getTime()) ? "horário não informado" : updatedAt.toLocaleString("pt-BR");
      setStatus(snapshot.items.length + " itens disponíveis · " + snapshot.league.name + " · dados coletados em " + dateLabel + ".");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados de mercado.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadMarket(); }, []);

  const selectedItems = useMemo(() => items.filter(item => selected.includes(item.id) && item.chaosValue >= (Number(minimum) || 0)), [items, selected, minimum]);
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
        <select aria-label="Liga do poe.ninja" value={league} disabled>
          {leagues.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          {!league && <option value="">Carregando liga...</option>}
        </select>
        <button className="button primary" onClick={() => void loadMarket(true)} disabled={loading}>{loading ? "Consultando..." : "Atualizar preços"}</button>
      </div>
      <div className="market-settings">
        <label>Preço mínimo (chaos)<input type="number" min="0" step="1" value={minimum} onChange={event => setMinimum(event.target.value)} /></label>
        <label>Som<select value={sound} onChange={event => setSound(event.target.value)}><option value="0">Sem som</option>{[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => <option key={n} value={n}>Som {n}</option>)}</select></label>
        <label>Volume<input type="number" min="0" max="300" value={volume} onChange={event => setVolume(event.target.value)} /></label>
        <label>Brilho / feixe<select value={effect} onChange={event => setEffect(event.target.value)}>{["Yellow","Orange","Red","Green","Blue","Purple","White","None"].map(v => <option key={v} value={v}>{v === "None" ? "Sem feixe" : v}</option>)}</select></label>
        <label>Cor do minimapa<select value={minimapColor} onChange={event => setMinimapColor(event.target.value)}>{["Yellow","Orange","Red","Green","Blue","Purple","White"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Tamanho do texto<input type="number" min="18" max="45" value={fontSize} onChange={event => setFontSize(event.target.value)} /></label>
      </div>
      {error && <p className="market-error">{error} Os preços são publicados automaticamente pelo GitHub Actions. Se o problema persistir, tente novamente em alguns minutos.</p>}
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
      <small className="market-footnote">Dados de economia fornecidos por poe.ninja. Um serviço automático coleta a liga ativa e atualiza este espelho a cada 20 minutos; o navegador consulta apenas o arquivo estático no GitHub, evitando bloqueios CORS e requisições diretas por usuário. Preços são estimativas e podem variar.</small>
    </section>
  );
}
