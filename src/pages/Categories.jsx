import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import CategoryForm, { categoryIcon } from '../components/CategoryForm.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);

  function loadCategories() {
    window.api.getCategories().then(setCategories);
  }

  useEffect(loadCategories, []);

  function openAdd() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleSave(data) {
    const request = editing
      ? window.api.updateCategory({ ...data, id: editing.id })
      : window.api.addCategory(data);
    return request.then(() => {
      setMessage({ text: editing ? 'Category saved.' : 'Category added.', ok: true });
      closeForm();
      loadCategories();
    });
  }

  function handleDelete(category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    window.api
      .deleteCategory(category.id)
      .then(() => {
        setMessage({ text: 'Category deleted.', ok: true });
        loadCategories();
      })
      .catch((err) => setMessage({ text: err.message, ok: false }));
  }

  return (
    <div className="page">
      <div className="card">
        <header className="page-header">
          <div>
            <h1>Categories</h1>
            <p className="muted">Organize your income and expenses.</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            + Add Category
          </button>
        </header>

        {message && <p className={message.ok ? 'success' : 'error'}>{message.text}</p>}

        {categories.length === 0 ? (
          <div className="empty">
            <p>No categories yet.</p>
            <p className="muted">Click "Add Category" to create one.</p>
          </div>
        ) : (
          <div className="cat-grid">
            {categories.map((category) => (
              <div className="cat-card" key={category.id}>
                <div className="cat-icon" style={{ background: category.color + '26' }}>
                  {categoryIcon(category.icon)}
                </div>
                <div className="cat-info">
                  <p className="strong">{category.name}</p>
                  <p className="muted">
                    <span className={`badge ${category.type}`}>{category.type}</span>
                    {' · '}
                    {category.transaction_count} transaction{category.transaction_count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="cat-actions">
                  <button className="btn-small" onClick={() => openEdit(category)}>
                    Edit
                  </button>
                  <button
                    className="btn-small danger"
                    disabled={category.transaction_count > 0}
                    title={
                      category.transaction_count > 0
                        ? 'Used by transactions — cannot delete'
                        : 'Delete category'
                    }
                    onClick={() => handleDelete(category)}
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
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={closeForm}>
          <CategoryForm category={editing} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </div>
  );
}
