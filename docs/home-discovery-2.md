# Home Discovery 2.0

## Fontes e seleção

A Home continua usando `GET /api/discovery/home` para descoberta compartilhada e `GET /api/library` para a jornada pessoal. As capas da descoberta levam a `/games/igdb/:igdbId`; a biblioteca leva a `/games/:gameId`. Abrir a Home não importa jogos nem grava dados no PostgreSQL.

- **Mais jogados na Steam:** `/popularity_primitives`, `popularity_type = 5`, documentado pela [IGDB como Steam 24hr Peak Players](https://api-docs.igdb.com/#how-to-use-popularity-api). A ordem segue `value` decrescente, após eliminar registros sem jogo principal. O valor PopScore não é exibido como contagem bruta e o título da seção não sugere jogadores simultâneos neste instante.
- **Na mira: FPS:** consulta títulos lançados e principais que possuam simultaneamente o gênero Shooter e a perspectiva First person. Os IDs são resolvidos pelos `slug` dos endpoints `/genres` e `/player_perspectives`, em vez de números presumidos. A ordem é pela quantidade de avaliações `total_rating_count`, exigindo ao menos 20.
- **Cantinho Indie:** exige o gênero Indie informado pela IGDB, jogo principal lançado, capa válida e pelo menos 50 avaliações. Alterna títulos com maior quantidade de avaliações e títulos com maior `total_rating`, removendo duplicatas. O gênero Indie da IGDB é uma classificação de catálogo, não uma auditoria financeira do estúdio.
- **Populares na IGDB** e **Próximos lançamentos:** preservam as regras anteriores. O Hero usa o primeiro título completo do ranking Steam; se faltar capa ou data, procura outro título Steam e então recua para populares, FPS e Indie, mantendo a fonte visível.

As coleções temáticas podem compartilhar títulos com rankings objetivos. A Home coloca primeiro os títulos ainda não vistos em seções anteriores, preservando a ordem relativa de cada grupo; os rankings Steam e IGDB não são reordenados. Apenas jogos principais são aceitos quando `game_type`, `version_parent` e `parent_game` permitem classificá-los. Registros incompletos podem reduzir o número final de cards.

## Cache, limites e falhas

Cada seção e a taxonomia possuem chaves Redis separadas com o TTL existente `discovery.cache-ttl` (padrão: 6 horas). Apenas informações públicas da IGDB entram nesses caches; a biblioteca pessoal continua fora deles. Respostas com erro não são armazenadas. Se uma seção falhar por HTTP, metadados ausentes ou Redis indisponível, somente ela é marcada indisponível. A biblioteca pessoal pode continuar carregando independentemente.

O cliente IGDB agora limita os inícios das requisições a intervalos de 275 ms e até oito requisições em andamento por instância, em linha com os [limites publicados pela IGDB](https://api-docs.igdb.com/#rate-limits). A limitação não é distribuída entre réplicas: uma implantação com várias instâncias exige coordenação adicional. A Home fria pode fazer até dez consultas externas sequenciais; acessos subsequentes usam os caches. Não há retry agressivo. A dependência da disponibilidade de Redis para novos dados segue o padrão atual do projeto.

## Validação e limitações

Executar `cd backend && .\mvnw.cmd test` e `cd frontend && npm ci && npm run build && npm run lint && npm test && npm run test:e2e`. Os testes de navegador usam fixtures locais e bloqueiam requisições inesperadas; não provam a resposta de uma conta IGDB real. Verificar a integração real exige credenciais IGDB válidas no ambiente local, sem registrá-las em logs ou capturas.

Os metadados da IGDB não garantem que um jogo marcado como Shooter e First person tenha toda a jogabilidade em primeira pessoa, nem que Indie comprove independência financeira. `total_rating_count` é usado como sinal verificável de interesse, não como recomendação personalizada. Uma próxima etapa de polimento visual pode aperfeiçoar a hierarquia do Hero e a densidade dos cards com evidências de uso, mantendo as fontes explícitas.

As capturas [desktop](screenshots/home-discovery-desktop-chromium.jpg) e [mobile](screenshots/home-discovery-mobile-chromium.jpg) usam capas abstratas e dados sintéticos das fixtures Playwright. Elas validam composição e responsividade, não a seleção real feita pela IGDB.

Durante esta implementação, `npm audit --omit=dev --audit-level=high` encontrou zero vulnerabilidades nas dependências de produção. O audit completo apontou um alerta de severidade alta no Vite, dependência de desenvolvimento já existente. A atualização deve ser revisada separadamente para não alterar a ferramenta de build sem validação própria.
