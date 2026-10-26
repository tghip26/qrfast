import React from 'react';
import { Sun, Moon, History, PlusCircle } from 'lucide-react';

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
            <img src="./logo.svg?v=20261026c" alt="Logo Chuyển Tiền Nhanh" className="brand-vector-img" />
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
        </a>

        <div className="nav-actions">
          {isPaymentView ? (
            <button className="icon-btn active" onClick={onGoHome} title="Tạo mã QR mới">
              <PlusCircle size={16} />
              <span className="d-none-mobile">Tạo mã mới</span>
            </button>
          ) : (
            <button className="icon-btn" onClick={onOpenHistory} title="Lịch sử tạo link">
              <History size={16} />
              <span className="d-none-mobile">Lịch sử</span>
              {historyCount > 0 && (
                <span className="history-count-badge">
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
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
}
