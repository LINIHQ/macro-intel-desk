// Storage key for the light / dark choice (Sept 26, 2026). Lives in a plain
// module, not in components/ThemeToggle.jsx, because that file is a client
// component: importing a constant from it into the server-rendered layout
// hands the layout a client reference instead of the string, and the
// pre-paint script then looks up the wrong key and never restores the choice.
export const THEME_KEY = 'xmd-theme';
