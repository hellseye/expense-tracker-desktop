export default function Home() {
  const desktop = window.desktop;

  return (
    <main className="shell">
      <h1>Expense Tracker</h1>
      <p>Electron + React desktop shell. Initialization complete.</p>

      {desktop ? (
        <ul className="runtime">
          <li>Platform: {desktop.platform}</li>
          <li>Electron: {desktop.versions.electron}</li>
          <li>Chrome: {desktop.versions.chrome}</li>
          <li>Node: {desktop.versions.node}</li>
        </ul>
      ) : (
        <p>Preload bridge not detected.</p>
      )}

      <p className="note">Feature UI has not been built yet.</p>
    </main>
  );
}
