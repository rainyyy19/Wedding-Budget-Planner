import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Filter, ArrowUpDown, Trash2, Edit2, 
  CreditCard, CheckCircle2, AlertCircle, Clock, Calendar, 
  Building2, LayoutGrid, Table as TableIcon, DollarSign, Download,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api';

export default function ExpensesPage({ 
  user, 
  onOpenAddExpense, 
  onEditExpense, 
  onRecordPayment,
  onShowToast 
}) {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  // View mode: 'table' or 'cards'
  const [viewMode, setViewMode] = useState('table');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Expanded cards in card view
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus, selectedPriority, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        api.getExpenses({
          category_id: selectedCategory,
          payment_status: selectedStatus,
          priority: selectedPriority,
          sort_by: sortBy,
          order: sortOrder,
          search: searchTerm
        }),
        api.getCategories()
      ]);
      setExpenses(expRes.expenses || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDeleteExpense = async (id, title) => {
    if (!window.confirm(`Delete expense "${title}"?`)) return;
    try {
      await api.deleteExpense(id);
      onShowToast('Expense deleted successfully.', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const toggleCategoryCardsExpand = (catId) => {
    setExpandedCards(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const currencySymbol = user?.currency_symbol || '₹';
  const currencyCode = user?.currency_code || 'INR';

  const totalFilteredEstimated = expenses.reduce((s, e) => s + (e.estimated_amount || 0), 0);
  const totalFilteredActual = expenses.reduce((s, e) => s + (e.actual_amount || 0), 0);
  const totalFilteredPaid = expenses.reduce((s, e) => s + (e.amount_paid || 0), 0);
  const totalFilteredPending = expenses.reduce((s, e) => s + (e.pending_amount || 0), 0);

  // Group expenses by category for Cards View
  const groupedByCategory = categories.map(cat => {
    const items = expenses.filter(e => e.category_id === cat.id);
    const catSpent = items.reduce((s, e) => s + (e.actual_amount || 0), 0);
    const catPaid = items.reduce((s, e) => s + (e.amount_paid || 0), 0);
    return {
      ...cat,
      items,
      spent: catSpent,
      paid: catPaid,
      pending: catSpent - catPaid,
      headroom: cat.allocated_amount - catSpent,
      isOver: catSpent > cat.allocated_amount
    };
  }).filter(cat => cat.items.length > 0 || !selectedCategory);

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '36px 0 80px 0' }}>
      <div className="max-w-7xl">
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '26px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-burgundy)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <Receipt size={15} />
              <span>Granular Expense Tracking</span>
            </div>
            <h1 style={{ fontSize: '2.3rem', color: 'var(--color-burgundy)' }}>
              Wedding Expenses & Quotations
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
              Track quoted prices, advance deposits, and settlement balances for every wedding element.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '3px'
            }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: viewMode === 'table' ? 'var(--color-burgundy)' : 'transparent',
                  color: viewMode === 'table' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  fontWeight: viewMode === 'table' ? 600 : 500
                }}
              >
                <TableIcon size={14} />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: viewMode === 'cards' ? 'var(--color-burgundy)' : 'transparent',
                  color: viewMode === 'cards' ? '#FFFFFF' : 'var(--color-text-secondary)',
                  fontWeight: viewMode === 'cards' ? 600 : 500
                }}
              >
                <LayoutGrid size={14} />
                <span>Category Cards</span>
              </button>
            </div>

            <button
              onClick={() => api.downloadCsv().catch(e => onShowToast(e.message, 'error'))}
              className="btn-secondary"
              title="Download CSV"
              style={{ fontSize: '0.84rem' }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddExpense}
              className="btn-primary"
              style={{ fontSize: '0.84rem' }}
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY METRICS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '22px'
        }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Estimated Baseline
            </div>
            <div className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {formatCurrency(totalFilteredEstimated, currencyCode, currencySymbol)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Actual Committed
            </div>
            <div className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
              {formatCurrency(totalFilteredActual, currencyCode, currencySymbol)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Amount Cleared / Paid
            </div>
            <div className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--color-success)' }}>
              {formatCurrency(totalFilteredPaid, currencyCode, currencySymbol)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Balance Due
            </div>
            <div className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: 'var(--color-warning)' }}>
              {formatCurrency(totalFilteredPending, currencyCode, currencySymbol)}
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="card" style={{ padding: '16px', marginBottom: '22px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <Search size={15} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search expense, vendor..."
                style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={loadData}
              />
            </form>

            {/* Category Filter */}
            <div>
              <select
                className="form-select"
                style={{ fontSize: '0.88rem' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                className="form-select"
                style={{ fontSize: '0.88rem' }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Payment Statuses</option>
                <option value="paid">Paid (Fully Cleared)</option>
                <option value="partial">Partial (Deposit Paid)</option>
                <option value="unpaid">Unpaid (Full Due)</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                className="form-select"
                style={{ fontSize: '0.88rem' }}
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="must-have">Must-Have</option>
                <option value="nice-to-have">Nice-to-Have</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                className="form-select"
                style={{ fontSize: '0.88rem' }}
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="due_date_asc">Due Date (Earliest)</option>
                <option value="due_date_desc">Due Date (Latest)</option>
                <option value="actual_amount_desc">Amount (Highest)</option>
                <option value="actual_amount_asc">Amount (Lowest)</option>
                <option value="title_asc">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* VIEW 1: DATA TABLE VIEW (WITH INLINE PROGRESS BARS) */}
        {viewMode === 'table' ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item & Notes</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Actual / Quote</th>
                    <th>Payment Progress</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        No expenses match your filters. Click "Add Expense" to record a new agreement!
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => {
                      const pctPaid = exp.actual_amount > 0 ? Math.min(100, Math.round((exp.amount_paid / exp.actual_amount) * 100)) : 0;

                      return (
                        <tr key={exp.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {exp.title}
                            </div>
                            {exp.notes && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {exp.notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge" style={{ backgroundColor: `${exp.category_color}18`, color: exp.category_color || 'var(--color-burgundy)' }}>
                              {exp.category_name}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              {exp.vendor_name || '—'}
                            </span>
                          </td>
                          <td className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-burgundy)' }}>
                            {formatCurrency(exp.actual_amount, currencyCode, currencySymbol)}
                          </td>
                          <td style={{ minWidth: '140px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                {formatCurrency(exp.amount_paid, currencyCode, currencySymbol)}
                              </span>
                              <span style={{ color: 'var(--color-text-muted)' }}>
                                {pctPaid}%
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '5px',
                              backgroundColor: '#EAE1D7',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${pctPaid}%`,
                                backgroundColor: pctPaid === 100 ? 'var(--color-success)' : 'var(--color-burgundy)',
                                height: '100%'
                              }} />
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ color: exp.pending_amount > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)', fontWeight: 500 }}>
                            {formatCurrency(exp.pending_amount, currencyCode, currencySymbol)}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                            {formatDate(exp.due_date)}
                          </td>
                          <td>
                            <span className={`badge badge-${exp.payment_status}`}>
                              {exp.payment_status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-priority-${exp.priority?.includes('must') ? 'must' : exp.priority?.includes('nice') ? 'nice' : 'luxury'}`}>
                              {exp.priority}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {exp.payment_status !== 'paid' && (
                                <button
                                  onClick={() => onRecordPayment(exp)}
                                  className="btn-sage"
                                  style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                  title="Record advance or partial payment"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                onClick={() => onEditExpense(exp)}
                                style={{ color: 'var(--color-burgundy)', padding: '4px' }}
                                title="Edit Expense"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                                title="Delete Expense"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW 2: ZOLA-STYLE CATEGORY ACCORDION CARDS */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {groupedByCategory.map((cat) => {
              const isOver = cat.spent > cat.allocated_amount;
              const headroom = cat.allocated_amount - cat.spent;

              return (
                <div key={cat.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color || 'var(--color-burgundy)' }} />
                      <h3 style={{ fontSize: '1.22rem', color: 'var(--color-burgundy)' }}>
                        {cat.name}
                      </h3>
                      <span className="badge" style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-border)' }}>
                        Allocated: {formatCurrency(cat.allocated_amount, currencyCode, currencySymbol)}
                      </span>
                      <span className="badge" style={{
                        backgroundColor: headroom >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: headroom >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                      }}>
                        {headroom >= 0 ? `+${formatCurrency(headroom, currencyCode, currencySymbol)} left` : `-${formatCurrency(Math.abs(headroom), currencyCode, currencySymbol)} over`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.84rem' }}>
                      <span>Committed: <strong>{formatCurrency(cat.spent, currencyCode, currencySymbol)}</strong></span>
                      <span>Paid: <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(cat.paid, currencyCode, currencySymbol)}</strong></span>
                      <span>Pending: <strong style={{ color: 'var(--color-warning)' }}>{formatCurrency(cat.pending, currencyCode, currencySymbol)}</strong></span>
                    </div>
                  </div>

                  {/* Grid of items in this category */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px'
                  }}>
                    {cat.items.map((exp) => {
                      const pctPaid = exp.actual_amount > 0 ? Math.min(100, Math.round((exp.amount_paid / exp.actual_amount) * 100)) : 0;

                      return (
                        <div key={exp.id} style={{
                          backgroundColor: 'var(--color-ivory)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-light)',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                                {exp.title}
                              </span>
                              <span className={`badge badge-${exp.payment_status}`} style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                                {exp.payment_status}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                              Vendor: <strong>{exp.vendor_name || 'Not assigned'}</strong>
                            </div>

                            {exp.notes && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                                "{exp.notes}"
                              </div>
                            )}

                            {/* Mini progress bar */}
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                                <span>Paid: {formatCurrency(exp.amount_paid, currencyCode, currencySymbol)}</span>
                                <span>{pctPaid}%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: '#E0D6CC', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${pctPaid}%`, backgroundColor: pctPaid === 100 ? 'var(--color-success)' : 'var(--color-burgundy)', height: '100%' }} />
                              </div>
                            </div>
                          </div>

                          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                                Balance Due: {formatCurrency(exp.pending_amount, currencyCode, currencySymbol)}
                              </span>
                              <span className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-burgundy)' }}>
                                {formatCurrency(exp.actual_amount, currencyCode, currencySymbol)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                                Due: {formatDate(exp.due_date)}
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {exp.payment_status !== 'paid' && (
                                  <button
                                    onClick={() => onRecordPayment(exp)}
                                    className="btn-sage"
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                  >
                                    Pay
                                  </button>
                                )}
                                <button
                                  onClick={() => onEditExpense(exp)}
                                  style={{ color: 'var(--color-burgundy)', padding: '4px' }}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                  style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
