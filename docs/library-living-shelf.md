# Living Shelf da biblioteca

A biblioteca continua usando a coleção carregada por `GET /api/library`. Busca, ordenação e os cinco filtros rápidos operam sobre esse array local. Os contadores usam a coleção completa, enquanto a grade usa os jogos filtrados. O seletor de estado e os filtros rápidos compartilham o mesmo estado React.

`LibraryShelf` mantém os itens identificados por `LibraryEntry.id`. Motion anima a **posição** dos cards com spring; manter o tamanho e o conteúdo fora da interpolação evita esticar capas e texto durante a troca entre Híbrido e Capas. `AnimatePresence` retira itens da grade durante a saída breve, permitindo que os demais ocupem o espaço sem esperar. Itens em saída recebem `inert` e `aria-hidden`. Os rascunhos de Gerenciar ficam apenas em memória da página e sobrevivem quando um filtro oculta temporariamente o card.

O indicador do filtro ativo usa `layoutId` para deslizar entre botões. Com `prefers-reduced-motion`, as animações de layout são desativadas e as mudanças ficam imediatas. O modo visual é a única informação salva no navegador, sob a chave versionada `questlog.library.view.v1`; falhas e valores inválidos usam Híbrido.

Para validar localmente, em `frontend/`, execute `npm ci`, `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e`. A suíte Playwright inicia seu próprio Vite com API simulada e bloqueia destinos de rede inesperados. O teste de movimento amostra posições em quadros consecutivos para verificar deslocamento real; os testes também cobrem 104 cards e movimento reduzido. As capturas com capas sintéticas estão em `docs/screenshots/library-living-*.jpg`.

No PowerShell, vídeos podem ser gerados localmente com:

```powershell
$env:LIBRARY_MOTION_CAPTURE = '1'
npm run test:e2e -- --grep 'quick counts|covers preference' --workers=1
```

Ficam em `frontend/test-results` e não devem ser enviados ao Git. A grade não usa virtualização; coleções muito maiores que as 104 entradas verificadas merecem medição antes de outra mudança de arquitetura.
