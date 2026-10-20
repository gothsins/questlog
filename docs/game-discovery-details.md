# Detalhes de jogos descobertos

`/games/igdb/:igdbId` mostra informações da IGDB antes de o jogo entrar na biblioteca. `/games/:gameId` continua usando o ID interno do Questlog e mantém reviews da comunidade e Steam. A Home usa a primeira rota para populares e lançamentos; jogos em andamento continuam na rota interna. Os resultados de Explorar também abrem a rota IGDB pela capa ou pelo título.

`GET /api/discovery/games/{igdbId}` exige autenticação, consulta os detalhes da IGDB e apenas lê o catálogo local para devolver `gameId` quando existir. Ele não importa jogos nem cria entradas de biblioteca. A resposta reúne capa, data, sinopse, gêneros, screenshots e trailer. Dados externos são armazenados no cache Redis `discoveryGameDetails` pelo TTL de `discovery.cache-ttl` (padrão: 6 horas); o vínculo com o catálogo local é consultado fora desse cache. Falhas e jogos inexistentes não são armazenados. Erros retornam 400 para ID inválido, 404 para título inexistente e 503 para indisponibilidade, sem detalhes internos do provedor.

A página verifica `GET /api/library` para decidir se apresenta a importação ou o link para a entrada já existente. Só o clique em **Adicionar à biblioteca** chama `POST /api/library/import`. Após sucesso, atualiza e invalida `['library']` e navega para o `gameId` retornado. Em 409, consulta novamente a biblioteca e só oferece um link se encontrar a entrada correspondente; nunca usa `igdbId` como ID interno.

As duas rotas compartilham capa, resumo, gêneros, galeria e trailer por `GameDetailsContent`. Reviews que exigem ID interno permanecem na Game Details original. O iframe do YouTube só é carregado após ação explícita do jogador.

Para validar localmente: `cd backend && .\mvnw.cmd test`; `cd frontend && npm ci && npm run build && npm run lint && npm test && npm run test:e2e`. Playwright usa fixtures locais e bloqueia destinos de rede não simulados. As capturas em `docs/screenshots/discovery-details-*.jpg` usam dados e imagens sintéticos para validação visual; não demonstram resposta real da IGDB. Uma checagem manual com credenciais de desenvolvimento ainda é necessária para confirmar o contrato ao vivo do provedor.
