import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Categories from './pages/Categories.jsx';
import Accounts from './pages/Accounts.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div>
      <nav className="topnav">
        <span className="brand">Ledger</span>
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>
          Dashboard
        </button>
        <button className={page === 'transactions' ? 'active' : ''} onClick={() => setPage('transactions')}>
          Transactions
        </button>
        <button className={page === 'categories' ? 'active' : ''} onClick={() => setPage('categories')}>
          Categories
        </button>
        <button className={page === 'accounts' ? 'active' : ''} onClick={() => setPage('accounts')}>
          Accounts
        </button>
      </nav>

      {page === 'dashboard' && <Dashboard onViewAll={() => setPage('transactions')} />}
      {page === 'transactions' && <Transactions />}
      {page === 'categories' && <Categories />}
      {page === 'accounts' && <Accounts />}
    </div>
  );
}
