/**
 * Content-Security-Policy for the production build.
 *
 * Everything the app loads is listed here on purpose. If a new feature needs
 * another origin (a new image host, an embed, a font CDN), add it below and
 * extend tests/csp.test.mjs.
 */
export function buildContentSecurityPolicy(apiUrl: string): string {
    // `new URL` throws on a malformed VITE_API_URL, which is what we want:
    // a broken policy must fail the build, not silently weaken protection.
    const apiOrigin = new URL(apiUrl).origin

    return [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        // Covers from the IGDB CDN; avatars are served by the API itself.
        `img-src 'self' ${apiOrigin} https://images.igdb.com`,
        `connect-src 'self' ${apiOrigin}`,
        // Trailers use the privacy-enhanced YouTube embed only.
        'frame-src https://www.youtube-nocookie.com',
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; ')
}
