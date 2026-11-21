import { useEffect, useState } from 'react';

export default function Home() {
  const desktop = window.desktop;
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    window.api.getCategories().then(setCategories);
    window.api.getTransactions().then(setTransactions);
  }, []);

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

      <h2>Categories from SQLite ({categories.length})</h2>
      <ul className="data">
        {categories.map((category) => (
          <li key={category.id}>
            <span className="dot" style={{ background: category.color }} />
            {category.name}
          </li>
        ))}
      </ul>

      <h2>Transactions from SQLite ({transactions.length})</h2>
      {transactions.length === 0 ? (
        <p className="note">No transactions yet.</p>
      ) : (
        <ul className="data">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              {transaction.title} — {transaction.amount} ({transaction.type})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
