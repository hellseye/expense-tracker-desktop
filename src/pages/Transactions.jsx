import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import TransactionForm from '../components/TransactionForm.jsx';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  function loadData() {
    window.api.getTransactions().then(setTransactions).catch((err) => setError(err.message));
    window.api.getCategories().then(setCategories);
    window.api.getAccounts().then(setAccounts);
  }

  useEffect(loadData, []);

  const categoryById = {};
  for (const category of categories) {
    categoryById[category.id] = category;
  }

  // Search, filter and sort happen here in React, on the already-loaded rows.
  const query = search.trim().toLowerCase();
  const visibleTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        query === '' ||
        transaction.title.toLowerCase().includes(query) ||
        (transaction.notes || '').toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === 'all' || transaction.category_id === Number(categoryFilter);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let result;
      if (sortBy === 'amount') {
        result = a.amount - b.amount;
      } else if (sortBy === 'title') {
        result = a.title.localeCompare(b.title);
      } else {
        result = a.date.localeCompare(b.date);
      }
      return sortOrder === 'asc' ? result : -result;
    });

  const hasActiveFilters =
    query !== '' || categoryFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc';

  function clearFilters() {
    setSearch('');
    setCategoryFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  }

  function openAdd() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(transaction) {
    setEditing(transaction);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleSave(data) {
    const request = editing
      ? window.api.updateTransaction({ ...data, id: editing.id })
      : window.api.addTransaction(data);
    return request.then(() => {
      closeForm();
      loadData();
    });
  }

  function handleDelete(transaction) {
    if (!window.confirm(`Delete "${transaction.title}"?`)) return;
    window.api
      .deleteTransaction(transaction.id)
      .then(loadData)
      .catch((err) => setError(err.message));
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="page">
      <div className="card">
        <header className="page-header">
          <div>
            <h1>Transactions</h1>
            <p className="muted">View and manage your income and expenses.</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            + Add Transaction
          </button>
        </header>

        {error && <p className="error">{error}</p>}

        {transactions.length > 0 && (
          <>
            <div className="toolbar">
              <input
                name="search"
                placeholder="Search description or notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                name="categoryFilter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select name="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="date">Sort: Date</option>
                <option value="amount">Sort: Amount</option>
                <option value="title">Sort: Description</option>
              </select>
              <button
                className="btn-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
              {hasActiveFilters && (
                <button className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
            <p className="muted result-count">
              Showing {visibleTransactions.length} of {transactions.length} transactions
            </p>
          </>
        )}

        {transactions.length === 0 ? (
          <div className="empty">
            <p>No transactions yet.</p>
            <p className="muted">Click "Add Transaction" to record your first income or expense.</p>
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="empty">
            <p>No transactions match your filters.</p>
            <button className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th className="right">Amount</th>
                <th className="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((transaction) => {
                const category = categoryById[transaction.category_id];
                return (
                  <tr key={transaction.id}>
                    <td className="strong">{transaction.title}</td>
                    <td>
                      <span
                        className="dot"
                        style={{ background: category ? category.color : '#71717a' }}
                      />
                      {category ? category.name : 'Unknown'}
                    </td>
                    <td className="muted">{formatDate(transaction.date)}</td>
                    <td>
                      <span className={`badge ${transaction.type}`}>{transaction.type}</span>
                    </td>
                    <td className={`right amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </td>
                    <td className="right">
                      <button className="btn-small" onClick={() => openEdit(transaction)}>
                        Edit
                      </button>
                      <button className="btn-small danger" onClick={() => handleDelete(transaction)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <Modal title={editing ? 'Edit Transaction' : 'Add Transaction'} onClose={closeForm}>
          <TransactionForm
            categories={categories}
            accounts={accounts}
            transaction={editing}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  );
}
