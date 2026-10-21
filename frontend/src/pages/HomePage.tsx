import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '../api/client'
import type { DiscoveryGame, DiscoverySection, HomeDiscovery } from '../types/discovery'
import type { LibraryEntry } from '../types/library'
import '../styles/home.css'

async function readJson<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await authenticatedFetch(path, { signal })
    if (response.status === 401 || response.status === 403) throw new Error('SESSION_EXPIRED')
    if (!response.ok) throw new Error('REQUEST_FAILED')
    return response.json() as Promise<T>
}

function detailsPath(igdbId: number) {
    return `/games/igdb/${igdbId}`
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
    return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(date)
}

function DiscoveryCard({ game, index, label, upcoming = false }: {
    game: DiscoveryGame
    index: number
    label: string
    upcoming?: boolean
}) {
    return (
        <Link className="home-game" to={detailsPath(game.igdbId)} aria-label={`Conhecer ${game.title}`}>
            <span className="home-cover"><Cover title={game.title} url={game.coverUrl} /></span>
            <span className="home-game__meta">
                <span className="home-game__index">
                    {upcoming ? formatDate(game.releaseDate) ?? 'Data a confirmar' : String(index + 1).padStart(2, '0')}
                </span>
                <strong title={game.title}>{game.title}</strong>
                <small>{label}</small>
            </span>
        </Link>
    )
}

type CollectionProps = {
    id: string
    title: string
    eyebrow: string
    subtitle: string
    cardLabel: string
    section?: DiscoverySection
    variant?: 'rail' | 'editorial'
    upcoming?: boolean
}

function Collection({ id, title, eyebrow, subtitle, cardLabel, section,
    variant = 'rail', upcoming = false }: CollectionProps) {
    return (
        <section className={`home-section home-section--${variant}`} aria-labelledby={id}>
            <div className="home-section__heading">
                <div>
                    <span className="home-eyebrow">{eyebrow}</span>
                    <h2 id={id}>{title}</h2>
                    <p>{subtitle}</p>
                </div>
                <Link to="/explore">Explorar catálogo <span aria-hidden="true">↗</span></Link>
            </div>
            {!section && (
                <div className="home-rail" role="status" aria-label={`Carregando ${title}`}>
                    <div className="home-skeleton" /><div className="home-skeleton" /><div className="home-skeleton" />
                </div>
            )}
            {section && !section.available && (
                <p className="home-state" role="status">Dados da IGDB indisponíveis no momento. Sua biblioteca continua acessível.</p>
            )}
            {section?.available && section.games.length === 0 && (
                <p className="home-state">Nenhum jogo disponível nesta seção agora.</p>
            )}
            {section?.available && section.games.length > 0 && (
                <div className={variant === 'rail' ? 'home-rail' : 'home-editorial'}>
                    {section.games.map((game, index) => (
                        <DiscoveryCard key={game.igdbId} game={game} index={index} label={cardLabel} upcoming={upcoming} />
                    ))}
                </div>
            )}
        </section>
    )
}

function Journey({ library, playing }: {
    library: ReturnType<typeof useQuery<LibraryEntry[], Error>>
    playing: LibraryEntry[]
}) {
    return (
        <section className="home-section home-journey" aria-labelledby="home-journey">
            <div className="home-section__heading">
                <div><span className="home-eyebrow">SUA COLEÇÃO</span><h2 id="home-journey">Continue sua jornada</h2></div>
                <Link to="/library">Minha biblioteca <span aria-hidden="true">↗</span></Link>
            </div>
            {library.isPending && <p className="home-state" role="status">Carregando sua biblioteca…</p>}
            {library.isError && (
                <div className="home-state" role="alert">
                    Não foi possível carregar sua biblioteca.
                    <button type="button" onClick={() => void library.refetch()}>Tentar novamente</button>
                </div>
            )}
            {library.isSuccess && playing.length === 0 && (
                <div className="home-journey__empty">
                    <span aria-hidden="true">✦</span>
                    <p>Nenhum jogo em andamento ainda. Que tal encontrar sua próxima aventura?</p>
                    <Link to="/explore">Explorar jogos →</Link>
                </div>
            )}
            {playing.length > 0 && (
                <div className="home-rail">
                    {playing.map(game => (
                        <Link key={game.id} to={`/games/${game.gameId}`} className="home-game"
                            aria-label={`Ver detalhes de ${game.title}`}>
                            <span className="home-cover"><Cover title={game.title} url={game.coverUrl} /></span>
                            <span className="home-game__meta">
                                <span className="home-game__index">JOGANDO</span>
                                <strong title={game.title}>{game.title}</strong>
                                <small>
                                    {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(game.hoursPlayed)}h registradas
                                    {game.rating != null ? ` · Nota ${game.rating}/10` : ''}
                                </small>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}

function HomePage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const discovery = useQuery({
        queryKey: ['home-discovery'],
        queryFn: ({ signal }) => readJson<HomeDiscovery>('/api/discovery/home', signal),
        staleTime: 5 * 60_000,
        retry: false,
    })
    const library = useQuery({
        queryKey: ['library'],
        queryFn: ({ signal }) => readJson<LibraryEntry[]>('/api/library', signal),
        staleTime: 30_000,
        retry: false,
    })

    useEffect(() => {
        if ([discovery.error, library.error].some(error => error instanceof Error && error.message === 'SESSION_EXPIRED')) {
            sessionStorage.removeItem('questlog_token')
            queryClient.clear()
            navigate('/login', { replace: true })
        }
    }, [discovery.error, library.error, navigate, queryClient])

    const featured = discovery.data?.featured
    const playing = library.data?.filter(game => game.status === 'PLAYING') ?? []
    const unavailable: DiscoverySection = { games: [], available: false, updatedAt: null }
    const section = (value?: DiscoverySection) => discovery.isError ? unavailable : value

    return (
        <div className="home-page">
            <section className="home-hero" aria-labelledby="home-title">
                <div className="home-hero__copy">
                    <span className="home-eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span>
                    <h1 id="home-title">Descubra o que vem <em>depois.</em></h1>
                    <p>Jogos que despertam curiosidade, lançamentos no horizonte e a jornada que você já começou.</p>
                    <Link className="home-primary" to="/explore">Explorar jogos <span aria-hidden="true">↗</span></Link>
                </div>
                <div className="home-hero__feature">
                    {featured ? (
                        <Link to={detailsPath(featured.igdbId)} className="home-feature"
                            aria-label={`Conhecer ${featured.title}`}>
                            <span className="home-feature__art"><Cover title={featured.title} url={featured.coverUrl} /></span>
                            <span className="home-feature__caption">
                                <small>EM DESTAQUE · {featured.popularitySource ?? 'IGDB'}</small>
                                <strong>{featured.title}</strong>
                                <span>Conhecer jogo ↗</span>
                            </span>
                        </Link>
                    ) : (
                        <div className="home-feature home-feature--empty">
                            <span className="home-feature__mark">✦</span>
                            <span>{discovery.isPending ? 'Buscando novidades na IGDB…' : 'Novas descobertas chegam em breve.'}</span>
                        </div>
                    )}
                </div>
            </section>

            {discovery.isError && (
                <div className="home-state" role="alert">
                    Não foi possível carregar a descoberta.
                    <button type="button" onClick={() => void discovery.refetch()}>Tentar novamente</button>
                </div>
            )}
            <Collection id="home-steam" title="Mais jogados na Steam" eyebrow="O PULSO DA STEAM"
                subtitle="Pico de jogadores nas últimas 24 horas · dados via IGDB"
                cardLabel="Pico em 24 horas · IGDB" section={section(discovery.data?.steam)} />
            <Collection id="home-fps" title="Na mira: FPS" eyebrow="COLEÇÃO TEMÁTICA"
                subtitle="Tiros, adrenalina e mundos em primeira pessoa."
                cardLabel="Shooter · primeira pessoa · IGDB" section={section(discovery.data?.fps)} variant="editorial" />
            <Collection id="home-indie" title="Cantinho Indie" eyebrow="PARA DESCOBRIR"
                subtitle="Pequenos estúdios, grandes jornadas."
                cardLabel="Gênero Indie · IGDB" section={section(discovery.data?.indie)} variant="editorial" />
            <Collection id="home-popular" title="Populares na IGDB" eyebrow="O QUE ESTÁ CHAMANDO ATENÇÃO"
                subtitle="Jogos em evidência pelas visitas às páginas da IGDB."
                cardLabel="Visitas às páginas · IGDB" section={section(discovery.data?.popular)} />
            <Collection id="home-upcoming" title="Próximos lançamentos" eyebrow="NO HORIZONTE"
                subtitle="Os próximos capítulos, ordenados por data de lançamento."
                cardLabel="Próximo lançamento" section={section(discovery.data?.upcoming)} upcoming />
            <Journey library={library} playing={playing} />
        </div>
    )
}

export default HomePage
