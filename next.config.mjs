/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sept 15, 2026: malformed paths seen in Vercel Web Analytics, each catching
  // real clicks from links posted elsewhere. /instal is a typo of /install.
  // /%3E is a trailing ">" glued onto a link (Discord's <url> embed-suppression
  // syntax pasted somewhere that does not support it). Both go to the page the
  // reader was trying to reach. Temporary (307) rather than permanent, so a
  // later change of mind is not cached by browsers.
  async redirects() {
    return [
      { source: '/instal', destination: '/install', permanent: false },
      { source: '/%3E', destination: '/', permanent: false },
    ];
  },
};
export default nextConfig;
