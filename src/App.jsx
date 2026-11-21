import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div>
      <nav className="topnav">
        <span className="brand">Expense Tracker</span>
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>
          Dashboard
        </button>
        <button className={page === 'transactions' ? 'active' : ''} onClick={() => setPage('transactions')}>
          Transactions
        </button>
      </nav>

      {page === 'dashboard' ? <Dashboard onViewAll={() => setPage('transactions')} /> : <Transactions />}
    </div>
  );
}
