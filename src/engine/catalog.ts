/**
 * Catálogo de sintaxe documentada para Path of Exile 1.
 * Fonte normativa: https://www.pathofexile.com/item-filter/about
 * Snapshot consultado em 2026-11-18. Não representa uma garantia de que
 * todo valor contextual (nomes de bases, mods, classes etc.) seja validado.
 */

export const CATALOG_VERSION = "poe1-2026-11-18";

export type ValueKind = "boolean" | "number" | "text" | "enum" | "socket-pattern";
export type FilterOperator = "=" | "!" | "!=" | "<=" | ">=" | "<" | ">" | "==";

export interface ConditionDefinition {
  name: string;
  valueKind: ValueKind;
  description: string;
  operators: readonly FilterOperator[];
  values?: readonly string[];
  numericRange?: readonly [number, number];
  example: string;
}

const equalityOperators = ["=", "!", "!=", "=="] as const;
const numericOperators = allOperators;

export const FILTER_OPERATORS = [
  { token: "=", label: "Igual" },
  { token: "!", label: "Diferente (forma alternativa)" },
  { token: "!=", label: "Diferente" },
  { token: "<=", label: "Menor ou igual" },
  { token: ">=", label: "Maior ou igual" },
  { token: "<", label: "Menor que" },
  { token: ">", label: "Maior que" },
  { token: "==", label: "Correspondência exata" },
] as const satisfies readonly { token: FilterOperator; label: string }[];

const bool = (name: string, description: string): ConditionDefinition => ({
  name, valueKind: "boolean", description, operators: equalityOperators,
  values: ["True", "False"], example: name + " True",
});
const numeric = (name: string, description: string): ConditionDefinition => ({
  name, valueKind: "number", description, operators: numericOperators,
  example: name + " >= 10",
});
const text = (name: string, description: string, exampleValue = "Example"): ConditionDefinition => ({
  name, valueKind: "text", description, operators: equalityOperators,
  example: name + ' "' + exampleValue + '"',
});

export const POE1_CONDITIONS: readonly ConditionDefinition[] = [
  bool("AlternateQuality", "Filtra gemas com qualidade alternativa."),
  bool("AnyEnchantment", "Filtra itens encantados."),
  text("ArchnemesisMod", "Filtra pelo nome do modificador Archnemesis.", "Toxic"),
  numeric("AreaLevel", "Nível da área onde o item caiu."),
  numeric("BaseArmour", "Armadura-base do item."),
  numeric("BaseDefencePercentile", "Percentil das defesas-base."),
  numeric("BaseEnergyShield", "Escudo de energia-base."),
  numeric("BaseEvasion", "Evasão-base."),
  text("BaseType", "Nome do tipo-base do item.", "Thicket Bow"),
  numeric("BaseWard", "Ward-base do item."),
  bool("BlightedMap", "Filtra mapas Blighted."),
  text("Class", "Nome da classe do item.", "Currency"),
  bool("Corrupted", "Filtra itens corrompidos ou não corrompidos."),
  numeric("CorruptedMods", "Quantidade de modificadores corrompidos."),
  numeric("DropLevel", "Nível mínimo de drop do item."),
  bool("ElderItem", "Filtra itens influenciados pelo Elder."),
  bool("ElderMap", "Filtra mapas com ou sem influência Elder."),
  text("EnchantmentPassiveNode", "Tipo de encantamento de Cluster Jewels.", "Damage over Time"),
  numeric("EnchantmentPassiveNum", "Quantidade de passivas adicionadas por encantamento."),
  bool("Exceptional", "Filtra gemas Exceptional."),
  bool("Fated", "Filtra itens Fated."),
  bool("Foulborn", "Filtra itens Foulborn."),
  bool("FracturedItem", "Filtra itens fraturados."),
  numeric("GemLevel", "Nível da gema."),
  bool("HasCruciblePassiveTree", "Filtra itens com árvore passiva Crucible."),
  numeric("HasEaterOfWorldsImplicit", "Tier do modificador implícito Eater of Worlds (1–6)."),
  text("HasEnchantment", "Filtra por encantamento; aceita quantidade ou nome.", "Enchantment Bane Damage 2"),
  text("HasExplicitMod", "Filtra por nome de modificador explícito; aceita quantidade e nomes."),
  bool("HasImplicitMod", "Filtra itens que possuem ao menos um modificador implícito."),
  { name: "HasInfluence", valueKind: "enum", description: "Influência do item.",
    operators: equalityOperators, values: ["Shaper", "Elder", "Crusader", "Hunter", "Redeemer", "Warlord", "None"], example: "HasInfluence Shaper" },
  numeric("HasSearingExarchImplicit", "Tier do modificador implícito Searing Exarch (1–6)."),
  numeric("Height", "Altura do item no inventário."),
  bool("Identified", "Filtra itens identificados."),
  bool("Imbued", "Filtra gemas imbued."),
  bool("Mirrored", "Filtra itens espelhados."),
  numeric("ItemLevel", "Nível do item."),
  numeric("LinkedSockets", "Tamanho do maior grupo de soquetes conectados."),
  numeric("MapTier", "Tier do mapa."),
  bool("MirageMap", "Filtra Mirage Maps."),
  numeric("Quality", "Qualidade do item."),
  { name: "Rarity", valueKind: "enum", description: "Raridade do item.",
    operators: numericOperators, values: ["Normal", "Magic", "Rare", "Unique"], example: "Rarity >= Rare" },
  bool("Replica", "Filtra itens únicos Replica."),
  bool("Scourged", "Filtra itens Scourged."),
  bool("ShapedMap", "Filtra mapas Shaped."),
  bool("ShaperItem", "Filtra itens influenciados pelo Shaper."),
  { name: "SocketGroup", valueKind: "socket-pattern", description: "Grupo de soquetes conectados; aceita quantidade e cores.",
    operators: numericOperators, values: ["R", "G", "B", "A", "D", "W"], example: "SocketGroup >= 5GGG" },
  { name: "Sockets", valueKind: "socket-pattern", description: "Quantidade e cores dos soquetes.",
    operators: numericOperators, values: ["R", "G", "B", "A", "D", "W"], example: "Sockets >= 5GGG" },
  numeric("StackSize", "Tamanho da pilha (Currency)."),
  bool("SynthesisedItem", "Filtra itens sintetizados."),
  { name: "TransfiguredGem", valueKind: "text", description: "Filtra gemas transfiguradas pelo nome; True corresponde a qualquer gema transfigurada.",
    operators: equalityOperators, values: ["True", "False"], example: 'TransfiguredGem "Leap Slam"' },
  bool("TwiceCorrupted", "Filtra itens corrompidos duas vezes."),
  bool("UberBlightedMap", "Filtra Blight-Ravaged Maps."),
  numeric("UnidentifiedItemTier", "Tier do item não identificado."),
  bool("Vestigial", "Filtra itens Vestigial."),
  numeric("Width", "Largura do item no inventário."),
  bool("ZanaMemory", "Filtra mapas Zana Memory."),
] as const;

export interface ActionDefinition {
  name: string;
  category: "style" | "sound" | "minimap" | "effect" | "behavior";
  description: string;
  arguments: readonly { name: string; type: string; range?: string; optional?: boolean; default?: string; values?: readonly string[] }[];
  example: string;
}

const rgb = ["0–255", "0–255", "0–255", "0–255 (alpha opcional)"] as const;
const colours = ["Red", "Green", "Blue", "Brown", "White", "Yellow", "Cyan", "Grey", "Orange", "Pink", "Purple"] as const;

export const POE1_ACTIONS: readonly ActionDefinition[] = [
  { name: "SetBackgroundColor", category: "style", description: "Define a cor de fundo do rótulo.",
    arguments: [{ name: "Red", type: "number", range: rgb[0] }, { name: "Green", type: "number", range: rgb[1] }, { name: "Blue", type: "number", range: rgb[2] }, { name: "Alpha", type: "number", range: rgb[3], optional: true, default: "240" }],
    example: "SetBackgroundColor 255 255 255 255" },
  { name: "SetBorderColor", category: "style", description: "Define a cor da borda do rótulo.",
    arguments: [{ name: "Red", type: "number", range: rgb[0] }, { name: "Green", type: "number", range: rgb[1] }, { name: "Blue", type: "number", range: rgb[2] }, { name: "Alpha", type: "number", range: rgb[3], optional: true, default: "255" }],
    example: "SetBorderColor 255 0 0" },
  { name: "SetTextColor", category: "style", description: "Define a cor do texto. Em filtros Ruthless, alpha deve ser 80 ou superior.",
    arguments: [{ name: "Red", type: "number", range: rgb[0] }, { name: "Green", type: "number", range: rgb[1] }, { name: "Blue", type: "number", range: rgb[2] }, { name: "Alpha", type: "number", range: rgb[3], optional: true, default: "255" }],
    example: "SetTextColor 0 0 0" },
  { name: "SetFontSize", category: "style", description: "Define o tamanho da fonte do rótulo.",
    arguments: [{ name: "Size", type: "number", range: "1–45" }], example: "SetFontSize 30" },
  { name: "PlayAlertSound", category: "sound", description: "Reproduz um alerta sonoro integrado.",
    arguments: [{ name: "Id", type: "number", range: "1–16" }, { name: "Volume", type: "number", range: "0–300", optional: true, default: "50" }],
    example: "PlayAlertSound 1 100" },
  { name: "PlayAlertSoundPositional", category: "sound", description: "Reproduz o alerta na posição 3D do item.",
    arguments: [{ name: "Id", type: "number", range: "1–16" }, { name: "Volume", type: "number", range: "0–300", optional: true, default: "50" }],
    example: "PlayAlertSoundPositional 16 50" },
  { name: "CustomAlertSound", category: "sound", description: "Reproduz arquivo de áudio personalizado; aceita vários arquivos separados por ponto e vírgula.",
    arguments: [{ name: "File", type: "file path" }, { name: "Volume", type: "number", range: "0–300", optional: true, default: "100" }],
    example: 'CustomAlertSound "Map.mp3"' },
  { name: "CustomAlertSoundOptional", category: "sound", description: "Como CustomAlertSound, mas ignora o comando se o arquivo não existir.",
    arguments: [{ name: "File", type: "file path" }, { name: "Volume", type: "number", range: "0–300", optional: true, default: "100" }],
    example: 'CustomAlertSoundOptional "Map.mp3"' },
  ...(["DisableDropSound", "EnableDropSound", "DisableDropSoundIfAlertSound", "EnableDropSoundIfAlertSound"] as const).map(name => ({
    name, category: "behavior" as const, description: "Controla o som padrão de queda dos itens.",
    arguments: [], example: name,
  })),
  { name: "MinimapIcon", category: "minimap", description: "Exibe um ícone no minimapa.",
    arguments: [{ name: "Size", type: "number", range: "0–2 (desativar: -1)" }, { name: "Colour", type: "enum", values: colours }, { name: "Shape", type: "enum", values: ["Circle", "Diamond", "Hexagon", "Square", "Star", "Triangle", "Cross", "Moon", "Raindrop", "Kite", "Pentagon", "UpsideDownHouse"] }],
    example: "MinimapIcon 2 Cyan Diamond" },
  { name: "PlayEffect", category: "effect", description: "Exibe um feixe colorido acima do item; Temp limita o efeito ao momento do drop.",
    arguments: [{ name: "Colour", type: "enum", values: colours }, { name: "Duration", type: "enum", values: ["Temp"], optional: true }],
    example: "PlayEffect Red Temp" },
] as const;

export const POE1_BLOCKS = [
  { name: "Show", description: "Mostra itens correspondentes; bloco padrão." },
  { name: "Hide", description: "Oculta itens correspondentes; apenas filtros Normal." },
  { name: "Minimal", description: "Aplica rótulo mínimo e fundo transparente; apenas Ruthless." },
] as const;

export const POE1_DIRECTIVES = [
  { name: "Continue", description: "Permite continuar avaliando regras após correspondência neste bloco.", example: "Continue" },
  { name: "Import", description: "Importa outro filtro; aceita Optional após o nome do arquivo.", example: 'Import "extra.filter" Optional' },
] as const;

/** Entradas explicitamente marcadas como PoE2-only na documentação oficial consultada. */
export const EXCLUDED_POE2_CONDITIONS = [
  { name: "AlwaysShow", reason: "Marcada como PoE2-only na documentação oficial." },
  { name: "HasVaalUniqueMod", reason: "Marcada como PoE2-only na documentação oficial." },
  { name: "IsVaalUnique", reason: "Marcada como PoE2-only na documentação oficial." },
  { name: "WaystoneTier", reason: "Marcada como PoE2-only na documentação oficial." },
] as const;

export function findCondition(name: string): ConditionDefinition | undefined {
  return POE1_CONDITIONS.find(item => item.name.toLowerCase() === name.toLowerCase());
}

export function findAction(name: string): ActionDefinition | undefined {
  return POE1_ACTIONS.find(item => item.name.toLowerCase() === name.toLowerCase());
}
