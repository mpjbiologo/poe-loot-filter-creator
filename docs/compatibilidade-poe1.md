# Compatibilidade de sintaxe — PoE1

## Fonte normativa

A página oficial de filtros de itens da Grinding Gear Games é a referência primária:
https://www.pathofexile.com/item-filter/about

Ela documenta blocos, operadores, condições e ações. A documentação também identifica explicitamente algumas condições como exclusivas do PoE2. Esses identificadores não devem ser oferecidos como recursos PoE1 apenas porque aparecem na mesma página.

## Decisões do parser inicial

- Reconhece blocos `Show`, `Hide` e `Minimal`.
- Mantém a ordem original dos blocos.
- Preserva comentários e linhas vazias.
- Mantém linhas desconhecidas sem reescrevê-las.
- Mantém diretivas `Import` encontradas fora dos blocos.
- Emite aviso para conteúdo não reconhecido fora de um bloco.

## Limitações conhecidas

O parser atual é um primeiro passo para importação sem perda de texto, não um validador completo da gramática. Ainda não verifica todos os nomes de condições, tipos de argumentos, valores permitidos, compatibilidade de liga Ruthless ou a semântica de `Continue` e `Import`.

A próxima etapa é criar um catálogo versionado de comandos do PoE1 e validar cada condição e ação com regras de argumentos tipados. A lista de recursos PoE2 deve ficar explicitamente excluída do catálogo PoE1.

## Referências complementares

- PoE Wiki — guia da sintaxe: https://www.poewiki.net/wiki/Guide:Item_filter_guide
- Exemplo real de filtro PoE1: https://github.com/Ambient-Impact/Path-of-Exile-item-filter/blob/main/Ambient.Impact.NewLeague.filter
