import { useEffect, useState } from 'react';

const paymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'];

function emptyForm() {
  return {
    title: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    paymentMethod: 'CASH',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  };
}

export default function Home() {
  const desktop = window.desktop;
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function loadTransactions() {
    window.api.getTransactions().then(setTransactions);
  }

  useEffect(() => {
    window.api.getCategories().then(setCategories);
    loadTransactions();
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = {
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      categoryId: Number(form.categoryId),
      paymentMethod: form.paymentMethod,
      date: form.date,
      notes: form.notes || null,
    };
    const request = editingId
      ? window.api.updateTransaction({ ...data, id: editingId })
      : window.api.addTransaction(data);
    request
      .then(() => {
        setForm(emptyForm());
        setEditingId(null);
        setError('');
        loadTransactions();
      })
      .catch((err) => setError(err.message));
  }

  function startEdit(transaction) {
    setEditingId(transaction.id);
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      categoryId: String(transaction.category_id),
      paymentMethod: transaction.payment_method,
      date: transaction.date,
      notes: transaction.notes || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function handleDelete(id) {
    window.api
      .deleteTransaction(id)
      .then(loadTransactions)
      .catch((err) => setError(err.message));
  }

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

      <form className="crud-form" onSubmit={handleSubmit}>
        <input
          className="full"
          name="title"
          placeholder="Description"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select name="categoryId" value={form.categoryId} onChange={handleChange} required>
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <input
          className="full"
          name="notes"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={handleChange}
        />
        <button className="full" type="submit">
          {editingId ? 'Save changes' : 'Add transaction'}
        </button>
        {editingId && (
          <button className="full" type="button" onClick={cancelEdit}>
            Cancel edit
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {transactions.length === 0 ? (
        <p className="note">No transactions yet.</p>
      ) : (
        <ul className="data">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              {transaction.title} — {transaction.amount} ({transaction.type})
              <button onClick={() => startEdit(transaction)}>Edit</button>
              <button onClick={() => handleDelete(transaction.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
