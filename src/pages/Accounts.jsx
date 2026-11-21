import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import AccountForm from '../components/AccountForm.jsx';

const typeIcons = { cash: '💵', bank: '🏦', wallet: '👛' };
const typeColors = { cash: '#10B981', bank: '#3B82F6', wallet: '#8B5CF6' };

function formatMoney(amount) {
  const sign = amount < 0 ? '-' : '';
  return sign + '₹' + Math.abs(amount).toFixed(2);
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);

  function loadAccounts() {
    window.api.getAccounts().then(setAccounts);
  }

  useEffect(loadAccounts, []);

  function openAdd() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(account) {
    setEditing(account);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleSave(data) {
    const request = editing
      ? window.api.updateAccount({ ...data, id: editing.id })
      : window.api.addAccount(data);
    return request.then(() => {
      setMessage({ text: editing ? 'Account saved.' : 'Account added.', ok: true });
      closeForm();
      loadAccounts();
    });
  }

  function handleDelete(account) {
    if (!window.confirm(`Delete "${account.name}"?`)) return;
    window.api
      .deleteAccount(account.id)
      .then(() => {
        setMessage({ text: 'Account deleted.', ok: true });
        loadAccounts();
      })
      .catch((err) => setMessage({ text: err.message, ok: false }));
  }

  return (
    <div className="page">
      <div className="card">
        <header className="page-header">
          <div>
            <h1>Accounts</h1>
            <p className="muted">Track your cash, bank and wallet balances.</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            + Add Account
          </button>
        </header>

        {message && <p className={message.ok ? 'success' : 'error'}>{message.text}</p>}

        {accounts.length === 0 ? (
          <div className="empty">
            <p>No accounts yet.</p>
            <p className="muted">Add a cash, bank or wallet account to start tracking balances.</p>
          </div>
        ) : (
          <div className="cat-grid">
            {accounts.map((account) => (
              <div className="cat-card" key={account.id}>
                <div
                  className="cat-icon"
                  style={{ background: (typeColors[account.type] || '#8B5CF6') + '26' }}
                >
                  {typeIcons[account.type] || '💳'}
                </div>
                <div className="cat-info">
                  <p className="strong">{account.name}</p>
                  <p className={`account-balance ${account.balance < 0 ? 'negative-balance' : ''}`}>
                    {formatMoney(account.balance)}
                  </p>
                  <p className="muted">
                    <span className={`badge ${account.type}`}>{account.type}</span>
                    {' · '}
                    {account.transaction_count} transaction{account.transaction_count === 1 ? '' : 's'}
                    {' · initial '}
                    {formatMoney(account.initial_balance)}
                  </p>
                </div>
                <div className="cat-actions">
                  <button className="btn-small" onClick={() => openEdit(account)}>
                    Edit
                  </button>
                  <button
                    className="btn-small danger"
                    disabled={account.transaction_count > 0}
                    title={
                      account.transaction_count > 0
                        ? 'Used by transactions — cannot delete'
                        : 'Delete account'
                    }
                    onClick={() => handleDelete(account)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <Modal title={editing ? 'Edit Account' : 'Add Account'} onClose={closeForm}>
          <AccountForm account={editing} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </div>
  );
}
