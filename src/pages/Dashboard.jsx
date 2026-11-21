import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';

function formatMoney(amount) {
  const sign = amount < 0 ? '-' : '';
  return sign + '₹' + Math.abs(amount).toFixed(2);
}

export default function Dashboard({ onViewAll }) {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    window.api.getTransactions().then(setTransactions);
    window.api.getCategories().then(setCategories);
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const categoryById = {};
  for (const category of categories) {
    categoryById[category.id] = category;
  }

  // category-wise expense breakdown (amount + share of total spending)
  const totalsByCategory = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      totalsByCategory[t.category_id] = (totalsByCategory[t.category_id] || 0) + t.amount;
    }
  }
  const breakdown = Object.entries(totalsByCategory)
    .map(([id, amount]) => ({
      category: categoryById[id],
      amount,
      percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // income vs expense for each of the last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      income: 0,
      expense: 0,
    });
  }
  for (const t of transactions) {
    const month = months.find((m) => m.key === t.date.slice(0, 7));
    if (month) month[t.type] += t.amount;
  }
  const maxValue = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  const recent = transactions.slice(0, 5);
  const totalFlow = totalIncome + totalExpenses;
  const incomeShare = totalFlow > 0 ? (totalIncome / totalFlow) * 100 : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Your money at a glance.</p>
        </div>
      </header>

      <div className="stats">
        <StatCard
          label="Total Balance"
          value={formatMoney(balance)}
          subtitle="Income minus expenses"
          tone={balance >= 0 ? 'balance' : 'negative'}
        />
        <StatCard label="Total Income" value={formatMoney(totalIncome)} subtitle="All recorded income" tone="income" />
        <StatCard label="Total Expenses" value={formatMoney(totalExpenses)} subtitle="All recorded spending" tone="expense" />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="card-title">
            <h3>Monthly Overview</h3>
            <span className="pill">Last 6 months</span>
          </div>
          <div className="chart">
            {months.map((m) => (
              <div className="chart-month" key={m.key}>
                <div className="chart-bars">
                  <div
                    className="chart-bar income"
                    style={{ height: (m.income / maxValue) * 100 + '%' }}
                    title={`Income: ${formatMoney(m.income)}`}
                  />
                  <div
                    className="chart-bar expense"
                    style={{ height: (m.expense / maxValue) * 100 + '%' }}
                    title={`Expenses: ${formatMoney(m.expense)}`}
                  />
                </div>
                <span className="chart-label">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span><span className="dot income-dot" />Income</span>
            <span><span className="dot expense-dot" />Expenses</span>
          </div>
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Spending by Category</h3>
          </div>
          {breakdown.length === 0 ? (
            <p className="muted empty-small">No expenses yet.</p>
          ) : (
            <div className="breakdown">
              {breakdown.map((item) => (
                <div className="breakdown-row" key={item.category ? item.category.id : 'unknown'}>
                  <div className="breakdown-head">
                    <span>
                      <span className="dot" style={{ background: item.category ? item.category.color : '#71717a' }} />
                      {item.category ? item.category.name : 'Unknown'}
                    </span>
                    <span className="muted">
                      {formatMoney(item.amount)} · {item.percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: item.percent + '%',
                        background: item.category ? item.category.color : '#71717a',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Income vs Expense</h3>
          </div>
          {totalFlow === 0 ? (
            <p className="muted empty-small">No data yet.</p>
          ) : (
            <>
              <div className="ratio-bar">
                <div className="ratio-income" style={{ width: incomeShare + '%' }} />
                <div className="ratio-expense" style={{ width: 100 - incomeShare + '%' }} />
              </div>
              <div className="legend">
                <span><span className="dot income-dot" />Income {formatMoney(totalIncome)}</span>
                <span><span className="dot expense-dot" />Expenses {formatMoney(totalExpenses)}</span>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Recent Transactions</h3>
            <button className="link" onClick={onViewAll}>
              View All →
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="muted empty-small">No recent transactions.</p>
          ) : (
            <div className="recent">
              {recent.map((t) => {
                const category = categoryById[t.category_id];
                return (
                  <div className="recent-row" key={t.id}>
                    <span className="dot" style={{ background: category ? category.color : '#71717a' }} />
                    <span className="recent-title">{t.title}</span>
                    <span className="muted">{t.date}</span>
                    <span className={`amount ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
