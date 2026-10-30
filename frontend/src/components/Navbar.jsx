import React, { useState } from 'react';
import { 
  Heart, Calculator, LayoutDashboard, Receipt, Users, 
  TrendingUp, CheckSquare, LogOut, LogIn, Menu, X, Sparkles, UserPlus, Plus 
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  onOpenAuth, 
  onLogout,
  onOpenDemo,
  onOpenQuickAddExpense
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Heart, publicOnly: false },
    { id: 'setup', label: 'Budget Planner', icon: Calculator, publicOnly: false },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { id: 'expenses', label: 'Expenses', icon: Receipt, requiresAuth: true },
    { id: 'vendors', label: 'Vendors & Payments', icon: Users, requiresAuth: true },
    { id: 'insights', label: 'Insights', icon: TrendingUp, requiresAuth: true },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, requiresAuth: true },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract initials if available
  const p1Init = user?.partner1_name ? user.partner1_name.trim().charAt(0) : '';
  const p2Init = user?.partner2_name ? user.partner2_name.trim().charAt(0) : '';
  const coupleMonogram = p1Init && p2Init ? `${p1Init}&${p2Init}` : null;

  return (
    <header style={{
      backgroundColor: 'rgba(253, 251, 248, 0.94)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'all 0.2s ease'
    }}>
      <div className="max-w-7xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => handleNavClick('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-burgundy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 3px 10px rgba(104, 40, 62, 0.22)'
          }}>
            <Heart size={18} fill="#FFFFFF" stroke="none" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '1.42rem', 
              fontWeight: 600, 
              letterSpacing: '0.03em',
              color: 'var(--color-burgundy)',
              lineHeight: 1.1
            }}>
              Aura & Vow
            </div>
            <div style={{ 
              fontSize: '0.67rem', 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              color: 'var(--color-text-muted)' 
            }}>
              Wedding Budget Architecture
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.requiresAuth && !user) {
                    onOpenAuth('login');
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                style={{
                  padding: '7px 13px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-burgundy)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-blush-soft)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Auth / Profile Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* Monogram Couple Chip */}
              <div 
                onClick={() => handleNavClick('dashboard')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-ivory)',
                  border: '1px solid var(--color-border)'
                }}
                className="user-profile-chip"
                title={`${user.partner1_name} & ${user.partner2_name}`}
              >
                {coupleMonogram && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-burgundy)',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-serif)'
                  }}>
                    {coupleMonogram}
                  </div>
                )}
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {user.partner1_name.split(' ')[0]} & {user.partner2_name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-sage-dark)' }}>
                    {user.currency_symbol || '₹'} {user.currency_code || 'INR'}
                  </div>
                </div>
              </div>

              {/* Demo Badge */}
              {user.email === 'demo@auraandvow.com' && (
                <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>
                  Demo
                </span>
              )}

              {/* Quick Add Expense Action */}
              <button
                onClick={onOpenQuickAddExpense}
                className="btn-primary"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                title="Add Expense"
              >
                <Plus size={14} />
                <span className="hide-on-mobile">Expense</span>
              </button>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="btn-secondary"
                style={{ padding: '7px 11px', fontSize: '0.82rem' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={onOpenDemo}
                className="btn-gold"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                title="Explore Kabir & Aanya's sample wedding budget instantly"
              >
                <Sparkles size={13} />
                <span>Live Demo</span>
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                <LogIn size={13} />
                <span className="hide-on-mobile">Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <UserPlus size={13} />
                <span>Get Started</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              padding: '6px', 
              borderRadius: '8px', 
              color: 'var(--color-burgundy)',
              display: 'flex',
              alignItems: 'center'
            }}
            className="mobile-hamburger-btn"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.requiresAuth && !user) {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-burgundy)' : 'var(--color-text-primary)',
                  backgroundColor: isActive ? 'var(--color-blush-soft)' : 'transparent',
                }}
              >
                <Icon size={17} color={isActive ? 'var(--color-burgundy)' : 'var(--color-text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 992px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
          .user-profile-chip {
            padding: 3px 6px !important;
          }
        }
      `}</style>
    </header>
  );
}
