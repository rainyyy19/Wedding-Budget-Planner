import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, PieChart as PieIcon, BarChart3, AlertTriangle, 
  Lightbulb, Download, ShieldAlert, Sparkles, CheckCircle2, 
  ArrowRight, Users, Coins
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { api, formatCurrency, formatCompactCurrency } from '../services/api';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function InsightsPage({ user, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState(null);

  useEffect(() => {
    loadInsights();
  }, [user]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getInsights();
      setInsightsData(res);
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.downloadCsv();
      onShowToast('CSV Report downloaded!', 'success');
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  if (loading || !insightsData) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-burgundy)' }}>
          Analyzing wedding expenditures & calculating savings...
        </div>
      </div>
    );
  }

  const currencySymbol = user?.currency_symbol || '₹';
  const currencyCode = user?.currency_code || 'INR';

  const categories = insightsData.categories || [];
  const overbudgetCats = insightsData.overbudget_categories || [];
  const nearLimitCats = insightsData.near_limit_categories || [];
  const savingsTips = insightsData.savings_tips || [];

  // Donut Chart Data (Category Distribution)
  const doughnutData = {
    labels: categories.map(c => c.name),
    datasets: [
      {
        data: categories.map(c => c.total_actual || c.allocated_amount),
        backgroundColor: categories.map(c => c.color || '#802F48'),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#261E20'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const val = context.raw || 0;
            return ` ${label}: ${formatCurrency(val, currencyCode, currencySymbol)}`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // Grouped Bar Chart Data (Planned / Allocated vs Actual Spent)
  const barData = {
    labels: categories.map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
    datasets: [
      {
        label: 'Allocated Budget',
        data: categories.map(c => c.allocated_amount),
        backgroundColor: 'rgba(196, 164, 124, 0.65)',
        borderColor: '#C4A47C',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Actual Spent',
        data: categories.map(c => c.total_actual),
        backgroundColor: categories.map(c => c.total_actual > c.allocated_amount ? 'rgba(180, 58, 75, 0.85)' : 'rgba(107, 45, 68, 0.85)'),
        borderColor: categories.map(c => c.total_actual > c.allocated_amount ? '#B43A4B' : '#6B2D44'),
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` ${context.dataset.label}: ${formatCurrency(context.raw, currencyCode, currencySymbol)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { font: { size: 10 } }
      },
      y: {
        ticks: {
          callback: (value) => formatCompactCurrency(value, currencySymbol),
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="max-w-7xl">
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-burgundy)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <TrendingUp size={16} />
              <span>Budget Insights & Financial Intelligence</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: 'var(--color-burgundy)' }}>
              Spending Analytics & Tailored Savings
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem' }}>
              Real calculated spending patterns, cost-per-guest metrics, and smart optimization recommendations.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="btn-primary"
          >
            <Download size={16} />
            <span>Export Full CSV Ledger</span>
          </button>
        </div>

        {/* METRICS STRIP: COST PER GUEST + TOTALS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="stat-tile" style={{ '--tile-accent': 'var(--color-burgundy)' }}>
            <span className="stat-label">Calculated Cost Per Guest</span>
            <span className="stat-value" style={{ color: 'var(--color-burgundy)' }}>
              {formatCurrency(insightsData.cost_per_guest, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Based on {insightsData.guest_count} invited guests
            </div>
          </div>

          <div className="stat-tile" style={{ '--tile-accent': '#C4A47C' }}>
            <span className="stat-label">Total Committed Expenditure</span>
            <span className="stat-value" style={{ color: '#7A5B2F' }}>
              {formatCurrency(insightsData.total_actual, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Budgeted: {formatCurrency(insightsData.total_budget, currencyCode, currencySymbol)}
            </div>
          </div>

          <div className="stat-tile" style={{ '--tile-accent': 'var(--color-sage)' }}>
            <span className="stat-label">Contingency Reserve Health</span>
            <span className="stat-value" style={{ color: 'var(--color-sage-dark)' }}>
              {formatCurrency(insightsData.contingency_fund, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              100% intact & uncommitted for emergencies
            </div>
          </div>

          <div className="stat-tile" style={{ '--tile-accent': overbudgetCats.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            <span className="stat-label">Overspending Risk Alerts</span>
            <span className="stat-value" style={{ color: overbudgetCats.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {overbudgetCats.length} Categories
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {nearLimitCats.length} categories nearing 85% limit
            </div>
          </div>
        </div>

        {/* CHARTS ROW: DONUT DISTRIBUTION + PLANNED VS ACTUAL BARS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '28px',
          marginBottom: '36px'
        }}>
          
          {/* Chart 1: Donut Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
              Category Expense Distribution
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Proportional breakdown of total committed wedding finances
            </p>
            <div style={{ height: '320px', position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Chart 2: Planned vs Actual Bar Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
              Planned Allocation vs. Actual Spending
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Compare original budget blueprint against booked quotations
            </p>
            <div style={{ height: '320px', position: 'relative' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

        </div>

        {/* ALERTS SECTION: OVERSPENDING & NEAR-LIMIT WARNINGS */}
        {(overbudgetCats.length > 0 || nearLimitCats.length > 0) && (
          <div style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '16px' }}>
              Category Budget Variance Warnings
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {overbudgetCats.map((ob, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid rgba(180, 58, 75, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={18} color="var(--color-danger)" />
                    <span style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '0.94rem' }}>
                      {ob.category_name} — Over Budget!
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#6A232D', lineHeight: 1.5 }}>
                    Spent <strong>{formatCurrency(ob.actual, currencyCode, currencySymbol)}</strong> against allocated <strong>{formatCurrency(ob.allocated, currencyCode, currencySymbol)}</strong>.
                    <br />
                    Overrun: <strong>+{formatCurrency(ob.overrun, currencyCode, currencySymbol)}</strong> ({ob.percentage_over}% over).
                  </div>
                </div>
              ))}

              {nearLimitCats.map((nl, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid rgba(184, 124, 36, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <ShieldAlert size={18} color="var(--color-warning)" />
                    <span style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '0.94rem' }}>
                      {nl.category_name} — Approaching Limit
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#6C4814', lineHeight: 1.5 }}>
                    {nl.percentage_used}% utilized. Only <strong>{formatCurrency(nl.headroom, currencyCode, currencySymbol)}</strong> remains in this category.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERSONALIZED SAVINGS SUGGESTIONS */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-warning)'
            }}>
              <Lightbulb size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', color: 'var(--color-burgundy)' }}>
                Personalized Savings & Optimization Tips
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                Algorithmically generated by comparing your active quotations with wedding best practices
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '18px',
            marginTop: '20px'
          }}>
            {savingsTips.map((tip, idx) => (
              <div key={idx} style={{
                backgroundColor: 'var(--color-ivory)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      {tip.category}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-success)' }}>
                      Save ~{tip.estimated_savings_pct}%
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.08rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                    {tip.title}
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {tip.description}
                  </p>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-burgundy)', fontWeight: 600 }}>
                  <CheckCircle2 size={14} color="var(--color-success)" />
                  <span>Recommended Action</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
