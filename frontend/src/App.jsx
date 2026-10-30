import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import BudgetSetupPage from './components/BudgetSetupPage';
import DashboardPage from './components/DashboardPage';
import ExpensesPage from './components/ExpensesPage';
import VendorsPage from './components/VendorsPage';
import InsightsPage from './components/InsightsPage';
import ChecklistPage from './components/ChecklistPage';
import AuthModal from './components/AuthModal';
import ExpenseModal from './components/ExpenseModal';
import VendorModal from './components/VendorModal';
import PaymentModal from './components/PaymentModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import Toast from './components/Toast';
import { api, getAuthToken, removeAuthToken, setAuthToken } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('landing');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Modals state
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [expenseModal, setExpenseModal] = useState({ open: false, expense: null });
  const [vendorModal, setVendorModal] = useState({ open: false, vendor: null });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [recordPaymentModal, setRecordPaymentModal] = useState({ open: false, expense: null });

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
          setCurrentTab('dashboard');
        } else {
          removeAuthToken();
          setCurrentTab('landing');
        }
      } catch (err) {
        removeAuthToken();
        setCurrentTab('landing');
      }
    } else {
      setCurrentTab('landing');
    }
    setLoadingInitial(false);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModal({ open: true, mode });
  };

  const handleLoginDemo = async () => {
    try {
      showToast('Loading live sample wedding for Aanya & Kabir...', 'info');
      const res = await api.loginDemo();
      setAuthToken(res.token);
      setUser(res.user);
      setCurrentTab('dashboard');
      showToast('Welcome to Kabir & Aanya\'s sample wedding budget!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    removeAuthToken();
    setUser(null);
    setCurrentTab('landing');
    showToast('Signed out safely.', 'info');
  };

  if (loadingInitial) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-ivory)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--color-burgundy)', marginBottom: '8px' }}>
            Aura & Vow
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            The Art of Mindful Wedding Finance
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Universal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenDemo={handleLoginDemo}
        onOpenQuickAddExpense={() => setExpenseModal({ open: true, expense: null })}
      />

      {/* Main Page Content */}
      <main className="main-content">
        {currentTab === 'landing' && (
          <LandingPage
            onStartPlanning={() => {
              if (user) {
                setCurrentTab('setup');
              } else {
                handleOpenAuth('register');
              }
            }}
            onExploreFeatures={() => {
              const el = document.getElementById('features-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onTryDemo={handleLoginDemo}
          />
        )}

        {currentTab === 'setup' && (
          <BudgetSetupPage
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            user={user}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAddExpense={() => setExpenseModal({ open: true, expense: null })}
            onRecordPayment={(exp) => setRecordPaymentModal({ open: true, expense: exp })}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesPage
            user={user}
            onOpenAddExpense={() => setExpenseModal({ open: true, expense: null })}
            onEditExpense={(exp) => setExpenseModal({ open: true, expense: exp })}
            onRecordPayment={(exp) => setRecordPaymentModal({ open: true, expense: exp })}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'vendors' && (
          <VendorsPage
            user={user}
            onOpenAddVendor={() => setVendorModal({ open: true, vendor: null })}
            onEditVendor={(v) => setVendorModal({ open: true, vendor: v })}
            onRecordNewPayment={() => setPaymentModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsPage
            user={user}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'checklist' && (
          <ChecklistPage
            user={user}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* MODALS */}
      {authModal.open && (
        <AuthModal
          mode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: 'login' })}
          onSuccess={(u) => {
            setUser(u);
            setCurrentTab('dashboard');
          }}
          onShowToast={showToast}
          onOpenDemo={handleLoginDemo}
        />
      )}

      {expenseModal.open && (
        <ExpenseModal
          isOpen={expenseModal.open}
          expenseToEdit={expenseModal.expense}
          user={user}
          onClose={() => setExpenseModal({ open: false, expense: null })}
          onSuccess={() => {
            // Trigger refresh in whatever view is active
          }}
          onShowToast={showToast}
        />
      )}

      {vendorModal.open && (
        <VendorModal
          isOpen={vendorModal.open}
          vendorToEdit={vendorModal.vendor}
          user={user}
          onClose={() => setVendorModal({ open: false, vendor: null })}
          onSuccess={() => {}}
          onShowToast={showToast}
        />
      )}

      {paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          user={user}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {}}
          onShowToast={showToast}
        />
      )}

      {recordPaymentModal.open && (
        <RecordPaymentModal
          isOpen={recordPaymentModal.open}
          expense={recordPaymentModal.expense}
          user={user}
          onClose={() => setRecordPaymentModal({ open: false, expense: null })}
          onSuccess={() => {}}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
}
