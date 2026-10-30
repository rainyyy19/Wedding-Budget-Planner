import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Plus, AlertCircle, CheckCircle2, Clock, 
  ArrowUpRight, ChevronRight, ChevronDown, ChevronUp, ShieldCheck, 
  TrendingUp, AlertTriangle, Receipt, Users, Calendar, 
  Sparkles, Download, Heart, Edit2, CreditCard
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api';

export default function DashboardPage({ 
  user, 
  onNavigate, 
  onOpenAddExpense, 
  onRecordPayment,
  onShowToast 
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);

  // Expanded categories state (for accordion drill-down)
  const [expandedCats, setExpandedCats] = useState({});

  // Quick edit budget modal state
  const [editBudgetModalOpen, setEditBudgetModalOpen] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState('');
  const [rebalanceCats, setRebalanceCats] = useState(true);
  const [budgetUpdating, setBudgetUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, catsRes, expRes, pmtRes, taskRes] = await Promise.all([
        api.getBudgetSummary(),
        api.getCategories(),
        api.getExpenses({ sort_by: 'created_at', order: 'desc' }),
        api.getPaymentReminders(),
        api.getTasks()
      ]);

      setSummary(sumRes);
      setCategories(catsRes.categories || []);
      setRecentExpenses((expRes.expenses || []).slice(0, 6));
      setUpcomingPayments(pmtRes.upcoming || []);
      setUrgentTasks((taskRes.tasks || []).filter(t => !t.is_completed).slice(0, 4));
      setNewBudgetVal(sumRes.total_budget || 2500000);
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.toggleTask(taskId);
      onShowToast('Task status updated!', 'success');
      fetchDashboardData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const toggleCategoryExpand = (catId) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleQuickUpdateBudget = async (e) => {
    e.preventDefault();
    const val = parseFloat(newBudgetVal);
    if (!val || val <= 0) {
      onShowToast('Please enter a valid budget amount.', 'error');
      return;
    }

    try {
      setBudgetUpdating(true);
      await api.quickUpdateBudget({
        total_budget: val,
        rebalance_categories: rebalanceCats
      });
      setEditBudgetModalOpen(false);
      onShowToast('Wedding budget updated successfully!', 'success');
      fetchDashboardData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setBudgetUpdating(false);
    }
  };

  if (loading || !summary) {
    return (
      <div style={{ padding: '90px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
          Organizing your wedding financials...
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Syncing categories, payment milestones, and real ledger data
        </div>
      </div>
    );
  }

  const currencySymbol = summary.currency_symbol || '₹';
  const currencyCode = summary.currency_code || 'INR';
  const overbudgetCats = summary.overbudget_categories || [];

  // Determine overall status
  let healthStatus = { label: 'On Track', color: 'var(--color-success)', bg: 'var(--color-success-bg)' };
  if (summary.spend_progress_pct > 100) {
    healthStatus = { label: 'Budget Exceeded', color: 'var(--color-danger)', bg: 'var(--color-danger-bg)' };
  } else if (summary.spend_progress_pct >= 90) {
    healthStatus = { label: 'Near Limit', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' };
  }

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '36px 0 80px 0' }}>
      <div className="max-w-7xl">
        
        {/* EDITORIAL HERO BANNER: COUPLE & COUNTDOWN */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                Couples Financial Dashboard
              </span>
              {summary.days_remaining !== null && (
                <span className="badge" style={{ backgroundColor: 'var(--color-blush-light)', color: 'var(--color-burgundy)', border: '1px solid var(--color-blush)' }}>
                  💍 {summary.days_remaining > 0 ? `${summary.days_remaining} days to go` : 'Wedding Day Celebration!'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.3rem', color: 'var(--color-burgundy)', lineHeight: 1.15 }}>
              {user?.partner1_name} & {user?.partner2_name}'s Wedding Budget
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
              <span>📍 {user?.city || 'Destination Wedding'}</span>
              <span>•</span>
              <span>📅 {formatDate(user?.wedding_date)}</span>
              <span>•</span>
              <span>✨ {user?.wedding_style || 'Classic Elegance'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setEditBudgetModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '0.86rem', padding: '8px 16px' }}
            >
              <Edit2 size={14} />
              <span>Edit Total Budget</span>
            </button>
            <button
              onClick={onOpenAddExpense}
              className="btn-primary"
              style={{ fontSize: '0.86rem', padding: '9px 18px' }}
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* OVERSPENDING ALERT BANNER */}
        {overbudgetCats.length > 0 && (
          <div style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(180, 54, 71, 0.28)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '26px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <AlertTriangle size={20} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '0.94rem', marginBottom: '4px' }}>
                Budget Warning: {overbudgetCats.length} category exceeds allocated target
              </div>
              <div style={{ fontSize: '0.86rem', color: '#6A232D', lineHeight: 1.5 }}>
                {overbudgetCats.map((ob, idx) => (
                  <span key={idx}>
                    <strong>{ob.name}</strong> committed {formatCurrency(ob.actual, currencyCode, currencySymbol)} (allocated: {formatCurrency(ob.allocated_amount, currencyCode, currencySymbol)}).
                    {idx < overbudgetCats.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ZOLA-INSPIRED 4 KEY FINANCIAL PILLARS STRIP */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {/* 1. Total Target Budget */}
          <div className="stat-tile" style={{ '--tile-accent': 'var(--color-burgundy)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Total Target Budget</span>
              <button 
                onClick={() => setEditBudgetModalOpen(true)}
                style={{ color: 'var(--color-text-muted)', padding: '2px' }} 
                title="Edit Target Budget"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <span className="stat-value tabular-nums" style={{ color: 'var(--color-burgundy)' }}>
              {formatCurrency(summary.total_budget, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Contingency Reserve: {formatCurrency(summary.contingency_fund, currencyCode, currencySymbol)} ({summary.contingency_percent}%)
            </div>
          </div>

          {/* 2. Committed & Spent */}
          <div className="stat-tile" style={{ '--tile-accent': '#C6A37A' }}>
            <span className="stat-label">Committed Spent</span>
            <span className="stat-value tabular-nums" style={{ color: '#7E5B2E' }}>
              {formatCurrency(summary.total_actual, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Estimated: {formatCurrency(summary.total_estimated, currencyCode, currencySymbol)}
            </div>
          </div>

          {/* 3. Paid So Far */}
          <div className="stat-tile" style={{ '--tile-accent': 'var(--color-success)' }}>
            <span className="stat-label">Cleared & Paid</span>
            <span className="stat-value tabular-nums" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(summary.total_paid, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Pending Due: <strong>{formatCurrency(summary.total_pending, currencyCode, currencySymbol)}</strong>
            </div>
          </div>

          {/* 4. Remaining Balance */}
          <div className="stat-tile" style={{ '--tile-accent': summary.remaining_budget >= 0 ? '#43708D' : 'var(--color-danger)' }}>
            <span className="stat-label">Remaining Balance</span>
            <span className="stat-value tabular-nums" style={{ color: summary.remaining_budget >= 0 ? '#43708D' : 'var(--color-danger)' }}>
              {formatCurrency(summary.remaining_budget, currencyCode, currencySymbol)}
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {summary.remaining_budget >= 0 ? 'Available surplus buffer' : 'Over budget allocation'}
            </div>
          </div>
        </div>

        {/* ZOLA SIGNATURE SPENDING METER PROGRESS BAR */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span className="badge" style={{ backgroundColor: healthStatus.bg, color: healthStatus.color, marginBottom: '4px' }}>
                {healthStatus.label}
              </span>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-burgundy)' }}>
                Budget Spending Pulse
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>
                {summary.spend_progress_pct}%
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                of budget committed
              </span>
            </div>
          </div>

          {/* Segmented Meter Bar */}
          <div style={{
            width: '100%',
            height: '14px',
            backgroundColor: 'var(--color-ivory)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            position: 'relative'
          }}>
            {/* Cleared Paid segment */}
            <div style={{
              width: `${Math.min(100, (summary.total_paid / summary.total_budget) * 100)}%`,
              backgroundColor: 'var(--color-success)',
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 2,
              transition: 'width 0.5s ease'
            }} />
            {/* Total Committed (includes pending) segment */}
            <div style={{
              width: `${Math.min(100, (summary.total_actual / summary.total_budget) * 100)}%`,
              backgroundColor: summary.spend_progress_pct > 100 ? 'var(--color-danger)' : 'var(--color-burgundy)',
              opacity: 0.65,
              height: '100%',
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 1,
              transition: 'width 0.5s ease'
            }} />
          </div>

          {/* Meter Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
              <span>Paid Out ({formatCurrency(summary.total_paid, currencyCode, currencySymbol)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--color-burgundy)', opacity: 0.75 }} />
              <span>Committed Pending ({formatCurrency(summary.total_pending, currencyCode, currencySymbol)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-border)' }} />
              <span>Available Remaining ({formatCurrency(summary.remaining_budget, currencyCode, currencySymbol)})</span>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN SECTION: CATEGORY DRILL-DOWN + UPCOMING MILESTONES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '28px',
          marginBottom: '32px'
        }}>
          
          {/* Column 1: Category Budget Breakdown with Accordion */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)' }}>
                  Category Spending Blueprint
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Click category to view items or track headroom
                </div>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                style={{ fontSize: '0.82rem', color: 'var(--color-burgundy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>All Expenses</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
              {categories.map((c) => {
                const pctUsed = c.allocated_amount > 0 ? (c.total_actual / c.allocated_amount) * 100 : 0;
                const isOver = c.total_actual > c.allocated_amount;
                const headroom = c.allocated_amount - c.total_actual;
                const isExpanded = !!expandedCats[c.id];

                return (
                  <div key={c.id} style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isOver ? 'var(--color-danger-bg)' : 'var(--color-ivory)',
                    border: `1px solid ${isOver ? 'rgba(180, 54, 71, 0.22)' : 'var(--color-border-light)'}`,
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Header Row */}
                    <div 
                      onClick={() => toggleCategoryExpand(c.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.color || 'var(--color-burgundy)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          ({c.allocation_percent}%)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge" style={{
                          backgroundColor: headroom >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                          color: headroom >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                          fontSize: '0.7rem'
                        }}>
                          {headroom >= 0 ? `+${formatCurrency(headroom, currencyCode, currencySymbol)} left` : `-${formatCurrency(Math.abs(headroom), currencyCode, currencySymbol)} over`}
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#EAE1D7',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        width: `${Math.min(100, pctUsed)}%`,
                        backgroundColor: isOver ? 'var(--color-danger)' : (c.color || 'var(--color-burgundy)'),
                        height: '100%'
                      }} />
                    </div>

                    {/* Summary row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      <span>Committed: <strong>{formatCurrency(c.total_actual, currencyCode, currencySymbol)}</strong></span>
                      <span>Allocated: <strong>{formatCurrency(c.allocated_amount, currencyCode, currencySymbol)}</strong></span>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {c.expense_count || 0} Items Recorded
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddExpense();
                            }}
                            className="btn-sage"
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                          >
                            <Plus size={12} />
                            <span>Add item</span>
                          </button>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          Paid to date: <strong>{formatCurrency(c.total_paid, currencyCode, currencySymbol)}</strong> • Pending: <strong>{formatCurrency(c.pending_amount, currencyCode, currencySymbol)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Upcoming Payment Deadlines & Tasks */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)' }}>
                  Upcoming Milestone Deadlines
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Next 30 days scheduled payments
                </div>
              </div>
              <button
                onClick={() => onNavigate('vendors')}
                style={{ fontSize: '0.82rem', color: 'var(--color-burgundy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Vendor Ledger</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Upcoming Payments List */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {upcomingPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--color-success)" style={{ margin: '0 auto 8px auto' }} />
                  <div>All current milestone payments are settled!</div>
                </div>
              ) : (
                upcomingPayments.slice(0, 4).map((p) => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-ivory)',
                    border: '1px solid var(--color-border-light)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                        {p.payment_title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {p.vendor_name ? `Vendor: ${p.vendor_name}` : 'General'} • Due: {formatDate(p.due_date)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--color-burgundy)' }}>
                        {formatCurrency(p.amount, currencyCode, currencySymbol)}
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                        Due Soon
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Urgent Checklist Milestones */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
                  Immediate Tasks Requiring Attention
                </span>
                <button
                  onClick={() => onNavigate('checklist')}
                  style={{ fontSize: '0.78rem', color: 'var(--color-burgundy)', textDecoration: 'underline' }}
                >
                  Full Checklist
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {urgentTasks.slice(0, 3).map((t) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-ivory-light)'
                  }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggleTask(t.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--color-burgundy)' }}
                    />
                    <span style={{ color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                    <span className="badge badge-priority-must" style={{ fontSize: '0.64rem' }}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: RECENT EXPENSES TABLE PREVIEW */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)' }}>
                Recent Expense Entries
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Latest recorded quotations and payments
              </div>
            </div>
            <button
              onClick={() => onNavigate('expenses')}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              <span>Manage All Expenses</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Expense Item</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Actual Amount</th>
                  <th>Amount Paid</th>
                  <th>Pending Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                      No expenses logged yet. Click "Add Expense" to start building your ledger!
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 600 }}>{exp.title}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: `${exp.category_color}18`, color: exp.category_color || 'var(--color-burgundy)' }}>
                          {exp.category_name}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{exp.vendor_name || '—'}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-burgundy)' }}>
                        {formatCurrency(exp.actual_amount, currencyCode, currencySymbol)}
                      </td>
                      <td className="tabular-nums" style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                        {formatCurrency(exp.amount_paid, currencyCode, currencySymbol)}
                      </td>
                      <td className="tabular-nums" style={{ color: exp.pending_amount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                        {formatCurrency(exp.pending_amount, currencyCode, currencySymbol)}
                      </td>
                      <td>
                        <span className={`badge badge-${exp.payment_status}`}>
                          {exp.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: QUICK UPDATE TOTAL BUDGET */}
        {editBudgetModalOpen && (
          <div className="modal-overlay" onClick={() => setEditBudgetModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '28px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                Adjust Target Wedding Budget
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
                Update your overall wedding budget figure. Category amounts will automatically rebalance proportionally.
              </p>

              <form onSubmit={handleQuickUpdateBudget}>
                <div className="form-group">
                  <label className="form-label">Total Budget ({currencySymbol})</label>
                  <input
                    type="number"
                    step="10000"
                    min="50000"
                    className="form-input"
                    value={newBudgetVal}
                    onChange={(e) => setNewBudgetVal(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Formatted: {formatCurrency(parseFloat(newBudgetVal) || 0, currencyCode, currencySymbol)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="checkbox"
                    id="rebalanceCheck"
                    checked={rebalanceCats}
                    onChange={(e) => setRebalanceCats(e.target.checked)}
                    style={{ accentColor: 'var(--color-burgundy)' }}
                  />
                  <label htmlFor="rebalanceCheck" style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    Automatically rebalance category budgets based on established %
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={budgetUpdating} className="btn-primary" style={{ flex: 1 }}>
                    {budgetUpdating ? 'Updating...' : 'Update Budget'}
                  </button>
                  <button type="button" onClick={() => setEditBudgetModalOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
