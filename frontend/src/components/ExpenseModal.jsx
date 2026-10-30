import React, { useState, useEffect } from 'react';
import { X, Receipt, Check, DollarSign } from 'lucide-react';
import { api } from '../services/api';

export default function ExpenseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  expenseToEdit, 
  user, 
  onShowToast 
}) {
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('must-have');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      if (expenseToEdit) {
        setTitle(expenseToEdit.title || '');
        setCategoryId(expenseToEdit.category_id || '');
        setVendorId(expenseToEdit.vendor_id || '');
        setEstimatedAmount(expenseToEdit.estimated_amount || '');
        setActualAmount(expenseToEdit.actual_amount || '');
        setAmountPaid(expenseToEdit.amount_paid || '0');
        setDueDate(expenseToEdit.due_date || '');
        setPriority(expenseToEdit.priority || 'must-have');
        setNotes(expenseToEdit.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, expenseToEdit]);

  const loadDependencies = async () => {
    try {
      const [catRes, venRes] = await Promise.all([
        api.getCategories(),
        api.getVendors()
      ]);
      setCategories(catRes.categories || []);
      setVendors(venRes.vendors || []);
      if (!expenseToEdit && catRes.categories?.length > 0) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setVendorId('');
    setEstimatedAmount('');
    setActualAmount('');
    setAmountPaid('0');
    setDueDate(new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]);
    setPriority('must-have');
    setNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !categoryId) {
      onShowToast('Title and Category are required.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      title,
      category_id: parseInt(categoryId),
      vendor_id: vendorId ? parseInt(vendorId) : null,
      estimated_amount: parseFloat(estimatedAmount) || 0,
      actual_amount: parseFloat(actualAmount) || parseFloat(estimatedAmount) || 0,
      amount_paid: parseFloat(amountPaid) || 0,
      due_date: dueDate,
      priority,
      notes
    };

    try {
      if (expenseToEdit) {
        await api.updateExpense(expenseToEdit.id, payload);
        onShowToast('Expense updated successfully!', 'success');
      } else {
        await api.createExpense(payload);
        onShowToast('New expense logged successfully!', 'success');
      }
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '30px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--color-burgundy)' }}>
              {expenseToEdit ? 'Edit Wedding Expense' : 'Add New Expense Item'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Record quotes, advance deposits, and due dates
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Expense Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Royal Banquet Hall Booking, Candid Photography"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Vendor (Optional)</label>
              <select
                className="form-select"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="">No vendor assigned</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.service_type})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Estimated Budget ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                className="form-input"
                placeholder="e.g. 250000"
                value={estimatedAmount}
                onChange={(e) => {
                  setEstimatedAmount(e.target.value);
                  if (!actualAmount) setActualAmount(e.target.value);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Actual / Quoted Amount ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                className="form-input"
                placeholder="e.g. 260000"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Amount Already Paid ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                min="0"
                className="form-input"
                placeholder="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Priority Level</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="must-have">Must-Have (Essential Foundation)</option>
              <option value="nice-to-have">Nice-to-Have (Enhancement)</option>
              <option value="luxury">Luxury (Optional Upgrade)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Inclusions (Optional)</label>
            <textarea
              rows="3"
              className="form-textarea"
              placeholder="e.g. Includes stage lighting, floral centerpieces & sound check"
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
              <span>{loading ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Create Expense'}</span>
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
