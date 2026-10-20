import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '../api/client'
import type { HomeDiscovery, DiscoveryGame, DiscoverySection } from '../types/discovery'
import type { LibraryEntry } from '../types/library'
import '../styles/home.css'

async function readJson<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await authenticatedFetch(path, { signal })
    if (response.status === 401 || response.status === 403) throw new Error('SESSION_EXPIRED')
    if (!response.ok) throw new Error('REQUEST_FAILED')
    return response.json() as Promise<T>
}

function explorePath(title: string) {
    return `/explore?q=${encodeURIComponent(title)}`
}

function Cover({ title, url }: { title: string; url: string | null }) {
    const [broken, setBroken] = useState(false)
    return url && !broken
        ? <img src={url} alt={`Capa de ${title}`} loading="lazy" onError={() => setBroken(true)} />
        : <span className="home-cover__fallback" aria-label={`Sem capa para ${title}`}>Q</span>
}

function formatDate(value: string | null) {
    if (!value) return null
    const date = new Date(`${value}T12:00:00Z`)
    return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function DiscoveryCard({ game, index, upcoming }: { game: DiscoveryGame; index: number; upcoming?: boolean }) {
    return <Link className="home-game" to={explorePath(game.title)} aria-label={`Buscar ${game.title} no catálogo`}>
        <span className="home-cover"><Cover title={game.title} url={game.coverUrl} /></span>
        <span className="home-game__meta"><span className="home-game__index">{upcoming ? formatDate(game.releaseDate) : String(index + 1).padStart(2, '0')}</span><strong title={game.title}>{game.title}</strong><small>{upcoming ? 'Próximo lançamento' : 'Visitas às páginas · IGDB'}</small></span>
    </Link>
}

function DiscoveryRail({ id, title, eyebrow, section, upcoming }: { id: string; title: string; eyebrow: string; section?: DiscoverySection; upcoming?: boolean }) {
    return <section className="home-section" aria-labelledby={id}>
        <div className="home-section__heading"><div><span className="home-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2></div><Link to="/explore">Explorar catálogo <span aria-hidden="true">↗</span></Link></div>
        {!section && <div className="home-rail" role="status" aria-label={`Carregando ${title}`}><div className="home-skeleton" /><div className="home-skeleton" /><div className="home-skeleton" /></div>}
        {section && !section.available && <p className="home-state" role="status">Dados da IGDB indisponíveis no momento. Sua biblioteca continua acessível.</p>}
        {section?.available && section.games.length === 0 && <p className="home-state">Nenhum jogo disponível nesta seção agora.</p>}
        {section?.available && section.games.length > 0 && <div className="home-rail">{section.games.map((game, index) => <DiscoveryCard key={game.igdbId} game={game} index={index} upcoming={upcoming} />)}</div>}
    </section>
}

function HomePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const discovery = useQuery({ queryKey: ['home-discovery'], queryFn: ({ signal }) => readJson<HomeDiscovery>('/api/discovery/home', signal), staleTime: 5 * 60_000, retry: false })
    const library = useQuery({ queryKey: ['library'], queryFn: ({ signal }) => readJson<LibraryEntry[]>('/api/library', signal), staleTime: 30_000, retry: false })

    useEffect(() => {
        if ([discovery.error, library.error].some(error => error instanceof Error && error.message === 'SESSION_EXPIRED')) {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [discovery.error, library.error, navigate, queryClient])

    const featured = discovery.data?.popular.available ? discovery.data.popular.games[0] : undefined
    const playing = library.data?.filter(game => game.status === 'PLAYING') ?? []

    return <div className="home-page">
        <section className="home-hero" aria-labelledby="home-title">
            <div className="home-hero__copy"><span className="home-eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span><h1 id="home-title">Descubra o que vem <em>depois.</em></h1><p>Jogos que despertam curiosidade, lançamentos no horizonte e a jornada que você já começou.</p><Link className="home-primary" to="/explore">Explorar jogos <span aria-hidden="true">↗</span></Link></div>
            <div className="home-hero__feature">{featured ? <Link to={explorePath(featured.title)} className="home-feature" aria-label={`Buscar ${featured.title} no catálogo`}><span className="home-feature__art"><Cover title={featured.title} url={featured.coverUrl} /></span><span className="home-feature__caption"><small>EM DESTAQUE · VISITAS ÀS PÁGINAS NA IGDB</small><strong>{featured.title}</strong><span>Conhecer jogo ↗</span></span></Link> : <div className="home-feature home-feature--empty"><span className="home-feature__mark">✦</span><span>{discovery.isPending ? 'Buscando novidades na IGDB…' : 'Novas descobertas chegam em breve.'}</span></div>}</div>
        </section>

        {discovery.isError && <div className="home-state" role="alert">Não foi possível carregar a descoberta. <button type="button" onClick={() => void discovery.refetch()}>Tentar novamente</button></div>}
        <DiscoveryRail id="home-popular" title="Populares na IGDB" eyebrow="O QUE ESTÁ CHAMANDO ATENÇÃO" section={discovery.isError ? { games: [], available: false, updatedAt: null } : discovery.data?.popular} />
        <DiscoveryRail id="home-upcoming" title="Próximos lançamentos" eyebrow="NO HORIZONTE" section={discovery.isError ? { games: [], available: false, updatedAt: null } : discovery.data?.upcoming} upcoming />

        <section className="home-section home-journey" aria-labelledby="home-journey"><div className="home-section__heading"><div><span className="home-eyebrow">SUA COLEÇÃO</span><h2 id="home-journey">Continue sua jornada</h2></div><Link to="/library">Minha biblioteca <span aria-hidden="true">↗</span></Link></div>
            {library.isPending && <p className="home-state" role="status">Carregando sua biblioteca…</p>}
            {library.isError && <div className="home-state" role="alert">Não foi possível carregar sua biblioteca. <button type="button" onClick={() => void library.refetch()}>Tentar novamente</button></div>}
            {library.isSuccess && playing.length === 0 && <div className="home-journey__empty"><span aria-hidden="true">✦</span><p>Nenhum jogo em andamento ainda. Que tal encontrar sua próxima aventura?</p><Link to="/explore">Explorar jogos →</Link></div>}
            {playing.length > 0 && <div className="home-rail">{playing.map(game => <Link key={game.id} to={`/games/${game.gameId}`} className="home-game" aria-label={`Ver detalhes de ${game.title}`}><span className="home-cover"><Cover title={game.title} url={game.coverUrl} /></span><span className="home-game__meta"><span className="home-game__index">JOGANDO</span><strong title={game.title}>{game.title}</strong><small>{new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(game.hoursPlayed)}h registradas{game.rating != null ? ` · Nota ${game.rating}/10` : ''}</small></span></Link>)}</div>}
        </section>
    </div>
}

export default HomePage
