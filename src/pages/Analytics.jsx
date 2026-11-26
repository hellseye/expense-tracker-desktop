import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';

function formatMoney(amount) {
  const sign = amount < 0 ? '-' : '';
  return sign + '₹' + Math.abs(amount).toFixed(2);
}

function formatDate(date) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    window.api.getTransactions().then(setTransactions);
    window.api.getCategories().then(setCategories);
  }, []);

  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryById = {};
  for (const category of categories) {
    categoryById[category.id] = category;
  }

  // highest single expense
  let highestExpense = null;
  for (const t of expenses) {
    if (!highestExpense || t.amount > highestExpense.amount) {
      highestExpense = t;
    }
  }

  // average daily expense over the last 30 days (including today)
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  const last30Days = expenses
    .filter((t) => t.date >= cutoffKey)
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyAverage = last30Days / 30;

  // category totals, sorted biggest first (top category + distribution)
  const totalsByCategory = {};
  for (const t of expenses) {
    totalsByCategory[t.category_id] = (totalsByCategory[t.category_id] || 0) + t.amount;
  }
  const breakdown = Object.entries(totalsByCategory)
    .map(([id, amount]) => ({
      id,
      category: categoryById[id],
      amount,
      percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  const topCategory = breakdown[0] || null;

  // day with the highest total spending
  const totalsByDay = {};
  for (const t of expenses) {
    totalsByDay[t.date] = (totalsByDay[t.date] || 0) + t.amount;
  }
  let highestDay = null;
  for (const [date, total] of Object.entries(totalsByDay)) {
    if (!highestDay || total > highestDay.total) {
      highestDay = { date, total };
    }
  }

  // expenses grouped by payment method
  const totalsByMethod = {};
  for (const t of expenses) {
    const method = t.payment_method || 'UNKNOWN';
    totalsByMethod[method] = (totalsByMethod[method] || 0) + t.amount;
  }
  const methods = Object.entries(totalsByMethod)
    .map(([method, amount]) => ({
      method,
      label: method.replace(/_/g, ' '),
      amount,
      percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // monthly expense totals across the whole available history
  const monthTotals = {};
  for (const t of expenses) {
    const key = t.date.slice(0, 7);
    monthTotals[key] = (monthTotals[key] || 0) + t.amount;
  }
  const trend = Object.keys(monthTotals)
    .sort()
    .map((key) => ({
      key,
      label: new Date(key + '-01T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      total: monthTotals[key],
    }));
  const maxMonth = Math.max(1, ...trend.map((m) => m.total));

  // current month vs previous month
  const currentMonth = monthTotals[monthKey(now)] || 0;
  const previousMonth = monthTotals[monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))] || 0;
  const difference = currentMonth - previousMonth;
  const changePercent = previousMonth > 0 ? (difference / previousMonth) * 100 : null;

  // conic-gradient segments for the donut chart
  let accumulated = 0;
  const segments = breakdown.map((item) => {
    const start = accumulated;
    accumulated += item.percent;
    return `${item.category ? item.category.color : '#71717a'} ${start}% ${accumulated}%`;
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Analytics</h1>
          <p className="muted">Deep-dive into your spending habits.</p>
        </div>
      </header>

      <div className="stats highlights">
        <StatCard
          label="Highest Expense"
          value={highestExpense ? formatMoney(highestExpense.amount) : '₹0.00'}
          subtitle={highestExpense ? highestExpense.title : 'No expenses yet'}
        />
        <StatCard label="Daily Average" value={formatMoney(dailyAverage)} subtitle="Last 30 days" />
        <StatCard
          label="Top Category"
          value={topCategory ? (topCategory.category ? topCategory.category.name : 'Unknown') : '—'}
          subtitle={topCategory ? formatMoney(topCategory.amount) : 'No expenses yet'}
        />
        <StatCard
          label="Highest Spending Day"
          value={highestDay ? formatMoney(highestDay.total) : '₹0.00'}
          subtitle={highestDay ? formatDate(highestDay.date) : 'No expenses yet'}
        />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="card-title">
            <h3>Payment Method Breakdown</h3>
          </div>
          {methods.length === 0 ? (
            <p className="muted empty-small">No expenses yet.</p>
          ) : (
            <div className="breakdown">
              {methods.map((item) => (
                <div className="breakdown-row" key={item.method}>
                  <div className="breakdown-head">
                    <span>{item.label}</span>
                    <span className="muted">
                      {formatMoney(item.amount)} · {item.percent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: item.percent + '%', background: '#8b5cf6' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Category Distribution</h3>
          </div>
          {breakdown.length === 0 ? (
            <p className="muted empty-small">No expenses yet.</p>
          ) : (
            <div className="donut-layout">
              <div className="donut" style={{ background: `conic-gradient(${segments.join(', ')})` }}>
                <div className="donut-hole">
                  <div>
                    <div className="donut-total">{formatMoney(totalExpenses)}</div>
                    <div className="donut-caption">total spent</div>
                  </div>
                </div>
              </div>
              <div className="donut-legend">
                {breakdown.map((item) => (
                  <div className="breakdown-head" key={item.id}>
                    <span>
                      <span className="dot" style={{ background: item.category ? item.category.color : '#71717a' }} />
                      {item.category ? item.category.name : 'Unknown'}
                    </span>
                    <span className="muted">
                      {formatMoney(item.amount)} · {item.percent.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Monthly Spending Trend</h3>
            <span className="pill">Full history</span>
          </div>
          {trend.length === 0 ? (
            <p className="muted empty-small">No expenses yet.</p>
          ) : (
            <div className="chart">
              {trend.map((m) => (
                <div className="chart-month" key={m.key}>
                  <div className="chart-bars">
                    <div
                      className="chart-bar expense"
                      style={{ height: (m.total / maxMonth) * 100 + '%' }}
                      title={`${m.label}: ${formatMoney(m.total)}`}
                    />
                  </div>
                  <span className="chart-label">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h3>Month-over-Month</h3>
          </div>
          <div className="mom">
            <div className="mom-row">
              <span className="muted">This month</span>
              <span className="strong">{formatMoney(currentMonth)}</span>
            </div>
            <div className="mom-row">
              <span className="muted">Last month</span>
              <span className="strong">{formatMoney(previousMonth)}</span>
            </div>
            <div className="mom-row">
              <span className="muted">Difference</span>
              <span className={difference > 0 ? 'up' : difference < 0 ? 'down' : ''}>
                {difference >= 0 ? '+' : ''}
                {formatMoney(difference)}
              </span>
            </div>
            {changePercent === null ? (
              <p className="muted mom-note">No spending last month to compare.</p>
            ) : (
              <p className={`mom-note ${changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : ''}`}>
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(1)}% vs last month
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
