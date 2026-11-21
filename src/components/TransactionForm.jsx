import { useState } from 'react';

export default function TransactionForm({ categories, accounts, transaction, onSave, onCancel }) {
  const [form, setForm] = useState({
    amount: transaction ? String(transaction.amount) : '',
    type: transaction ? transaction.type : 'expense',
    categoryId: transaction ? String(transaction.category_id) : '',
    accountId: transaction && transaction.account_id ? String(transaction.account_id) : '',
    title: transaction ? transaction.title : '',
    date: transaction ? transaction.date : new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      categoryId: Number(form.categoryId),
      accountId: form.accountId ? Number(form.accountId) : null,
      date: form.date,
      paymentMethod: transaction ? transaction.payment_method : 'CASH',
      notes: transaction ? transaction.notes : null,
    }).catch((err) => setError(err.message));
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Amount
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Type
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      <label>
        Category
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
      </label>

      <label>
        Account (optional)
        <select name="accountId" value={form.accountId} onChange={handleChange}>
          <option value="">No account</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description
        <input
          name="title"
          placeholder="e.g. Grocery shopping, Monthly salary"
          value={form.title}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Date
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {transaction ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
