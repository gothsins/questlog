# Home Discovery 1.0

`/home` é uma rota autenticada. `GET /api/discovery/home` devolve apenas descoberta compartilhada: `popular` e `upcoming`, cada seção com `games`, `available` e `updatedAt`. A biblioteca pessoal continua em `GET /api/library`, fora dos caches compartilhados. O frontend usa a chave `['library']` já empregada por Explorar e pela biblioteca.

## Fontes e critérios

- Populares: [IGDB PopScore](https://api-docs.igdb.com/#how-to-use-popularity-api), `popularity_type = 1`, documentado como visitas às páginas da IGDB. A ordem vem de `value desc`; o valor numérico não é mostrado como contagem de visitantes. Os detalhes dos jogos são buscados por `game_id` em `/games` e recolocados na ordem original. Não há alegação de ranking semanal.
- Próximos lançamentos: `/games`, `first_release_date` futuro em UTC, `game_type = 0` (jogo principal), sem `version_parent` nem `parent_game`. O backend elimina IDs e nomes repetidos, datas desconhecidas e registros incompletos, e ordena por lançamento. A data é a primeira data informada pela IGDB e pode mudar.
- Capas: imagens oficiais da CDN IGDB, com fallback visual. A Home não grava jogos ou entradas de biblioteca.

O endpoint exige JWT pela configuração existente. Um jogo descoberto usa `igdbId` e abre `/explore?q=...`, pois `/games/:gameId` requer o ID interno do Questlog. Jogos da seção pessoal usam seu `gameId` interno. A busca pré-preenchida em Explorar reutiliza o fluxo atual e só executa GET.

## Cache e falhas

`discoveryPopular` e `discoveryUpcoming` usam Redis, serialização JSON tipada e TTL de `DISCOVERY_CACHE_TTL` (padrão `6h`). O preenchimento é sincronizado no processo pela anotação de cache. Os dados são compartilhados e não incluem identidade, biblioteca ou token. Erros do provedor, incluindo HTTP 429 e timeout, não são convertidos em rankings válidos no cache. Uma seção pode ficar indisponível sem bloquear a outra ou a biblioteca pessoal. Não há retry agressivo. A conexão IGDB e a emissão do token Twitch têm timeout de conexão de 3s e leitura de 5s.

O cache não coordena preenchimentos entre instâncias distintas. Em implantação com múltiplas réplicas, um cold start simultâneo pode gerar mais de uma consulta IGDB; considerar lock distribuído ou refresh agendado se o volume exigir. Um resultado vazio válido pode permanecer em cache por até 6h. A IGDB informa [4 requisições por segundo e 8 simultâneas](https://api-docs.igdb.com/#rate-limits); o preenchimento de cada seção faz chamadas sequenciais e o cache reduz chamadas repetidas, mas o limite também é compartilhado com a busca e demais recursos da aplicação. O rate limit 429 do provedor apresenta seção indisponível, sem retry imediato.

## Verificação local

Com PostgreSQL 17 e Redis 7 descartáveis, execute `cd backend && ./mvnw test`. Use `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` e `JWT_SECRET` somente em variáveis de ambiente locais; não os registre em logs ou commits. Execute `cd frontend && npm ci && npm run build && npm run lint && npm test && npm run test:e2e`. O Playwright usa fixtures locais e bloqueia requisições externas inesperadas. Para verificar a tela visualmente sem backend, rode `npm run test:e2e -- e2e/home.spec.ts`; para dados reais é necessário um ambiente de desenvolvimento com credenciais IGDB válidas. Nenhuma conta ou serviço pago é necessário para os testes.

Próxima etapa possível: detalhes públicos resolvidos por `igdbId`, sem escrita implícita, e estratégia de refresh compartilhado caso o tráfego cresça. Não inferir períodos semanais ou mensais sem coleta histórica.

Capturas com fixtures sintéticas, sem dados pessoais: [desktop](screenshots/home-discovery-desktop-chromium.jpg) e [mobile](screenshots/home-discovery-mobile-chromium.jpg). A fixture contém apenas um jogo por seção; em produção, a coleção terá tantos resultados válidos quanto a IGDB devolver, até dez por seção.
