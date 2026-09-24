// Sept 24, 2026. Everything public is crawlable; /card is the desk's private
// share-card utility and already carries a noindex tag, listed here as well so
// crawlers need not fetch it to learn that.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/card', '/api/'] }],
    sitemap: 'https://xrpmacro.com/sitemap.xml',
  };
}
