# Catálogo de sintaxe — Path of Exile 1

## Fonte e versão

- Fonte normativa: [Grinding Gear Games — About Item Filters](https://www.pathofexile.com/item-filter/about)
- Snapshot consultado: 2026-11-18
- Identificador interno: `poe1-2026-11-18`
- Catálogo no código: `src/engine/catalog.ts`

O catálogo registra condições, ações, blocos, diretivas, operadores, tipos de argumentos, intervalos e exemplos documentados. Nomes de bases, classes, modificadores e arquivos são valores contextuais e não formam listas fechadas.

## Compatibilidade

A documentação oficial reúne conteúdo de PoE1 e PoE2 na mesma página e marca explicitamente algumas entradas como exclusivas do PoE2. Estas entradas ficam fora do catálogo PoE1: `AlwaysShow`, `HasVaalUniqueMod`, `IsVaalUnique` e `WaystoneTier`.

O catálogo inclui os blocos `Show`, `Hide` e `Minimal`; as diretivas `Continue` e `Import`; e as ações de cor, fonte, som, minimapa e efeito descritas pela documentação. `Hide` é restrito a filtros Normal e `Minimal` a filtros Ruthless. `Continue` e `Import` não são blocos.

## Limites desta versão

Este é um catálogo tipado de referência para alimentar o editor e futuras validações, não um validador semântico completo. Alguns comandos têm sintaxe contextual (por exemplo, `HasExplicitMod`, `HasEnchantment`, padrões de soquetes e caminhos de áudio) que exigirá validadores especializados. A aceitação final deve ser conferida no cliente do jogo.

A documentação oficial pode mudar. Ao atualizar o catálogo, revisar a página normativa, registrar nova data/versão e adicionar testes para inclusões e exclusões.

## Referências complementares

- [PoE Wiki — Item filter guide](https://www.poewiki.net/wiki/Guide:Item_filter_guide)
- [Exemplo comunitário de filtro PoE1](https://github.com/Ambient-Impact/Path-of-Exile-item-filter/blob/main/Ambient.Impact.NewLeague.filter)
