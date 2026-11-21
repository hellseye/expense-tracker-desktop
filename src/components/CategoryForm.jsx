import { useState } from 'react';

const iconChoices = ['🍔', '🏠', '🛍️', '📺', '🚗', '⚡', '💰', '🎁', '✈️', '📚', '💪', '🏷️'];
const colorChoices = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4'];

// seeded categories store icon names; newer ones store the emoji directly
export function categoryIcon(icon) {
  const legacyIcons = {
    utensils: '🍔',
    home: '🏠',
    'shopping-bag': '🛍️',
    tv: '📺',
    car: '🚗',
    zap: '⚡',
    tag: '🏷️',
  };
  return legacyIcons[icon] || icon || '🏷️';
}

export default function CategoryForm({ category, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: category ? category.name : '',
    type: category ? category.type : 'expense',
    icon: category ? categoryIcon(category.icon) : '🏷️',
    color: category ? category.color : '#8B5CF6',
  });
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    onSave({ ...form, name: form.name.trim() }).catch((err) => setError(err.message));
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          name="name"
          placeholder="e.g. Gym, Freelance"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>

      <label>
        Type
        <select
          name="type"
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      <span className="picker-label">Icon</span>
      <div className="icon-picker">
        {iconChoices.map((icon) => (
          <button
            type="button"
            key={icon}
            className={form.icon === icon ? 'picked' : ''}
            onClick={() => setForm({ ...form, icon })}
          >
            {icon}
          </button>
        ))}
      </div>

      <span className="picker-label">Color</span>
      <div className="color-picker">
        {colorChoices.map((color) => (
          <button
            type="button"
            key={color}
            className={form.color === color ? 'picked' : ''}
            style={{ background: color }}
            onClick={() => setForm({ ...form, color })}
          />
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {category ? 'Save changes' : 'Add category'}
        </button>
      </div>
    </form>
  );
}
