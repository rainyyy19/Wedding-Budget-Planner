import React, { useState } from 'react';
import { Heart, X, Sparkles, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function AuthModal({ 
  mode = 'login', // 'login' or 'register'
  onClose, 
  onSuccess,
  onShowToast,
  onOpenDemo
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [guestCount, setGuestCount] = useState(200);
  const [totalBudget, setTotalBudget] = useState(2500000);
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (currentMode === 'login') {
        const res = await api.login({ email, password });
        setAuthToken(res.token);
        onSuccess(res.user);
        onShowToast('Welcome back to Aura & Vow!', 'success');
      } else {
        const res = await api.register({
          email,
          password,
          partner1_name: partner1 || 'Partner 1',
          partner2_name: partner2 || 'Partner 2',
          wedding_date: weddingDate,
          city,
          guest_count: guestCount,
          total_budget: totalBudget,
          currency_code: currencyCode,
          currency_symbol: currencySymbol
        });
        setAuthToken(res.token);
        onSuccess(res.user);
        onShowToast('Account created successfully! Welcome to your wedding planner.', 'success');
      }
      onClose();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: currentMode === 'register' ? '560px' : '440px', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-burgundy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Heart size={18} fill="#FFFFFF" stroke="none" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--color-burgundy)', lineHeight: 1.1 }}>
                {currentMode === 'login' ? 'Sign In to Aura & Vow' : 'Create Your Wedding Vault'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Private, secure couples financial workspace
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 1-Click Live Demo Shortcut Banner */}
        <div style={{
          backgroundColor: 'var(--color-gold-light)',
          border: '1px solid rgba(196, 164, 124, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#6A4A20' }}>
              Want to see a real sample wedding first?
            </div>
            <div style={{ fontSize: '0.74rem', color: '#7E6139' }}>
              Explore Kabir & Aanya's pre-filled budget with 1 click.
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenDemo();
            }}
            className="btn-gold"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Sparkles size={13} />
            <span>Try Demo</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {currentMode === 'register' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Partner 1 Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aanya"
                    value={partner1}
                    onChange={(e) => setPartner1(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Partner 2 Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kabir"
                    value={partner2}
                    onChange={(e) => setPartner2(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Wedding Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City / Destination</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Udaipur"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Guest Count</label>
                  <input
                    type="number"
                    min="10"
                    className="form-input"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Budget (INR ₹)</label>
                  <input
                    type="number"
                    step="50000"
                    min="100000"
                    className="form-input"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@wedding.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px' }}
          >
            {loading ? 'Processing...' : currentMode === 'login' ? 'Sign In to Your Budget' : 'Create Wedding Budget Plan'}
          </button>
        </form>

        {/* Switch Mode Footer */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
          {currentMode === 'login' ? (
            <div>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setCurrentMode('register')}
                style={{ color: 'var(--color-burgundy)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Create one free
              </button>
            </div>
          ) : (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setCurrentMode('login')}
                style={{ color: 'var(--color-burgundy)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
