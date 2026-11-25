export interface FilterPreset {
  id: string;
  name: string;
  level: string;
  description: string;
  useCase: string;
  source: string;
}

const header = (name: string, description: string) =>
  `# PoE Loot Filter Creator — Path of Exile 1
# Preset: ${name}
# ${description}
# Modelo inicial editável. Ajuste as regras ao seu personagem e à liga.
# A ordem das regras importa: exceções importantes aparecem antes dos blocas de ocultação.

`;

export const POE1_PRESETS: readonly FilterPreset[] = [
  {
    id: "leveling",
    name: "Leveling",
    level: "Campanha",
    description: "Mais permissivo: mantém equipamentos, gemas, frascos e bases úteis durante a progressão.",
    useCase: "Personagens em campanha e início de liga.",
    source: header("Leveling", "Filtro permissivo para acompanhar a evolução do personagem.") + `Show
    Class "Currency"
    SetTextColor 255 220 120
    SetBorderColor 220 170 70
    SetFontSize 38
    PlayAlertSound 2 100

Show
    Class "Divination Cards"
    SetTextColor 220 120 255
    SetBorderColor 180 80 220
    SetFontSize 36

Show
    Class "Gems"
    SetTextColor 100 220 180
    SetBorderColor 70 180 150
    SetFontSize 34

Show
    Class "Quest Items"
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 34

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 36

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 40
    PlayAlertSound 6 150
    MinimapIcon 2 Orange Star

Show
    Rarity Rare
    SetTextColor 245 225 120
    SetBorderColor 190 160 70
    SetFontSize 34

Show
    LinkedSockets >= 4
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 34

Show
    SocketGroup >= 3RGB
    SetTextColor 120 255 180
    SetBorderColor 70 190 120
    SetFontSize 34

Show
    Rarity Magic
    SetTextColor 160 190 255
    SetFontSize 30

# No leveling, itens normais permanecem visíveis para avaliar bases e receitas.
`
  },
  {
    id: "semi-restrito",
    name: "Semi-restrito",
    level: "Intermediário",
    description: "Diminui o ruído sem esconder todas as bases normais e mágicas potencialmente úteis.",
    useCase: "Campanha avançada e começo do endgame.",
    source: header("Semi-restrito", "Equilíbrio entre visibilidade e redução de ruído.") + `Show
    Class "Currency"
    SetTextColor 255 220 120
    SetBorderColor 220 170 70
    SetFontSize 38
    PlayAlertSound 2 100

Show
    Class "Divination Cards"
    SetTextColor 220 120 255
    SetBorderColor 180 80 220
    SetFontSize 36

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 36

Show
    Class "Gems"
    SetTextColor 100 220 180
    SetBorderColor 70 180 150
    SetFontSize 32

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 40
    PlayAlertSound 6 150
    MinimapIcon 2 Orange Star

Show
    Rarity Rare
    ItemLevel >= 60
    SetTextColor 245 225 120
    SetBorderColor 190 160 70
    SetFontSize 34

Show
    LinkedSockets >= 5
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 34

Show
    SocketGroup >= 4
    SetTextColor 120 255 180
    SetBorderColor 70 190 120
    SetFontSize 34

Hide
    Rarity Normal
    SetTextColor 130 130 130
    SetFontSize 18

Hide
    Rarity Magic
    SetTextColor 150 150 150
    SetFontSize 18
`
  },
  {
    id: "restrito",
    name: "Restrito",
    level: "Endgame inicial",
    description: "Prioriza moeda, mapas, cartas, únicos e raros com nível de item mais alto.",
    useCase: "Mapas iniciais e personagem já equipado.",
    source: header("Restrito", "Filtro seletivo para reduzir drops de baixo interesse.") + `Show
    Class "Currency"
    SetTextColor 255 220 120
    SetBorderColor 220 170 70
    SetFontSize 40
    PlayAlertSound 2 120
    MinimapIcon 2 Yellow Diamond

Show
    Class "Divination Cards"
    SetTextColor 220 120 255
    SetBorderColor 180 80 220
    SetFontSize 38

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 38

Show
    Class "Gems"
    SetTextColor 100 220 180
    SetBorderColor 70 180 150
    SetFontSize 32

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 40
    PlayAlertSound 6 150
    MinimapIcon 2 Orange Star

Show
    Rarity Rare
    ItemLevel >= 75
    SetTextColor 245 225 120
    SetBorderColor 190 160 70
    SetFontSize 34

Show
    LinkedSockets >= 5
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 34

Show
    SocketGroup >= 4
    SetTextColor 120 255 180
    SetBorderColor 70 190 120
    SetFontSize 34

Hide
    Rarity Normal
    SetTextColor 130 130 130
    SetFontSize 18

Hide
    Rarity Magic
    SetTextColor 150 150 150
    SetFontSize 18

Hide
    Rarity Rare
    SetTextColor 120 120 120
    SetFontSize 18
`
  },
  {
    id: "muito-restrito",
    name: "Muito restrito",
    level: "Endgame",
    description: "Mostra principalmente drops de alto interesse; raros comuns deixam de aparecer.",
    useCase: "Personagens bem equipados e mapas de maior eficiência.",
    source: header("Muito restrito", "Filtro de endgame com foco em drops de maior interesse.") + `Show
    Class "Currency"
    SetTextColor 255 220 120
    SetBorderColor 220 170 70
    SetFontSize 42
    PlayAlertSound 2 140
    MinimapIcon 2 Yellow Diamond

Show
    Class "Divination Cards"
    SetTextColor 220 120 255
    SetBorderColor 180 80 220
    SetFontSize 38

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 38

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 42
    PlayAlertSound 6 160
    MinimapIcon 2 Orange Star

Show
    Rarity Rare
    ItemLevel >= 82
    SetTextColor 245 225 120
    SetBorderColor 190 160 70
    SetFontSize 36

Show
    FracturedItem True
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 36
    PlayEffect Blue Temp

Show
    SocketGroup >= 5
    SetTextColor 120 255 180
    SetBorderColor 70 190 120
    SetFontSize 36

Hide
    Rarity Normal

Hide
    Rarity Magic

Hide
    Rarity Rare
    SetTextColor 110 110 110
    SetFontSize 18
`
  },
  {
    id: "endgame-mapas",
    name: "Endgame / mapas",
    level: "Mapeamento",
    description: "Dá destaque a moeda, mapas, cartas, únicos, itens fraturados e raros de nível alto.",
    useCase: "Sessões de mapas; ajuste tiers e bases conforme sua build.",
    source: header("Endgame / mapas", "Modelo de mapeamento. Não substitui uma curadoria por liga ou build.") + `Show
    Class "Currency"
    SetTextColor 255 225 120
    SetBorderColor 240 180 60
    SetFontSize 42
    PlayAlertSound 2 150
    MinimapIcon 2 Yellow Star

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 40
    MinimapIcon 2 Cyan Diamond

Show
    Class "Divination Cards"
    SetTextColor 220 120 255
    SetBorderColor 180 80 220
    SetFontSize 38

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 42
    PlayAlertSound 6 160
    MinimapIcon 2 Orange Star

Show
    FracturedItem True
    SetTextColor 120 220 255
    SetBorderColor 70 160 220
    SetFontSize 36
    PlayEffect Blue Temp

Show
    Rarity Rare
    ItemLevel >= 84
    SetTextColor 245 225 120
    SetBorderColor 190 160 70
    SetFontSize 36

Show
    LinkedSockets >= 6
    SetTextColor 120 255 180
    SetBorderColor 70 190 120
    SetFontSize 40
    PlayAlertSound 1 120

Hide
    Rarity Normal

Hide
    Rarity Magic

Hide
    Rarity Rare
    SetTextColor 110 110 110
    SetFontSize 18
`
  },
  {
    id: "minimalista-ruthless",
    name: "Minimalista (Ruthless)",
    level: "Ruthless",
    description: "Usa blocos Minimal, próprios do modo Ruthless; não é recomendado para o modo Normal.",
    useCase: "Jogadores que selecionaram explicitamente Ruthless.",
    source: header("Minimalista (Ruthless)", "Este preset usa a sintaxe Minimal; selecione apenas para Ruthless.") + `Show
    Class "Currency"
    SetTextColor 255 220 120
    SetBorderColor 220 170 70
    SetFontSize 38
    PlayAlertSound 2 100

Show
    Class "Maps"
    SetTextColor 130 190 255
    SetBorderColor 80 130 220
    SetFontSize 36

Show
    Rarity Unique
    SetTextColor 255 180 80
    SetBorderColor 255 110 40
    SetFontSize 40
    PlayAlertSound 6 150

Minimal
    Rarity Rare
    SetTextColor 245 225 120
    SetFontSize 30

Minimal
    Rarity Magic
    SetTextColor 160 190 255
    SetFontSize 26

Minimal
    Rarity Normal
    SetTextColor 150 150 150
    SetFontSize 22
`
  }
] as const;
