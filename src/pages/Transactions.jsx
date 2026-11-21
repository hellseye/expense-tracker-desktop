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

        {transactions.length === 0 ? (
          <div className="empty">
            <p>No transactions yet.</p>
            <p className="muted">Click "Add Transaction" to record your first income or expense.</p>
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
              {transactions.map((transaction) => {
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
