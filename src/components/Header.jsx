import React from 'react';
import { Sun, Moon, History, PlusCircle, Zap } from 'lucide-react';

function GithubIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Header({ 
  theme, 
  onToggleTheme, 
  onOpenHistory, 
  historyCount = 0,
  isPaymentView,
  onGoHome 
}) {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="#/" onClick={(e) => { e.preventDefault(); onGoHome(); }} className="brand-logo" title="Chuyển Tiền Nhanh 24/7">
          <div className="brand-vector-container">
            <img src="./logo.svg" alt="QR Fast Logo" className="brand-vector-img" />
            <div className="brand-vector-glow"></div>
          </div>
          <div className="brand-text-group">
            <div className="brand-title">
              Chuyển Tiền <span className="gradient-text">Nhanh</span>
            </div>
            <div className="brand-tagline">
              <span>VIETQR • NAPAS 24/7</span>
            </div>
          </div>
          <span className="brand-badge brand-badge-pulse">
            <span className="status-dot"></span>
            LIVE
          </span>
        </a>

        <div className="nav-actions">
          {isPaymentView ? (
            <button className="icon-btn active" onClick={onGoHome} title="Tạo mã QR mới">
              <PlusCircle size={17} />
              <span className="d-none-mobile">Tạo mã QR mới</span>
            </button>
          ) : (
            <button className="icon-btn" onClick={onOpenHistory} title="Lịch sử tạo link">
              <History size={17} />
              <span className="d-none-mobile">Lịch sử</span>
              {historyCount > 0 && (
                <span className="brand-badge" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                  {historyCount}
                </span>
              )}
            </button>
          )}

          <button 
            className="icon-btn icon-only" 
            onClick={onToggleTheme} 
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <a 
            href="https://github.com/tghip26/qrfast" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="icon-btn icon-only"
            title="Xem mã nguồn trên GitHub"
          >
            <GithubIcon size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}
