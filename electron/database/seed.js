const { getConnection } = require('./connection');

const defaultCategories = [
  { name: 'Food & Dining', color: '#10B981', icon: 'utensils' },
  { name: 'Housing & Rent', color: '#8B5CF6', icon: 'home' },
  { name: 'Shopping & Tech', color: '#3B82F6', icon: 'shopping-bag' },
  { name: 'Subscriptions', color: '#A855F7', icon: 'tv' },
  { name: 'Transportation', color: '#F59E0B', icon: 'car' },
  { name: 'Utilities & Bills', color: '#06B6D4', icon: 'zap' },
];

function seedCategories() {
  const db = getConnection();
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
  if (count > 0) return;

  const insert = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
  for (const category of defaultCategories) {
    insert.run(category.name, category.color, category.icon);
  }
}

module.exports = { seedCategories };
