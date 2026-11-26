import { useEffect, useMemo, useState } from "react";

type Item = { id: string; name: string; category: string; chaosValue?: number; baseType?: string; className?: string; base?: boolean };
type Setting = { mode: "default" | "show" | "hide"; text: string; border: string; background: string; font: number; sound: number; volume: number; effect: string; mapColor: string; mapShape: string; mapSize: number; minLevel: string; sockets: string; links: string; socketGroup: string };
type Snapshot = { generatedAt?: string; league?: { id: string; name: string }; items?: { id: string; name: string; chaosValue: number; category: string }[] };
type Props = { source: string; setSource: (value: string) => void };

const SNAPSHOT_URL = "https://raw.githubusercontent.com/mpjbiologo/poe-loot-filter-creator/market-data/poe-ninja-market.json";
const CATEGORIES = [
  ["currency","Moedas","Currency"],["fragment","Fragmentos","Fragment"],["essence","Essências","Essence"],
  ["fossil","Fósseis","Fossil"],["resonator","Ressonadores","Resonator"],["oil","Óleos","Oil"],
  ["card","Cartas divinatórias","DivinationCard"],["delirium","Orbes delirium","DeliriumOrb"],["thread","Threads","Thread"],
  ["tattoo","Tatuagens","Tattoo"],["omen","Presságios","Omen"],["runegraft","Runegrafts","Runegraft"],
  ["allflame","Brasas Allflame","AllflameEmber"],["djinncoin","Moedas Djinn","DjinnCoin"],["ducat","Ducats","Ducat"],
  ["crystal","Cristais Enshrouding","EnshroudingCrystal"],["artifact","Artefatos","Artifact"],["astrolabe","Astrolábios","Astrolabe"],
  ["map","Mapas","Map"],["blightedmap","Mapas Blighted","BlightedMap"],["blightravagedmap","Mapas Blight-ravaged","BlightRavagedMap"],
  ["uniquemap","Mapas únicos","UniqueMap"],["valdomap","Mapas de Valdo","ValdoMap"],["invitation","Convites","Invitation"],
  ["memory","Memórias","Memory"],["temple","Templos","IncursionTemple"],["scryingorb","Orbes de vidência","ScryingOrb"],
  ["unique","Únicos não identificados","Unique"],["uniqueweapon","Armas únicas","UniqueWeapon"],["uniquearmour","Armaduras únicas","UniqueArmour"],
  ["uniqueaccessory","Acessórios únicos","UniqueAccessory"],["uniqueflask","Frascos únicos","UniqueFlask"],["uniquejewel","Joias únicas","UniqueJewel"],
  ["forbiddenjewel","Joias proibidas","ForbiddenJewel"],["shrinebelt","Cintos de santuário","ShrineBelt"],["uniquetincture","Tinturas únicas","UniqueTincture"],
  ["uniquerelic","Relíquias únicas","UniqueRelic"],["skillgem","Gemas de habilidade","SkillGem"],["imbuedgem","Gemas imbuidas","ImbuedGem"],
  ["clusterjewel","Joias cluster","ClusterJewel"],["base","Bases de equipamento","BaseType"],["flask","Frascos","Flask"],
  ["incubator","Incubadoras","Incubator"],["wombgift","Wombgifts","Wombgift"],["corpse","Cadáveres","Corpse"],
  ["viscera","Vísceras","Viscera"],["beast","Bestas","Beast"],["vial","Viais","Vial"],
] as const;

const STATIC: Record<string, string[]> = {
  Essence: ["Whispering Essence of Greed","Muttering Essence of Greed","Weeping Essence of Greed","Wailing Essence of Greed","Screaming Essence of Greed","Shrieking Essence of Greed","Deafening Essence of Greed","Essence of Contempt","Essence of Hatred","Essence of Wrath","Essence of Anger","Essence of Torment","Essence of Fear","Essence of Sorrow","Essence of Rage","Essence of Scorn","Essence of Envy","Essence of Misery","Essence of Dread","Essence of Insanity","Essence of Horror","Essence of Delirium","Essence of Hysteria","Essence of Insanity"],
  Fossil: ["Aberrant Fossil","Aetheric Fossil","Bound Fossil","Corroded Fossil","Dense Fossil","Enchanted Fossil","Encrusted Fossil","Faceted Fossil","Frigid Fossil","Gilded Fossil","Jagged Fossil","Lucent Fossil","Metallic Fossil","Perfect Fossil","Prismatic Fossil","Pristine Fossil","Sanctified Fossil","Scorched Fossil","Serrated Fossil","Shuddering Fossil","Tangled Fossil","Terror Fossil","Glyphic Fossil","Hollow Fossil","Bloodstained Fossil"],
  Resonator: ["Primitive Chaotic Resonator","Potent Chaotic Resonator","Powerful Chaotic Resonator","Prime Chaotic Resonator"],
  Oil: ["Clear Oil","Sepia Oil","Amber Oil","Verdant Oil","Teal Oil","Azure Oil","Violet Oil","Crimson Oil","Black Oil","Opalescent Oil","Silver Oil","Golden Oil","Reflective Oil"],
  DivinationCard: ["The Apothecary","The Doctor","The House of Mirrors","The Fiend","The Nurse","The Patient","The Fortunate","The Enlightened","The Immortal","Unrequited Love","The Price of Devotion","Seven Years Bad Luck","Brother's Gift","Brother's Stash","The Celestial Justicar","The Cheater","The Saint's Treasure","The Wretched","Rain of Chaos","Loyalty"],
  DeliriumOrb: ["Whispering Delirium Orb","Muttering Delirium Orb","Fine Delirium Orb","Singular Delirium Orb","Thaumaturge's Delirium Orb","Blacksmith's Delirium Orb","Armoursmith's Delirium Orb","Jeweller's Delirium Orb","Abrasive Delirium Orb","Foreboding Delirium Orb","Fragmented Delirium Orb","Skittering Delirium Orb","Diviner's Delirium Orb","Primal Delirium Orb","Timeless Delirium Orb"],
  Thread: ["Frayed Thread","Abyss Thread","Bestiary Thread","Betrayal Thread","Blight Thread","Breach Thread","Expedition Thread","Incursion Thread","Legion Thread","Ritual Thread","Ultimatum Thread"],
  Tattoo: ["Honoured Tattoo of the Tuatara","Honoured Tattoo of the Oak","Honoured Tattoo of the Hunter","Honoured Tattoo of the Wise","Honoured Tattoo of the Berserker","Honoured Tattoo of the Warrior","Honoured Tattoo of the Ramako Archer","Honoured Tattoo of the Tasalio Scout","Honoured Tattoo of the Ngamahu Makanga"],
  Omen: ["Omen of Annulment","Omen of Whittling","Omen of Sinistral Erasure","Omen of Dextral Erasure","Omen of Sinistral Alchemy","Omen of Dextral Alchemy","Omen of Fortune","Omen of the Jeweller","Omen of Blanching","Omen of Connections","Omen of Greater Exaltation","Omen of the Blacksmith","Omen of the Jeweller's Touch","Omen of Amelioration","Omen of Resurgence"],
  Runegraft: ["Runegraft of the Fortress","Runegraft of the Bound","Runegraft of the River","Runegraft of the Warp","Runegraft of the Claim"],
  AllflameEmber: ["Allflame Ember of the Mad","Allflame Ember of the Enraged","Allflame Ember of the Insane","Allflame Ember of the Haunted"],
  Map: ["Crimson Temple Map","Dunes Map","Burial Chambers Map","Cemetery Map","Defiled Cathedral Map","Strand Map","City Square Map","Toxic Sewer Map","Beach Map","Coves Map","Conqueror's Map","Shaper's Realm","The Maven's Writ","Maven's Invitation: The Atlas"],
  Gem: ["Empower Support","Enlighten Support","Enhance Support","Awakened Multistrike Support","Awakened Spell Echo Support","Awakened Added Fire Damage Support","Portal","Vaal Haste","Detonate Dead of Chain Reaction"],
  Unique: ["Headhunter","Mageblood","The Squire","Original Sin","Nimis","Kalandra's Touch","Progenesis","The Light of Meaning","Forbidden Shako","Rakiata's Dance","Dying Sun","Taste of Hate","The Brass Dome","Replica Dragonfang's Flight"],
  Special: ["Incubator","Beast","Vial","Corpse","Wombgift","Viscera","Artifact","Djinn Coin","Ducat","Enshrouding Crystal","Astrolabe","Scrying Orb","Memory","Incursion Temple"],
};

const BASE_CLASSES = ["Body Armours","Helmets","Boots","Gloves","Shields","Amulets","Rings","Belts","Bows","Wands","Staves","Daggers","Claws","One Hand Swords","One Hand Axes","One Hand Maces","Two Hand Swords","Two Hand Axes","Two Hand Maces","Sceptres","Quivers","Jewels","Flasks","Tinctures"];
const COLORS = ["Red","Green","Blue","Brown","White","Yellow","Cyan","Grey","Orange","Pink","Purple"];
const SHAPES = ["Circle","Diamond","Hexagon","Square","Star","Triangle","Cross","Moon","Raindrop","Kite","Pentagon","UpsideDownHouse"];
const DEFAULT_SETTING: Setting = { mode:"default", text:"#F1D17E", border:"#B9964C", background:"#12120F", font:36, sound:0, volume:100, effect:"None", mapColor:"Yellow", mapShape:"Star", mapSize:1, minLevel:"", sockets:"", links:"", socketGroup:"" };

function quote(value: string) { return '"' + value.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '"'; }
function rgb(hex: string) { return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)).join(" "); }
function settingKey(item: Item) { return item.id; }
function buildRule(item: Item, setting: Setting): string {
  const conditions = item.className
    ? item.id.startsWith("unique:") ? ['Rarity Unique','Identified False','Class ' + quote(item.className)] : ['Class ' + quote(item.className)]
    : ['BaseType ' + quote(item.baseType ?? item.name)];
  if (item.id.startsWith("unique:")) {
    if (setting.minLevel) conditions.push('ItemLevel >= ' + setting.minLevel);
  } else if (setting.minLevel) conditions.push('ItemLevel >= ' + setting.minLevel);
  if (item.base) {
    if (setting.sockets) conditions.push('Sockets >= ' + setting.sockets);
    if (setting.links) conditions.push('LinkedSockets >= ' + setting.links);
    if (setting.socketGroup) conditions.push('SocketGroup >= ' + setting.socketGroup);
  }
  const lines = [setting.mode === "hide" ? "Hide" : "Show", ...conditions.map(x => "    " + x)];
  if (setting.mode !== "hide") {
    lines.push("    SetTextColor " + rgb(setting.text));
    lines.push("    SetBorderColor " + rgb(setting.border));
    lines.push("    SetBackgroundColor " + rgb(setting.background) + " 230");
    lines.push("    SetFontSize " + Math.max(1,Math.min(45,setting.font)));
    if (setting.sound) lines.push("    PlayAlertSound " + setting.sound + " " + setting.volume);
    if (setting.effect !== "None") lines.push("    PlayEffect " + setting.effect + " Temp");
    if (setting.mapSize >= 0) lines.push("    MinimapIcon " + setting.mapSize + " " + setting.mapColor + " " + setting.mapShape);
  }
  return lines.join("\n");
}

export default function CategoryFilterBuilder({ source, setSource }: Props) {
  const [snapshot,setSnapshot] = useState<Snapshot | null>(null);
  const [snapshotError,setSnapshotError] = useState("");
  const [active,setActive] = useState<string>("currency");
  const [query,setQuery] = useState("");
  const [selected,setSelected] = useState<string>("");
  const [settings,setSettings] = useState<Record<string,Setting>>({});
  const [notice,setNotice] = useState("");
  const [bulkMode,setBulkMode] = useState<"show"|"hide">("show");
  const [bulkSound,setBulkSound] = useState(0);
  const [bulkEffect,setBulkEffect] = useState("None");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("poe-filter-forge-item-settings-v1");
      if (saved) setSettings(JSON.parse(saved) as Record<string,Setting>);
    } catch { /* configuração local opcional */ }
    fetch(SNAPSHOT_URL).then(response => {
      if (!response.ok) throw new Error("Dados de mercado indisponíveis.");
      return response.json() as Promise<Snapshot>;
    }).then(data => setSnapshot(data)).catch(error => setSnapshotError(error instanceof Error ? error.message : "Falha ao consultar poe.ninja."));
  }, []);

  useEffect(() => {
    try { localStorage.setItem("poe-filter-forge-item-settings-v1",JSON.stringify(settings)); } catch { /* armazenamento local opcional */ }
  },[settings]);

  const category = CATEGORIES.find(item => item[0] === active) ?? CATEGORIES[0];
  const items = useMemo<Item[]>(() => {
    if (active === "base") return BASE_CLASSES.map(name => ({id:"base:"+name,name,category:"Base",className:name,base:true}));
    if (active === "unique") return BASE_CLASSES.filter(name => !["Quivers","Tinctures"].includes(name)).map(name => ({id:"unique:"+name,name:"Únicos não identificados · "+name,category:"Unique",className:name}));
    const type = category[2];
    const live = snapshot?.items?.filter(item => item.category === type).map(item => ({...item,category:type})) ?? [];
    const staticItems = (STATIC[type] ?? []).map(name => ({id:type+":"+name,name,category:type}));
    const merged = new Map<string,Item>();
    [...staticItems,...live].forEach(item => merged.set(item.name.toLowerCase(),item));
    return [...merged.values()].sort((a,b) => (b.chaosValue ?? 0)-(a.chaosValue ?? 0) || a.name.localeCompare(b.name));
  },[active,category,snapshot]);

  const visible = useMemo(() => items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())),[items,query]);
  const activeSetting = selected ? settings[selected] ?? DEFAULT_SETTING : DEFAULT_SETTING;
  const enabledCount = items.filter(item => (settings[settingKey(item)] ?? DEFAULT_SETTING).mode !== "default").length;

  function updateSetting(key:string,patch:Partial<Setting>) {
    setSettings(current => ({...current,[key]:{...(current[key] ?? DEFAULT_SETTING),...patch}}));
  }
  function selectItem(item:Item) { setSelected(settingKey(item)); }
  function applyBulk() {
    const patch = {mode:bulkMode,sound:bulkSound,effect:bulkEffect} as Partial<Setting>;
    setSettings(current => {
      const next = {...current};
      visible.forEach(item => { next[item.id] = {...(next[item.id] ?? DEFAULT_SETTING),...patch}; });
      return next;
    });
    setNotice("Configuração aplicada aos " + visible.length + " itens exibidos nesta categoria.");
  }
  function applyToFilter() {
    const configured = Object.entries(settings).filter(([,setting]) => setting.mode !== "default");
    if (!configured.length) { setNotice("Configure pelo menos um item antes de aplicar."); return; }
    const itemMap = new Map<string,Item>();
    CATEGORIES.forEach(cat => {
      if (cat[0] === "base") BASE_CLASSES.forEach(name => itemMap.set("base:"+name,{id:"base:"+name,name,category:"Base",className:name,base:true}));
      else if (cat[0] === "unique") BASE_CLASSES.filter(name => !["Quivers","Tinctures"].includes(name)).forEach(name => itemMap.set("unique:"+name,{id:"unique:"+name,name:"Únicos não identificados · "+name,category:"Unique",className:name}));
      else {
        (STATIC[cat[2]] ?? []).forEach(name => itemMap.set(cat[2]+":"+name,{id:cat[2]+":"+name,name,category:cat[2]}));
        snapshot?.items?.filter(item => item.category === cat[2]).forEach(item => itemMap.set(item.id,{...item,category:cat[2]}));
      }
    });
    const rules = configured.map(([id,setting]) => {
      const item = itemMap.get(id);
      return item ? buildRule(item,setting) : "";
    }).filter(Boolean);
    const startMarker = "# === POE FILTER FORGE: CATEGORY ITEM RULES ===";
    const endMarker = "# === END POE FILTER FORGE: CATEGORY ITEM RULES ===";
    const block = [startMarker,"# Regras geradas pelo configurador por categoria.",...rules,endMarker].join("\n");
    const start = source.indexOf(startMarker);
    let clean = source;
    if (start >= 0) {
      const end = source.indexOf(endMarker,start);
      clean = end >= 0 ? source.slice(0,start) + source.slice(end+endMarker.length).replace(/^\s*\n/,"") : source.slice(0,start);
    }
    const first = clean.search(/^(?:Show|Hide|Minimal)\s*$/im);
    const next = first >= 0 ? clean.slice(0,first).trimEnd()+"\n\n"+block+"\n\n"+clean.slice(first) : clean.trimEnd()+"\n\n"+block+"\n";
    setSource(next);
    setNotice(rules.length+" regras adicionadas ao filtro. As regras individuais foram posicionadas antes das regras genéricas.");
  }

  return (
    <section className="category-builder">
      <div className="category-builder-heading">
        <div><span className="eyebrow-soft">CONFIGURADOR VISUAL</span><h2>Monte seu filtro por categorias</h2><p>Abra uma categoria, escolha um item e defina exatamente como ele deve aparecer no chão.</p></div>
        <div className="builder-summary"><b>{Object.values(settings).filter(s=>s.mode!=="default").length}</b><span>itens personalizados</span></div>
      </div>
      <div className="category-layout">
        <nav className="category-nav" aria-label="Categorias de itens">
          {CATEGORIES.map(([id,label]) => <button key={id} className={active===id?"category-tab active":"category-tab"} onClick={()=>{setActive(id);setQuery("");setSelected("");}}>
            <span className="category-icon">{id==="currency"?"◈":id==="fragment"?"✧":id==="essence"?"✺":id==="fossil"?"⬡":id==="resonator"?"◎":id==="oil"?"◉":id==="card"?"▤":id==="delirium"?"◌":id==="thread"?"⌁":id==="unique"?"◆":id==="base"?"▣":"✦"}</span>
            <span>{label}</span><small>{id==="currency"||id==="fragment" ? (snapshot?.items?.filter(x=>x.category===CATEGORIES.find(c=>c[0]===id)?.[2]).length ?? "…") : id==="base"||id==="unique" ? BASE_CLASSES.length : STATIC[CATEGORIES.find(c=>c[0]===id)?.[2] ?? ""]?.length ?? "—"}</small>
          </button>)}
        </nav>
        <div className="category-content">
          <div className="category-toolbar">
            <div><span className="eyebrow-soft">CATEGORIA ATIVA</span><h3>{category[1]}</h3><p>{items.length} itens no catálogo{snapshot?.league ? " · Liga "+snapshot.league.name : ""}</p></div>
            <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar item..." aria-label="Buscar item na categoria" />
          </div>
          {active==="currency"||active==="fragment" ? <div className="market-data-note">{snapshot ? "Catálogo atualizado por poe.ninja · "+new Date(snapshot.generatedAt ?? "").toLocaleString("pt-BR") : snapshotError || "Carregando catálogo de mercado..."}</div> : <div className="market-data-note">Catálogo de itens PoE1. Os valores e nomes podem variar conforme atualizações do jogo.</div>}
          <div className="bulk-toolbar">
            <div><b>AÇÃO EM LOTE</b><span>Aplicar aos itens atualmente filtrados</span></div>
            <select value={bulkMode} onChange={event=>setBulkMode(event.target.value as "show"|"hide")}><option value="show">Mostrar</option><option value="hide">Ocultar</option></select>
            <select value={bulkSound} onChange={event=>setBulkSound(Number(event.target.value))}><option value={0}>Sem som</option>{Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>Som {i+1}</option>)}</select>
            <select value={bulkEffect} onChange={event=>setBulkEffect(event.target.value)}><option value="None">Sem efeito</option>{COLORS.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <button onClick={applyBulk}>Aplicar em {visible.length}</button>
          </div>
          <div className="item-config-list">
            {visible.map(item=>{
              const setting=settings[item.id] ?? DEFAULT_SETTING;
              const activeItem=selected===item.id;
              return <button key={item.id} className={"catalog-item "+(activeItem?"selected":"")} onClick={()=>selectItem(item)}>
                <span className="item-state-dot" data-mode={setting.mode}></span>
                <span className="catalog-item-main"><b>{item.name}</b><small>{item.className ? "Classe: "+item.className : item.category}{item.base ? " · sockets, links e item level" : ""}</small></span>
                {item.chaosValue!==undefined && <strong>{item.chaosValue.toFixed(1)} c</strong>}
                <span className="item-mode">{setting.mode==="default"?"Padrão":setting.mode==="show"?"Mostrar":"Ocultar"}</span>
                <span className="item-chevron">›</span>
              </button>;
            })}
            {!visible.length && <div className="empty-state">Nenhum item encontrado nesta categoria.</div>}
          </div>
          {selected && items.find(item=>item.id===selected) && <section className="item-detail">
            <div className="item-detail-head"><div><span className="eyebrow-soft">PERSONALIZAÇÃO INDIVIDUAL</span><h3>{items.find(item=>item.id===selected)?.name}</h3><p>As alterações são salvas automaticamente neste navegador.</p></div><button onClick={()=>setSelected("")}>Fechar ×</button></div>
            <div className="detail-mode-row"><label>Como este item deve aparecer?</label><div className="mode-buttons">
              <button className={activeSetting.mode==="default"?"chosen":""} onClick={()=>updateSetting(selected,{mode:"default"})}>Padrão</button>
              <button className={activeSetting.mode==="show"?"chosen show-mode":""} onClick={()=>updateSetting(selected,{mode:"show"})}>Mostrar</button>
              <button className={activeSetting.mode==="hide"?"chosen hide-mode":""} onClick={()=>updateSetting(selected,{mode:"hide"})}>Ocultar</button>
            </div></div>
            {activeSetting.mode!=="hide" && <div className="detail-grid">
              <label>Cor do texto<input type="color" value={activeSetting.text} onChange={e=>updateSetting(selected,{text:e.target.value})}/></label>
              <label>Cor da borda<input type="color" value={activeSetting.border} onChange={e=>updateSetting(selected,{border:e.target.value})}/></label>
              <label>Cor do fundo<input type="color" value={activeSetting.background} onChange={e=>updateSetting(selected,{background:e.target.value})}/></label>
              <label>Tamanho da fonte<input type="number" min="1" max="45" value={activeSetting.font} onChange={e=>updateSetting(selected,{font:Number(e.target.value)})}/></label>
              <label>Alerta sonoro<select value={activeSetting.sound} onChange={e=>updateSetting(selected,{sound:Number(e.target.value)})}><option value={0}>Sem som</option>{Array.from({length:16},(_,i)=><option key={i+1} value={i+1}>Som {i+1}</option>)}</select></label>
              <label>Volume (0–300)<input type="number" min="0" max="300" value={activeSetting.volume} onChange={e=>updateSetting(selected,{volume:Number(e.target.value)})}/></label>
              <label>Feixe colorido<select value={activeSetting.effect} onChange={e=>updateSetting(selected,{effect:e.target.value})}><option value="None">Sem efeito</option>{COLORS.map(c=><option key={c}>{c}</option>)}</select></label>
              <label>Cor do ícone no minimapa<select value={activeSetting.mapColor} onChange={e=>updateSetting(selected,{mapColor:e.target.value})}>{COLORS.map(c=><option key={c}>{c}</option>)}</select></label>
              <label>Formato do ícone<select value={activeSetting.mapShape} onChange={e=>updateSetting(selected,{mapShape:e.target.value})}>{SHAPES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Tamanho do ícone<select value={activeSetting.mapSize} onChange={e=>updateSetting(selected,{mapSize:Number(e.target.value)})}><option value={-1}>Desativado</option><option value={0}>Pequeno</option><option value={1}>Médio</option><option value={2}>Grande</option></select></label>
              <label>Nível mínimo do item<input type="number" min="1" max="100" placeholder="Opcional" value={activeSetting.minLevel} onChange={e=>updateSetting(selected,{minLevel:e.target.value})}/></label>
              {items.find(item=>item.id===selected)?.base && <>
                <label>Sockets mínimos<input type="number" min="0" max="6" placeholder="Opcional" value={activeSetting.sockets} onChange={e=>updateSetting(selected,{sockets:e.target.value})}/></label>
                <label>Links mínimos<input type="number" min="0" max="6" placeholder="Opcional" value={activeSetting.links} onChange={e=>updateSetting(selected,{links:e.target.value})}/></label>
                <label>Grupo / cores dos sockets<input placeholder="Ex.: 5GGG ou RGB" value={activeSetting.socketGroup} onChange={e=>updateSetting(selected,{socketGroup:e.target.value})}/></label>
              </>}
            </div>}
            <div className="detail-footer"><span>Prévia: <b style={{color:activeSetting.text,background:activeSetting.background,borderColor:activeSetting.border,fontSize:Math.min(activeSetting.font,24)}}>{items.find(item=>item.id===selected)?.name}</b></span><button onClick={()=>updateSetting(selected,{...DEFAULT_SETTING})}>Restaurar padrão</button></div>
          </section>}
          <div className="category-apply-row"><span>{enabledCount} itens configurados nesta sessão. As configurações ficam salvas no dispositivo.</span><button onClick={applyToFilter}>Aplicar configurações ao filtro ↗</button></div>
          {notice && <div className="category-notice" role="status">{notice}</div>}
        </div>
      </div>
    </section>
  );
}
