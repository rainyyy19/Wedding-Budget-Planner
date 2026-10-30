import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';
import { api } from '../services/api';

export default function VendorModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  vendorToEdit, 
  user, 
  onShowToast 
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('Venue & Banquets');
  const [categoryId, setCategoryId] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [quotationAmount, setQuotationAmount] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [bookingStatus, setBookingStatus] = useState('shortlisted');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (vendorToEdit) {
        setName(vendorToEdit.name || '');
        setServiceType(vendorToEdit.service_type || 'Venue & Banquets');
        setCategoryId(vendorToEdit.category_id || '');
        setContactName(vendorToEdit.contact_name || '');
        setPhone(vendorToEdit.phone || '');
        setEmail(vendorToEdit.email || '');
        setWebsite(vendorToEdit.website || '');
        setQuotationAmount(vendorToEdit.quotation_amount || '');
        setAgreedPrice(vendorToEdit.agreed_price || '');
        setBookingStatus(vendorToEdit.booking_status || 'shortlisted');
        setNotes(vendorToEdit.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, vendorToEdit]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
      if (!vendorToEdit && res.categories?.length > 0) {
        setCategoryId(res.categories[0].id);
      }
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setServiceType('Venue & Banquets');
    setContactName('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setQuotationAmount('');
    setAgreedPrice('');
    setBookingStatus('shortlisted');
    setNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !serviceType) {
      onShowToast('Vendor name and service type are required.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      service_type: serviceType,
      category_id: categoryId ? parseInt(categoryId) : null,
      contact_name: contactName,
      phone,
      email,
      website,
      quotation_amount: parseFloat(quotationAmount) || 0,
      agreed_price: parseFloat(agreedPrice) || parseFloat(quotationAmount) || 0,
      booking_status: bookingStatus,
      notes
    };

    try {
      if (vendorToEdit) {
        await api.updateVendor(vendorToEdit.id, payload);
        onShowToast('Vendor updated successfully!', 'success');
      } else {
        await api.createVendor(payload);
        onShowToast('Vendor registered successfully!', 'success');
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
              {vendorToEdit ? 'Edit Wedding Vendor' : 'Register New Vendor'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Store contact details, quotations, and agreed contracts
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Vendor / Company Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. The Grand Palace, Lumière Photography"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Venue, Catering, Photography"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Linked Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Contact Person Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Singhania"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 98110 24890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. events@palace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website or Portfolio</label>
              <input
                type="url"
                className="form-input"
                placeholder="e.g. https://instagram.com/artist"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Initial Quotation ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                className="form-input"
                placeholder="e.g. 500000"
                value={quotationAmount}
                onChange={(e) => {
                  setQuotationAmount(e.target.value);
                  if (!agreedPrice) setAgreedPrice(e.target.value);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Final Agreed Contract Price ({user?.currency_symbol || '₹'})</label>
              <input
                type="number"
                step="500"
                className="form-input"
                placeholder="e.g. 480000"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Booking Contract Status</label>
            <select
              className="form-select"
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
            >
              <option value="shortlisted">Shortlisted / Under Evaluation</option>
              <option value="inquiry">Initial Inquiry Sent</option>
              <option value="booked">Booked & Contract Signed</option>
              <option value="completed">Completed / Settled</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Deliverables & Contract Terms (Optional)</label>
            <textarea
              rows="3"
              className="form-textarea"
              placeholder="e.g. 2 candid photographers, 1 drone operator, raw footage deliverables"
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
              <span>{loading ? 'Saving...' : vendorToEdit ? 'Save Vendor' : 'Add Vendor'}</span>
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
