import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import { api } from '../services/api';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user, 
  onShowToast 
}) {
  const [vendors, setVendors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [paymentTitle, setPaymentTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [expenseId, setExpenseId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      setPaymentTitle('');
      setAmount('');
      setDueDate(new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]);
      setVendorId('');
      setExpenseId('');
      setPaymentMethod('Bank Transfer');
      setNotes('');
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.getVendors(),
        api.getExpenses()
      ]);
      setVendors(vRes.vendors || []);
      setExpenses(eRes.expenses || []);
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentTitle || !amount || parseFloat(amount) <= 0) {
      onShowToast('Please provide a payment title and valid amount.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      payment_title: paymentTitle,
      amount: parseFloat(amount),
      due_date: dueDate || new Date().toISOString().split('T')[0],
      vendor_id: vendorId ? parseInt(vendorId) : null,
      expense_id: expenseId ? parseInt(expenseId) : null,
      payment_method: paymentMethod,
      notes
    };

    try {
      await api.createPayment(payload);
      onShowToast('Payment milestone scheduled successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '30px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--color-burgundy)' }}>
              Schedule Milestone Payment
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Add upcoming advance, stage release, or final settlement
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Milestone Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Venue 2nd Installment (50%), Floral Advance"
              value={paymentTitle}
              onChange={(e) => setPaymentTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Amount Due ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                min="100"
                className="form-input"
                placeholder="e.g. 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Link to Vendor</label>
              <select
                className="form-select"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="">No vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Link to Expense</label>
              <select
                className="form-select"
                value={expenseId}
                onChange={(e) => setExpenseId(e.target.value)}
              >
                <option value="">No expense</option>
                {expenses.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="Cash">Cash / Cash Envelope</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              rows="2"
              className="form-textarea"
              placeholder="e.g. To be cleared after final menu tasting confirmation"
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
              <span>{loading ? 'Scheduling...' : 'Schedule Payment'}</span>
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
