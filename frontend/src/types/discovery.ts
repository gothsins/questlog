export interface DiscoveryGame {
    igdbId: number
    title: string
    coverUrl: string | null
    releaseDate: string | null
    popularitySource: string | null
}

export interface DiscoverySection {
    games: DiscoveryGame[]
    available: boolean
    updatedAt: string | null
}

export interface HomeDiscovery {
    popular: DiscoverySection
    upcoming: DiscoverySection
    steam: DiscoverySection
    fps: DiscoverySection
    indie: DiscoverySection
    featured: DiscoveryGame | null
}
