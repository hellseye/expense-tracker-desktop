import { useState } from 'react';

export default function AccountForm({ account, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: account ? account.name : '',
    type: account ? account.type : 'cash',
    initialBalance: account ? String(account.initial_balance) : '0',
  });
  const [error, setError] = useState('');

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    onSave({
      name: form.name.trim(),
      type: form.type,
      initialBalance: Number(form.initialBalance),
    }).catch((err) => setError(err.message));
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          name="name"
          placeholder="e.g. Main Cash, HDFC Bank, Paytm Wallet"
          value={form.name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Type
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="wallet">Wallet</option>
        </select>
      </label>

      <label>
        Initial balance
        <input
          name="initialBalance"
          type="number"
          min="0"
          step="0.01"
          value={form.initialBalance}
          onChange={handleChange}
          required
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {account ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  );
}
