import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function RecordPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  expense, 
  user, 
  onShowToast 
}) {
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      const remaining = Math.max(0, (expense.actual_amount || 0) - (expense.amount_paid || 0));
      setPayAmount(remaining.toString());
      setNotes(`Installment towards ${expense.title}`);
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const currencySymbol = user?.currency_symbol || '₹';
  const currencyCode = user?.currency_code || 'INR';

  const currentPaid = expense.amount_paid || 0;
  const actualAmount = expense.actual_amount || 0;
  const remaining = Math.max(0, actualAmount - currentPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount);
    if (!amountVal || amountVal <= 0) {
      onShowToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Create a payment record
      await api.createPayment({
        payment_title: `Payment: ${expense.title}`,
        amount: amountVal,
        due_date: payDate,
        vendor_id: expense.vendor_id || null,
        expense_id: expense.id,
        payment_method: paymentMethod,
        notes: notes || 'Direct expense payment recorded'
      });

      // 2. Update the expense amount_paid
      const newPaid = currentPaid + amountVal;
      await api.updateExpense(expense.id, {
        amount_paid: newPaid
      });

      onShowToast(`Recorded payment of ${formatCurrency(amountVal, currencyCode, currencySymbol)}!`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '30px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--color-burgundy)' }}>
              Record Expense Payment
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {expense.title}
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Financial Context */}
        <div style={{
          backgroundColor: 'var(--color-ivory)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '20px',
          border: '1px solid var(--color-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          textAlign: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>Total Quoted</span>
            <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>{formatCurrency(actualAmount, currencyCode, currencySymbol)}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>Already Paid</span>
            <span style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--color-success)' }}>{formatCurrency(currentPaid, currencyCode, currencySymbol)}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block' }}>Pending Due</span>
            <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--color-warning)' }}>{formatCurrency(remaining, currencyCode, currencySymbol)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Amount to Release ({currencySymbol})</label>
            <input
              type="number"
              step="500"
              min="1"
              max={remaining}
              className="form-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setPayAmount(remaining.toString())}
                style={{ fontSize: '0.74rem', color: 'var(--color-burgundy)', textDecoration: 'underline' }}
              >
                Full Remaining ({formatCurrency(remaining, currencyCode, currencySymbol)})
              </button>
              <button
                type="button"
                onClick={() => setPayAmount((Math.round(remaining / 2)).toString())}
                style={{ fontSize: '0.74rem', color: 'var(--color-burgundy)', textDecoration: 'underline' }}
              >
                50% Milestone ({formatCurrency(Math.round(remaining / 2), currencyCode, currencySymbol)})
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date of Payment</label>
              <input
                type="date"
                className="form-input"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash Envelope</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UTR / NEFT Reference number"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1 }}
            >
              <Check size={16} />
              <span>{loading ? 'Recording...' : 'Record Payment Now'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
