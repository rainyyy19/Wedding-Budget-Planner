import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar as CalendarIcon, Plus, Phone, Mail, Globe, 
  CreditCard, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Trash2, Edit2, DollarSign, ArrowUpRight, Bell, CalendarDays
} from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api';

export default function VendorsPage({ 
  user, 
  onOpenAddVendor, 
  onEditVendor, 
  onRecordNewPayment, 
  onShowToast 
}) {
  const [activeSubTab, setActiveSubTab] = useState('vendors'); // 'vendors' or 'payments' or 'calendar'
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState({ overdue: [], upcoming: [], in_app_only: true });

  // Mark as paid modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPaymentToPay, setSelectedPaymentToPay] = useState(null);
  const [payForm, setPayForm] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer'
  });

  // Calendar month state
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes, rRes] = await Promise.all([
        api.getVendors(),
        api.getPayments(),
        api.getPaymentReminders()
      ]);
      setVendors(vRes.vendors || []);
      setPayments(pRes.payments || []);
      setReminders(rRes || { overdue: [], upcoming: [], in_app_only: true });
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (!window.confirm(`Delete vendor "${name}"?`)) return;
    try {
      await api.deleteVendor(id);
      onShowToast('Vendor deleted.', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this scheduled payment record?')) return;
    try {
      await api.deletePayment(id);
      onShowToast('Payment record deleted.', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const openMarkPaidModal = (pmt) => {
    setSelectedPaymentToPay(pmt);
    setPayForm({
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: pmt.payment_method || 'Bank Transfer'
    });
    setPayModalOpen(true);
  };

  const handleConfirmMarkPaid = async (e) => {
    e.preventDefault();
    if (!selectedPaymentToPay) return;
    try {
      await api.markPaymentPaid(selectedPaymentToPay.id, payForm);
      setPayModalOpen(false);
      onShowToast(`Payment for "${selectedPaymentToPay.payment_title}" confirmed as paid!`, 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const currencySymbol = user?.currency_symbol || '₹';
  const currencyCode = user?.currency_code || 'INR';

  // Vendor summary metrics
  const totalAgreed = vendors.reduce((s, v) => s + (v.agreed_price || 0), 0);
  const totalVendorPaid = vendors.reduce((s, v) => s + (v.total_paid || 0), 0);
  const totalVendorPending = Math.max(0, totalAgreed - totalVendorPaid);

  // Calendar generation helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const getPaymentsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return payments.filter(p => p.due_date === dateStr);
  };

  const getCountdownLabel = (dueDateStr, status) => {
    if (status === 'paid') return null;
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, type: 'danger' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', type: 'danger' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, type: 'warning' };
    } else if (diffDays <= 30) {
      return { text: `Due in ${diffDays}d`, type: 'info' };
    }
    return { text: `In ${diffDays}d`, type: 'muted' };
  };

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="max-w-7xl">
        
        {/* Top Header */}
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
              <Users size={16} />
              <span>Vendor & Payment Management</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', color: 'var(--color-burgundy)' }}>
              Partners, Contracts & Payment Schedule
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem' }}>
              Maintain contacts, agreed quotations, booking contracts, and scheduled milestone releases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onRecordNewPayment}
              className="btn-secondary"
            >
              <CreditCard size={15} />
              <span>Schedule Payment</span>
            </button>
            <button
              onClick={onOpenAddVendor}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {/* IN-APP NOTIFICATION BANNER (EXPLICIT IN-APP ONLY) */}
        <div style={{
          backgroundColor: 'var(--color-info-bg)',
          border: '1px solid rgba(62, 113, 153, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '26px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={18} color="var(--color-info)" />
            <div style={{ fontSize: '0.86rem', color: '#1B4769' }}>
              <strong>In-App Reminders Only:</strong> Payment alerts and due date notices are displayed 
              directly within Aura & Vow (external email/SMS notifications are not active).
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {reminders.overdue?.length > 0 && (
              <span className="badge badge-danger">
                {reminders.overdue.length} Overdue
              </span>
            )}
            <span className="badge badge-warning">
              {reminders.upcoming?.length || 0} Due in 30 Days
            </span>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="nav-tabs" style={{ marginBottom: '28px' }}>
          <button
            onClick={() => setActiveSubTab('vendors')}
            className={`nav-tab-btn ${activeSubTab === 'vendors' ? 'active' : ''}`}
          >
            <Users size={16} />
            <span>Vendor Directory ({vendors.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('payments')}
            className={`nav-tab-btn ${activeSubTab === 'payments' ? 'active' : ''}`}
          >
            <CreditCard size={16} />
            <span>Payment Ledger & Milestones ({payments.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`nav-tab-btn ${activeSubTab === 'calendar' ? 'active' : ''}`}
          >
            <CalendarDays size={16} />
            <span>Payment Calendar View</span>
          </button>
        </div>

        {/* TAB 1: VENDOR DIRECTORY */}
        {activeSubTab === 'vendors' && (
          <div>
            {/* Vendor Financial Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '24px'
            }}>
              <div className="stat-tile" style={{ '--tile-accent': 'var(--color-burgundy)' }}>
                <span className="stat-label">Total Agreed Contracts</span>
                <span className="stat-value">{formatCurrency(totalAgreed, currencyCode, currencySymbol)}</span>
              </div>
              <div className="stat-tile" style={{ '--tile-accent': 'var(--color-success)' }}>
                <span className="stat-label">Total Paid to Vendors</span>
                <span className="stat-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalVendorPaid, currencyCode, currencySymbol)}</span>
              </div>
              <div className="stat-tile" style={{ '--tile-accent': 'var(--color-warning)' }}>
                <span className="stat-label">Total Pending Release</span>
                <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{formatCurrency(totalVendorPending, currencyCode, currencySymbol)}</span>
              </div>
            </div>

            {/* Vendors Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {vendors.length === 0 ? (
                <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
                  <Users size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                    No vendors added yet
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Click "Add Vendor" to organize caterers, photographers, florists, and venues.
                  </p>
                  <button onClick={onOpenAddVendor} className="btn-primary">
                    <Plus size={16} />
                    <span>Add First Vendor</span>
                  </button>
                </div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Top badge & actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span className="badge" style={{ backgroundColor: `${v.category_color}18`, color: v.category_color || 'var(--color-burgundy)', marginBottom: '4px' }}>
                            {v.service_type}
                          </span>
                          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-burgundy)' }}>
                            {v.name}
                          </h3>
                        </div>
                        <span className={`badge badge-${v.booking_status === 'booked' ? 'success' : v.booking_status === 'declined' ? 'danger' : 'warning'}`}>
                          {v.booking_status}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                        {v.contact_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Contact:</span> {v.contact_name}
                          </div>
                        )}
                        {v.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={13} color="var(--color-text-muted)" />
                            <a href={`tel:${v.phone}`} style={{ color: 'var(--color-burgundy)', textDecoration: 'underline' }}>{v.phone}</a>
                          </div>
                        )}
                        {v.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={13} color="var(--color-text-muted)" />
                            <a href={`mailto:${v.email}`} style={{ color: 'var(--color-burgundy)', textDecoration: 'underline' }}>{v.email}</a>
                          </div>
                        )}
                        {v.website && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={13} color="var(--color-text-muted)" />
                            <a href={v.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-burgundy)', textDecoration: 'underline' }}>
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>

                      {v.notes && (
                        <div style={{
                          backgroundColor: 'var(--color-ivory)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          marginBottom: '16px',
                          border: '1px solid var(--color-border-light)'
                        }}>
                          "{v.notes}"
                        </div>
                      )}
                    </div>

                    {/* Financial details & buttons */}
                    <div style={{ paddingTop: '14px', borderTop: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>Quotation</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(v.quotation_amount, currencyCode, currencySymbol)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block' }}>Agreed Price</span>
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>
                            {formatCurrency(v.agreed_price, currencyCode, currencySymbol)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => onEditVendor(v)}
                            style={{ color: 'var(--color-burgundy)', padding: '4px' }}
                            title="Edit Vendor"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v.id, v.name)}
                            style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                            title="Delete Vendor"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.76rem' }}>
                          Paid: <strong>{formatCurrency(v.total_paid, currencyCode, currencySymbol)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT LEDGER & MILESTONES */}
        {activeSubTab === 'payments' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment Title & Notes</th>
                    <th>Vendor / Service</th>
                    <th>Linked Expense</th>
                    <th>Amount Due</th>
                    <th>Due Date</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        No scheduled payments found. Click "Schedule Payment" to add deposits or milestone installments.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isPaid = p.status === 'paid';
                      const isOverdue = p.computed_status === 'overdue';
                      const countdown = getCountdownLabel(p.due_date, p.status);

                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {p.payment_title}
                            </div>
                            {p.notes && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                                {p.notes}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {p.vendor_name || '—'}
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {p.expense_title || '—'}
                          </td>
                          <td className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-burgundy)' }}>
                            {formatCurrency(p.amount, currencyCode, currencySymbol)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{formatDate(p.due_date)}</span>
                              {countdown && (
                                <span className={`badge ${countdown.type === 'danger' ? 'badge-danger' : countdown.type === 'warning' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                                  {countdown.text}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {p.payment_method || 'Bank Transfer'}
                          </td>
                          <td>
                            <span className={`badge badge-${isPaid ? 'paid' : isOverdue ? 'unpaid' : 'partial'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              {!isPaid ? (
                                <button
                                  onClick={() => openMarkPaidModal(p)}
                                  className="btn-sage"
                                  style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                  title="Explicit user confirmation required"
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Mark Paid</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>
                                  Paid on {formatDate(p.paid_date)}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                                title="Delete payment"
                              >
                                <Trash2 size={15} />
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
        )}

        {/* TAB 3: INTERACTIVE PAYMENT CALENDAR VIEW */}
        {activeSubTab === 'calendar' && (
          <div className="card">
            {/* Calendar Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)' }}>
                  {monthName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Payment due date calendar tracker
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                  className="btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Previous Month
                </button>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                  className="btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  Next Month
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i} style={{ padding: '8px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar Grid Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {daysArray.map((day, idx) => {
                const dayPayments = getPaymentsForDate(day);
                const hasPayments = dayPayments.length > 0;

                return (
                  <div key={idx} style={{
                    minHeight: '85px',
                    backgroundColor: day ? (hasPayments ? 'var(--color-blush-light)' : 'var(--color-ivory)') : 'transparent',
                    border: day ? (hasPayments ? '1px solid var(--color-burgundy)' : '1px solid var(--color-border-light)') : 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {day && (
                      <>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: hasPayments ? 'var(--color-burgundy)' : 'var(--color-text-secondary)' }}>
                          {day}
                        </div>
                        {hasPayments && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {dayPayments.map((dp, pidx) => (
                              <div key={pidx} style={{
                                backgroundColor: dp.status === 'paid' ? 'var(--color-success)' : 'var(--color-burgundy)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontSize: '0.68rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }} title={`${dp.payment_title} - ${formatCurrency(dp.amount, currencyCode, currencySymbol)}`}>
                                {dp.payment_title} ({formatCurrency(dp.amount, currencyCode, currencySymbol)})
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL: EXPLICIT USER ACTION CONFIRMATION TO MARK PAYMENT PAID */}
        {payModalOpen && selectedPaymentToPay && (
          <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
                Confirm Payment Release
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Payments are never auto-completed. Confirm the transaction details below to update 
                your vendor ledger and linked expense balance.
              </p>

              <div style={{
                backgroundColor: 'var(--color-ivory)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedPaymentToPay.payment_title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Vendor: {selectedPaymentToPay.vendor_name || 'General'}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-burgundy)', marginTop: '6px' }}>
                  {formatCurrency(selectedPaymentToPay.amount, currencyCode, currencySymbol)}
                </div>
              </div>

              <form onSubmit={handleConfirmMarkPaid}>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={payForm.paid_date}
                    onChange={(e) => setPayForm({ ...payForm, paid_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method Used</label>
                  <select
                    className="form-select"
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Cash">Cash / Cash Envelope</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Mark as Paid</span>
                  </button>
                  <button type="button" onClick={() => setPayModalOpen(false)} className="btn-secondary">
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
