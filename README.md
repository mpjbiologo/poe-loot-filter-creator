# PoE Loot Filter Creator

Editor visual de filtros de itens para **Path of Exile 1**. Interface inicial em português brasileiro, com arquitetura preparada para internacionalização. PoE2 está fora do escopo desta primeira versão.

## Objetivos do MVP
- Criar e editar regras `Show`, `Hide` e `Minimal` do PoE1.
- Importar e exportar arquivos `.filter`.
- Preservar comentários, diretivas e linhas ainda não interpretadas.
- Validar a estrutura básica sem descartar comandos desconhecidos.
- Editar condições e ações em uma interface visual.
- Manter os dados localmente no navegador.

## Stack
React, TypeScript e Vite. Sem backend obrigatório.

## Desenvolvimento
```bash
npm install
npm run dev
npm run build
npm test
```

## Compatibilidade
A referência primária da sintaxe é a documentação oficial: https://www.pathofexile.com/item-filter/about

O parser inicial é conservador: preserva conteúdo desconhecido como linhas brutas. A validação de comandos e valores será ampliada por etapas e não deve ser interpretada como certificação oficial da Grinding Gear Games.

## Escopo
- Atual: Path of Exile 1.
- Futuro: suporte separado para Path of Exile 2, sem misturar regras entre jogos.

## Licença
A definir.
