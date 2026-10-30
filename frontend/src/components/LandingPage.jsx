import React, { useState } from 'react';
import { 
  Sparkles, Heart, ArrowRight, ShieldCheck, CheckCircle2, 
  HelpCircle, ChevronDown, ChevronUp, PieChart, Bell, 
  Calculator, Wallet, Award, Compass, Gift
} from 'lucide-react';
import { formatCurrency } from '../services/api';

export default function LandingPage({ 
  onStartPlanning, 
  onExploreFeatures, 
  onTryDemo 
}) {
  // Interactive mini calculator slider on hero
  const [sliderBudget, setSliderBudget] = useState(2500000);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const previewBreakdown = [
    { name: 'Venue & Banquets', pct: 24, color: '#802F48' },
    { name: 'Catering & Bar', pct: 22, color: '#C4A47C' },
    { name: 'Decoration & Floral', pct: 12, color: '#748671' },
    { name: 'Clothing & Jewellery', pct: 11, color: '#945266' },
    { name: 'Photography & Cinema', pct: 9, color: '#4A6B82' },
    { name: 'Makeup & Hair', pct: 4, color: '#D48B96' },
    { name: 'Contingency Fund', pct: 10, color: '#B8860B' },
  ];

  const faqs = [
    {
      q: "How does Aura & Vow calculate suggested wedding budget allocations?",
      a: "Our algorithm uses verified wedding planning benchmarks tailored for destination, royal heritage, and modern weddings. Allocations distribute your total budget across 14 essential categories—such as venue (24%), catering (22%), decor (12%), and outfits (11%)—with a built-in 10% contingency reserve. You maintain 100% control to adjust amounts and percentages as your priorities evolve."
    },
    {
      q: "Does this replace real vendor quotations?",
      a: "No. Aura & Vow provides intelligent planning estimates to guide your decision-making. We never invent fictitious market prices or claim real-time vendor feeds. As you meet real caterers, photographers, and venue managers, you record their actual quotations and agreed prices into your personal tracker."
    },
    {
      q: "How do partial payments and milestone deposits work?",
      a: "Most wedding vendors operate on multi-stage advance installments (e.g. 25% token advance, 50% milestone, 25% final settlement). Aura & Vow tracks each payment installment with scheduled due dates, calculates your exact remaining balance, and notifies you through in-app payment reminders."
    },
    {
      q: "Can multiple family members contribute to the total budget?",
      a: "Yes! Our contributions manager lets you log gifts, pledges, and savings from yourself, your partner, parents, or in-laws. It displays both pledged and received funds so you know exactly what capital is liquid."
    },
    {
      q: "Is my financial and personal wedding data kept private?",
      a: "Completely private. Each couple's wedding data is secured and isolated in an authenticated database with encrypted passwords. Your financial calculations and vendor notes are never shared or made public."
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        padding: '70px 0 90px 0', 
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {/* Soft background glow accents */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 197, 200, 0.45) 0%, rgba(250, 248, 245, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-80px',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196, 164, 124, 0.25) 0%, rgba(250, 248, 245, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="max-w-7xl" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '50px',
            alignItems: 'center'
          }}>
            
            {/* Left Hero Text */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-blush-light)',
                border: '1px solid var(--color-blush)',
                color: 'var(--color-burgundy)',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '20px'
              }}>
                <Sparkles size={14} />
                <span>Mindful Wedding Finance for Modern Couples</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
                lineHeight: 1.15,
                marginBottom: '22px',
                color: 'var(--color-burgundy)'
              }}>
                Your dream wedding. <br />
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#542033' }}>
                  A budget that makes sense.
                </span>
              </h1>

              <p style={{
                fontSize: '1.12rem',
                lineHeight: 1.7,
                color: 'var(--color-text-secondary)',
                marginBottom: '32px',
                maxWidth: '540px'
              }}>
                Plan every ritual, venue booking, and couture fitting with absolute financial clarity. 
                Allocate your total budget, manage milestone deposits, avoid hidden surprises, 
                and know exactly what remains at every step.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '36px' }}>
                <button
                  onClick={onStartPlanning}
                  className="btn-primary"
                  style={{ padding: '14px 30px', fontSize: '1.02rem' }}
                >
                  <span>Start Planning Free</span>
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={onTryDemo}
                  className="btn-secondary"
                  style={{ padding: '14px 26px', fontSize: '1.02rem' }}
                >
                  <Sparkles size={18} color="var(--color-gold)" />
                  <span>Try Live Demo</span>
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px', 
                paddingTop: '20px', 
                borderTop: '1px solid var(--color-border)' 
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>100%</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Transparent Formulas</div>
                </div>
                <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>14 Categories</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Complete Coverage</div>
                </div>
                <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--color-border)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>In-App Privacy</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Couples Private Vault</div>
                </div>
              </div>
            </div>

            {/* Right Hero: Interactive Mini Budget Simulator Preview */}
            <div>
              <div className="card" style={{
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: '#FFFFFF',
                padding: '30px',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--color-border-light)'
                }}>
                  <div>
                    <span className="badge badge-warning" style={{ marginBottom: '6px' }}>
                      Interactive Simulator
                    </span>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--color-burgundy)' }}>
                      Instant Budget Allocation Preview
                    </h3>
                  </div>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blush-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-burgundy)'
                  }}>
                    <Calculator size={20} />
                  </div>
                </div>

                {/* Slider Input */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Total Wedding Budget
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.55rem',
                      fontWeight: 700,
                      color: 'var(--color-burgundy)'
                    }}>
                      {formatCurrency(sliderBudget, 'INR', '₹')}
                    </span>
                  </div>

                  <input 
                    type="range"
                    min="500000"
                    max="10000000"
                    step="100000"
                    value={sliderBudget}
                    onChange={(e) => setSliderBudget(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'linear-gradient(to right, var(--color-burgundy), var(--color-blush))',
                      accentColor: 'var(--color-burgundy)',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>₹5 Lakhs</span>
                    <span>₹50 Lakhs</span>
                    <span>₹1 Crore</span>
                  </div>
                </div>

                {/* Allocation Cards Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {previewBreakdown.map((item, idx) => {
                    const amount = Math.round((item.pct / 100) * sliderBudget);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-ivory)',
                        border: '1px solid var(--color-border-light)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: item.color
                          }} />
                          <span style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                            ({item.pct}%)
                          </span>
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {formatCurrency(amount, 'INR', '₹')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={onStartPlanning}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.94rem' }}
                  >
                    Customize This Full Budget Plan
                  </button>
                  <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    Includes 14 editable categories & configurable contingency reserve
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* EDITORIAL PHOTO CALLOUT: AESTHETIC WEDDING ATMOSPHERE */}
      <section style={{ padding: '60px 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '320px',
              position: 'relative',
              boxShadow: 'var(--shadow-md)'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80" 
                alt="Romantic outdoor wedding floral venue" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(36, 26, 30, 0.75) 0%, transparent 60%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '20px',
                color: '#FFFFFF'
              }}>
                <span style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-blush)' }}>
                  Palace Venues & Lawns
                </span>
                <h4 style={{ color: '#FFFFFF', fontSize: '1.25rem' }}>Elegance without financial anxiety</h4>
              </div>
            </div>

            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '320px',
              position: 'relative',
              boxShadow: 'var(--shadow-md)'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80" 
                alt="Intimate wedding ceremony couple" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(36, 26, 30, 0.75) 0%, transparent 60%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '20px',
                color: '#FFFFFF'
              }}>
                <span style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-blush)' }}>
                  Milestone Peace of Mind
                </span>
                <h4 style={{ color: '#FFFFFF', fontSize: '1.25rem' }}>Every deposit accounted for</h4>
              </div>
            </div>

            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              height: '320px',
              position: 'relative',
              boxShadow: 'var(--shadow-md)'
            }}>
              <img 
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80" 
                alt="Bridal lehenga and jewelry detail" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(36, 26, 30, 0.75) 0%, transparent 60%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '20px',
                color: '#FFFFFF'
              }}>
                <span style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-blush)' }}>
                  Couture & Details
                </span>
                <h4 style={{ color: '#FFFFFF', fontSize: '1.25rem' }}>Priced with bespoke clarity</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES / FEATURES */}
      <section style={{ padding: '90px 0', backgroundColor: 'var(--color-ivory)' }}>
        <div className="max-w-7xl">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 60px auto' }}>
            <span style={{ 
              fontSize: '0.82rem', 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              color: 'var(--color-burgundy)', 
              fontWeight: 600 
            }}>
              Thoughtful Functionality
            </span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--color-burgundy)', margin: '10px 0 16px 0' }}>
              Everything couples need to budget with serenity
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Built specifically for modern weddings where families, vendors, and multi-stage 
              payments require elegant, dependable organization.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '28px'
          }}>
            
            {/* Feature 1 */}
            <div className="card" style={{ padding: '30px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-blush-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-burgundy)',
                marginBottom: '20px'
              }}>
                <Calculator size={22} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Algorithmic Allocations
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Set your total budget and receive tailored category suggestions across 14 categories. 
                Edit percentages freely while our engine auto-rebalances your remaining funds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card" style={{ padding: '30px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-sage-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-sage-dark)',
                marginBottom: '20px'
              }}>
                <Wallet size={22} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Advance & Partial Payments
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Record token advances, intermediate milestones, and final balances. 
                Expenses automatically transition from Unpaid to Partial to Paid as payments clear.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card" style={{ padding: '30px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-gold-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-warning)',
                marginBottom: '20px'
              }}>
                <Bell size={22} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                In-App Payment Reminders
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Never miss a vendor due date. Visual badges and countdown alerts show upcoming 
                and overdue settlements without external spam notifications.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card" style={{ padding: '30px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'var(--color-burgundy-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-burgundy)',
                marginBottom: '20px'
              }}>
                <PieChart size={22} />
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Insights & Savings Advice
              </h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Discover proactive savings tips—like floral repurposing and beverage optimizations—before 
                signing contracts. Export complete CSVs anytime for accountant reviews.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 SERENE STEPS) */}
      <section style={{ padding: '80px 0', backgroundColor: '#FFFFFF', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-burgundy)', fontWeight: 600 }}>
              Simplicity First
            </span>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--color-burgundy)', marginTop: '8px' }}>
              How Aura & Vow Works
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '30px'
          }}>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blush-soft)',
                color: 'var(--color-burgundy)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Set Your Total Budget
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Input your wedding date, destination city, guest count, and family contributions. 
                Pick INR (₹) or your preferred currency.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blush-soft)',
                color: 'var(--color-burgundy)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Track Expenses & Vendors
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Log quotes, record milestone deposits, and watch the dashboard update planned 
                versus actual spending instantly.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-blush-soft)',
                color: 'var(--color-burgundy)',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-burgundy)', marginBottom: '10px' }}>
                Celebrate with Confidence
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Walk down the aisle knowing your contingency fund is protected and every vendor 
                balance is scheduled with poise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section style={{ padding: '90px 0', backgroundColor: 'var(--color-ivory)' }}>
        <div className="max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-burgundy)', fontWeight: 600 }}>
              Clarity & Transparency
            </span>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--color-burgundy)', marginTop: '8px' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="card"
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: isOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'
                  }}
                  onClick={() => toggleFaq(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--color-burgundy)', fontWeight: 600 }}>
                      {faq.q}
                    </h4>
                    <div style={{ color: 'var(--color-burgundy)' }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-border-light)' }}>
                      <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section style={{
        padding: '70px 0',
        backgroundColor: 'var(--color-burgundy)',
        color: '#FFFFFF',
        textAlign: 'center'
      }}>
        <div className="max-w-5xl">
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <Heart size={24} fill="#FFFFFF" stroke="none" />
          </div>
          <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', marginBottom: '16px' }}>
            Begin Your Wedding Journey with Confidence
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-blush)', maxWidth: '580px', margin: '0 auto 30px auto', lineHeight: 1.6 }}>
            Free to use, private to your partnership, and thoughtfully designed for every milestone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onStartPlanning}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--color-burgundy)',
                padding: '14px 32px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              Create Free Account
            </button>
            <button
              onClick={onTryDemo}
              style={{
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 500,
                fontSize: '1rem'
              }}
            >
              Explore Live Demo Mode
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '50px 0 30px 0',
        backgroundColor: 'var(--color-ivory)',
        borderTop: '1px solid var(--color-border)'
      }}>
        <div className="max-w-7xl">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '30px'
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
                Aura & Vow
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Mindful Wedding Financial Architecture
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ cursor: 'pointer' }} onClick={onStartPlanning}>Budget Calculator</span>
              <span style={{ cursor: 'pointer' }} onClick={onTryDemo}>Sample Wedding</span>
              <span style={{ cursor: 'pointer' }} onClick={onStartPlanning}>Privacy & Security</span>
            </div>
          </div>

          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)'
          }}>
            <div>
              © 2027 Aura & Vow. Designed for celebrations filled with grace and financial peace.
            </div>
            <div>
              Estimates based on regional wedding planning benchmarks. Live vendor contracts remain your own.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
