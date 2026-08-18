export const metadata = {
  title: 'Add XRP Brief to Your Phone | GenXKrypto',
  description: 'Add XRP Brief to your home screen for one-tap access to verified XRP and macro intelligence.',
};

export default function InstallPage() {
  return (
    <div>
      <h1>Add to Phone or Tablet</h1>
      <p className="page-sub">XRP Brief on your home screen</p>

      <p>
        XRP Brief works in your browser, no download required. Adding it to your home screen is optional
        but gives you one-tap access from your device, and it opens full screen like a native app.
      </p>

      <div className="install-grid">
        <div className="card">
          <h3 className="card-title">iOS</h3>
          <ol className="install-steps">
            <li>Open brief.genxkrypto.com in Safari</li>
            <li>If you don&apos;t see a Share icon in the toolbar, tap the &quot;&middot;&middot;&middot;&quot; button next to the address bar first</li>
            <li>Tap the Share button (box with arrow)</li>
            <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
            <li>Tap Add. XRP Brief will appear on your home screen like a native app</li>
          </ol>
        </div>
        <div className="card">
          <h3 className="card-title">Android</h3>
          <ol className="install-steps">
            <li>Open brief.genxkrypto.com in Chrome</li>
            <li>Tap the three-dot menu in the top right</li>
            <li>Tap &quot;Add to Home Screen&quot;</li>
            <li>Tap Add to confirm</li>
          </ol>
        </div>
      </div>

      <p className="small dim">
        Nothing installs in the app-store sense. The icon is a direct line to the live desk, and removing
        it works like removing any other app icon.
      </p>
    </div>
  );
}
