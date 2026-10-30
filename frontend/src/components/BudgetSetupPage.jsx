import React, { useState, useEffect } from 'react';
import { 
  Calculator, Plus, Trash2, Edit2, Check, RefreshCw, 
  Info, AlertTriangle, ShieldCheck, Heart, User, DollarSign,
  Building2, Utensils, Flower2, Gem, Camera, Sparkles,
  Music, Hotel, HeartHandshake, Mail, Car, Gift, Coins, ShieldAlert
} from 'lucide-react';
import { api, formatCurrency } from '../services/api';

const ICON_MAP = {
  Building2, Utensils, Flower2, Gem, Camera, Sparkles,
  Music, Hotel, HeartHandshake, Mail, Car, Gift, Coins, ShieldAlert
};

export default function BudgetSetupPage({ user, onUpdateUser, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Setup form fields
  const [formData, setFormData] = useState({
    partner1_name: '',
    partner2_name: '',
    wedding_date: '',
    city: 'New Delhi',
    guest_count: 200,
    wedding_style: 'Royal Heritage & Modern Elegance',
    currency_code: 'INR',
    currency_symbol: '₹',
    total_budget: 2500000,
    contingency_percent: 10
  });

  // Categories list
  const [categories, setCategories] = useState([]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editPercent, setEditPercent] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Contributions list
  const [contributions, setContributions] = useState([]);
  const [showAddContrib, setShowAddContrib] = useState(false);
  const [newContrib, setNewContrib] = useState({
    contributor_name: '',
    relationship: 'Personal Savings',
    amount: '',
    is_received: 1,
    notes: ''
  });

  // Custom Category addition
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    allocation_percent: 2,
    color: '#802F48',
    description: ''
  });

  const currencyOptions = [
    { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
    { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
    { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
    { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' },
    { code: 'AED', symbol: 'د.إ', label: 'AED (د.إ) — UAE Dirham' },
    { code: 'CAD', symbol: '$', label: 'CAD ($) — Canadian Dollar' },
    { code: 'AUD', symbol: '$', label: 'AUD ($) — Australian Dollar' },
  ];

  const weddingStyles = [
    'Royal Heritage & Palace',
    'Intimate Garden Romance',
    'Beachfront Destination',
    'Modern Luxury Minimalist',
    'Traditional Classic Temple / Hall',
    'Bespoke Countryside Manor'
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const setupRes = await api.getSetup();
      if (setupRes.setup) {
        setFormData({
          partner1_name: setupRes.setup.partner1_name || '',
          partner2_name: setupRes.setup.partner2_name || '',
          wedding_date: setupRes.setup.wedding_date || '',
          city: setupRes.setup.city || '',
          guest_count: setupRes.setup.guest_count || 150,
          wedding_style: setupRes.setup.wedding_style || 'Royal Heritage & Modern Elegance',
          currency_code: setupRes.setup.currency_code || 'INR',
          currency_symbol: setupRes.setup.currency_symbol || '₹',
          total_budget: setupRes.setup.total_budget || 2500000,
          contingency_percent: setupRes.setup.contingency_percent || 10
        });
      }
      if (setupRes.contributions) {
        setContributions(setupRes.contributions);
      }

      const catsRes = await api.getCategories();
      if (catsRes.categories) {
        setCategories(catsRes.categories);
      }
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (e) => {
    const selected = currencyOptions.find(c => c.code === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        currency_code: selected.code,
        currency_symbol: selected.symbol
      }));
    }
  };

  const handleSaveSetup = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateSetup({
        ...formData,
        recalculate_categories: true
      });
      if (res.user) {
        onUpdateUser(res.user);
      }
      onShowToast('Wedding details and category budgets recalculated!', 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Edit category inline
  const startEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditPercent(cat.allocation_percent);
    setEditAmount(cat.allocated_amount);
  };

  const saveEditCategory = async (catId) => {
    try {
      await api.updateCategory(catId, {
        allocation_percent: parseFloat(editPercent) || 0,
        allocated_amount: parseFloat(editAmount) || 0
      });
      setEditingCatId(null);
      onShowToast('Category allocation updated!', 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Add contribution
  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!newContrib.contributor_name || !newContrib.amount) {
      onShowToast('Please provide a contributor name and amount.', 'error');
      return;
    }
    try {
      await api.addContribution(newContrib);
      setNewContrib({
        contributor_name: '',
        relationship: 'Personal Savings',
        amount: '',
        is_received: 1,
        notes: ''
      });
      setShowAddContrib(false);
      onShowToast('Contribution recorded successfully!', 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleDeleteContribution = async (id) => {
    if (!window.confirm('Delete this contribution record?')) return;
    try {
      await api.deleteContribution(id);
      onShowToast('Contribution deleted.', 'info');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name) {
      onShowToast('Category name is required.', 'error');
      return;
    }
    try {
      await api.createCategory(newCat);
      setNewCat({ name: '', allocation_percent: 2, color: '#802F48', description: '' });
      setShowAddCat(false);
      onShowToast('Custom category created!', 'success');
      loadData();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  // Calculate totals
  const totalAllocatedAmount = categories.reduce((sum, c) => sum + (c.allocated_amount || 0), 0);
  const totalAllocatedPercent = categories.reduce((sum, c) => sum + (c.allocation_percent || 0), 0);
  const totalContributionsAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const contingencyAmount = (formData.contingency_percent / 100) * formData.total_budget;

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-burgundy)' }}>
          Loading your wedding budget configuration...
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', padding: '40px 0 80px 0' }}>
      <div className="max-w-7xl">
        
        {/* Header Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-burgundy)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            <Calculator size={16} />
            <span>Financial Blueprint & Setup</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-burgundy)' }}>
            Wedding Setup & Budget Calculator
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '750px' }}>
            Define your celebration parameters, record family contributions, allocate customizable 
            category budgets, and protect your contingency reserve.
          </p>
        </div>

        {/* Informative Disclaimer Banner: Distinguish suggested estimates from live quotes */}
        <div style={{
          backgroundColor: 'var(--color-gold-light)',
          border: '1px solid rgba(196, 164, 124, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          marginBottom: '32px'
        }}>
          <Info size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.88rem', color: '#5A4222', lineHeight: 1.55 }}>
            <strong>Transparent Planning Benchmark:</strong> Category allocations shown below are 
            modeled on standard wedding industry distribution ratios tailored for your city and guest size. 
            They are intended as a thoughtful financial guideline, not live vendor quotes. 
            As you receive actual quotations, enter them directly in the Expenses & Vendors tab.
          </div>
        </div>

        {/* TOP ROW: WEDDING DETAILS + CONTRIBUTIONS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '28px',
          marginBottom: '36px'
        }}>
          
          {/* Card 1: Core Wedding Parameters Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={18} />
              <span>Wedding Parameters</span>
            </h3>

            <form onSubmit={handleSaveSetup}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Partner 1</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.partner1_name}
                    onChange={(e) => setFormData({ ...formData, partner1_name: e.target.value })}
                    placeholder="e.g. Aanya"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Partner 2</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.partner2_name}
                    onChange={(e) => setFormData({ ...formData, partner2_name: e.target.value })}
                    placeholder="e.g. Kabir"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Wedding Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.wedding_date}
                    onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City / Destination</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Udaipur, Delhi, Jaipur"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Guest Count</label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    className="form-input"
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-select"
                    value={formData.currency_code}
                    onChange={handleCurrencyChange}
                  >
                    {currencyOptions.map(c => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wedding Aesthetic & Style</label>
                <select
                  className="form-select"
                  value={formData.wedding_style}
                  onChange={(e) => setFormData({ ...formData, wedding_style: e.target.value })}
                >
                  {weddingStyles.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Total Budget Input */}
              <div className="form-group" style={{
                backgroundColor: 'var(--color-blush-light)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-blush)'
              }}>
                <label className="form-label" style={{ color: 'var(--color-burgundy)', fontWeight: 700 }}>
                  Total Wedding Budget ({formData.currency_symbol})
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>
                    {formData.currency_symbol}
                  </span>
                  <input
                    type="number"
                    step="10000"
                    min="100000"
                    className="form-input"
                    style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-burgundy)' }}
                    value={formData.total_budget}
                    onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                {/* Quick Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {(formData.currency_code === 'INR' 
                    ? [1500000, 2500000, 3500000, 5000000, 7500000, 10000000]
                    : [25000, 35000, 50000, 75000, 100000, 150000]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, total_budget: preset })}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        backgroundColor: formData.total_budget === preset ? 'var(--color-burgundy)' : '#FFFFFF',
                        color: formData.total_budget === preset ? '#FFFFFF' : 'var(--color-burgundy)',
                        border: '1px solid var(--color-blush)',
                        fontWeight: 600
                      }}
                    >
                      {formatCurrency(preset, formData.currency_code, formData.currency_symbol)}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  Formatted: {formatCurrency(formData.total_budget, formData.currency_code, formData.currency_symbol)}
                </div>
              </div>

              {/* Contingency Slider */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Contingency Fund Buffer
                  </label>
                  <span style={{ fontWeight: 600, color: 'var(--color-burgundy)' }}>
                    {formData.contingency_percent}% ({formatCurrency(contingencyAmount, formData.currency_code, formData.currency_symbol)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={formData.contingency_percent}
                  onChange={(e) => setFormData({ ...formData, contingency_percent: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', accentColor: 'var(--color-burgundy)' }}
                />
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  We recommend at least 10% reserved for unexpected fees, weather cover, and overtime tips.
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
              >
                <RefreshCw size={16} className={saving ? 'animate-spin' : ''} />
                <span>{saving ? 'Recalculating...' : 'Save & Recalculate Category Budgets'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Contributions & Pledges Builder */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)' }}>
                  Family & Partner Contributions
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Total Pledged: {formatCurrency(totalContributionsAmount, formData.currency_code, formData.currency_symbol)}
                </div>
              </div>
              <button
                onClick={() => setShowAddContrib(!showAddContrib)}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              >
                <Plus size={14} />
                <span>Add Pledger</span>
              </button>
            </div>

            {/* Total Contributions vs Total Budget Health Indicator */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: totalContributionsAmount >= formData.total_budget ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              border: `1px solid ${totalContributionsAmount >= formData.total_budget ? 'rgba(78, 138, 94, 0.25)' : 'rgba(184, 124, 36, 0.25)'}`,
              marginBottom: '16px',
              fontSize: '0.86rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Budget Coverage:</span>
                <span>
                  {formData.total_budget > 0 ? Math.round((totalContributionsAmount / formData.total_budget) * 100) : 0}%
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {totalContributionsAmount >= formData.total_budget ? (
                  <span>Fully funded! You have enough pledged contributions to meet your target budget.</span>
                ) : (
                  <span>
                    Difference of {formatCurrency(formData.total_budget - totalContributionsAmount, formData.currency_code, formData.currency_symbol)} to be funded from future savings.
                  </span>
                )}
              </div>
            </div>

            {/* Add contribution form */}
            {showAddContrib && (
              <form onSubmit={handleAddContribution} style={{
                backgroundColor: 'var(--color-ivory)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginBottom: '18px'
              }}>
                <h4 style={{ fontSize: '0.98rem', color: 'var(--color-burgundy)', marginBottom: '12px' }}>
                  Record New Contribution
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Contributor Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Groom's Parents"
                      value={newContrib.contributor_name}
                      onChange={(e) => setNewContrib({ ...newContrib, contributor_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Relationship / Source</label>
                    <select
                      className="form-select"
                      value={newContrib.relationship}
                      onChange={(e) => setNewContrib({ ...newContrib, relationship: e.target.value })}
                    >
                      <option value="Personal Savings">Personal Savings</option>
                      <option value="Bride's Family">Bride's Family</option>
                      <option value="Groom's Family">Groom's Family</option>
                      <option value="Partner 1">Partner 1</option>
                      <option value="Partner 2">Partner 2</option>
                      <option value="Wedding Gift">Wedding Gift</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Amount ({formData.currency_symbol})</label>
                    <input
                      type="number"
                      step="1000"
                      className="form-input"
                      placeholder="e.g. 500000"
                      value={newContrib.amount}
                      onChange={(e) => setNewContrib({ ...newContrib, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newContrib.is_received}
                      onChange={(e) => setNewContrib({ ...newContrib, is_received: parseInt(e.target.value) })}
                    >
                      <option value="1">Received / In Bank</option>
                      <option value="0">Promised / Future Pledge</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Designated for venue booking and catering"
                    value={newContrib.notes}
                    onChange={(e) => setNewContrib({ ...newContrib, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
                    Save Contribution
                  </button>
                  <button type="button" onClick={() => setShowAddContrib(false)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.86rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Contributions List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px' }}>
              {contributions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)' }}>
                  No contributions recorded yet. Click "Add Pledger" to record funds from yourselves or families.
                </div>
              ) : (
                contributions.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-ivory)',
                    border: '1px solid var(--color-border-light)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.92rem' }}>
                          {c.contributor_name}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          • {c.relationship}
                        </span>
                        <span className={`badge ${c.is_received ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                          {c.is_received ? 'Received' : 'Promised'}
                        </span>
                      </div>
                      {c.notes && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-burgundy)' }}>
                        {formatCurrency(c.amount, formData.currency_code, formData.currency_symbol)}
                      </span>
                      <button
                        onClick={() => handleDeleteContribution(c.id)}
                        style={{ color: 'var(--color-text-muted)', padding: '4px' }}
                        title="Delete contribution"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: CATEGORY-WISE SUGGESTED BUDGET ALLOCATIONS */}
        <div className="card">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--color-burgundy)' }}>
                Category-Wise Budget Allocations
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                Click on any category to manually modify percentages or amounts. Total allocations auto-rebalance.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Allocation Sum
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: totalAllocatedPercent === 100 ? 'var(--color-success)' : 'var(--color-warning)'
                }}>
                  {totalAllocatedPercent.toFixed(1)}% / 100%
                </div>
              </div>

              <button
                onClick={() => setShowAddCat(!showAddCat)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                <Plus size={15} />
                <span>Add Custom Category</span>
              </button>
            </div>
          </div>

          {/* Allocation Progress Bar */}
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: 'var(--color-ivory)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '28px',
            border: '1px solid var(--color-border)'
          }}>
            {categories.map((c, idx) => (
              <div
                key={idx}
                title={`${c.name}: ${c.allocation_percent}%`}
                style={{
                  width: `${c.allocation_percent}%`,
                  backgroundColor: c.color || '#802F48',
                  height: '100%',
                  transition: 'width 0.3s ease'
                }}
              />
            ))}
          </div>

          {/* Add custom category inline form */}
          {showAddCat && (
            <form onSubmit={handleAddCategory} style={{
              backgroundColor: 'var(--color-ivory)',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '1.05rem', color: 'var(--color-burgundy)', marginBottom: '14px' }}>
                Create Custom Category
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fireworks & Special FX"
                    value={newCat.name}
                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Allocation Percentage (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="100"
                    className="form-input"
                    value={newCat.allocation_percent}
                    onChange={(e) => setNewCat({ ...newCat, allocation_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Color Accent</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: '42px', padding: '4px' }}
                    value={newCat.color}
                    onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.86rem' }}>
                  Save Category
                </button>
                <button type="button" onClick={() => setShowAddCat(false)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.86rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid Table */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {categories.map((cat) => {
              const IconComponent = ICON_MAP[cat.icon] || Calculator;
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: isEditing ? 'var(--color-blush-light)' : '#FFFFFF',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: cat.color ? `${cat.color}20` : 'var(--color-blush-soft)',
                        color: cat.color || 'var(--color-burgundy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.96rem' }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {cat.description || 'Wedding allocation category'}
                        </div>
                      </div>
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => startEditCategory(cat)}
                        style={{ color: 'var(--color-burgundy)', padding: '4px' }}
                        title="Edit allocation"
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => saveEditCategory(cat.id)}
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                      >
                        <Check size={14} />
                        <span>Done</span>
                      </button>
                    )}
                  </div>

                  {/* Editing or Displaying Allocations */}
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                          Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                          value={editPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditPercent(val);
                            setEditAmount(Math.round((val / 100) * formData.total_budget));
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                          Amount ({formData.currency_symbol})
                        </label>
                        <input
                          type="number"
                          step="1000"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                          value={editAmount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditAmount(val);
                            if (formData.total_budget > 0) {
                              setEditPercent(((val / formData.total_budget) * 100).toFixed(1));
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--color-ivory)', border: '1px solid var(--color-border)' }}>
                        {cat.allocation_percent}% of Total
                      </span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
                        {formatCurrency(cat.allocated_amount, formData.currency_code, formData.currency_symbol)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
