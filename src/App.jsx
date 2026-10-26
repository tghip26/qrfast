import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneratorView from './components/GeneratorView';
import PaymentView from './components/PaymentView';
import BankModal from './components/BankModal';
import ShareModal from './components/ShareModal';
import HistoryModal from './components/HistoryModal';
import { DEFAULT_BANKS } from './data/banks';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('qrfast_theme') || 'dark';
  });

  // Banks data
  const [banks, setBanks] = useState(DEFAULT_BANKS);
  const [selectedBank, setSelectedBank] = useState(DEFAULT_BANKS[0]);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('qrfast_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Navigation / Route state
  const [currentRoute, setCurrentRoute] = useState({ path: 'home', token: null });

  // Modals state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Sync theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qrfast_theme', theme);
  }, [theme]);

  // Optional background fetch for latest banks list from official VietQR API
  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(res => {
        if (res && res.code === '00' && Array.isArray(res.data) && res.data.length > 0) {
          setBanks(res.data);
          // Keep selected bank in sync if found
          setSelectedBank(prev => {
            const found = res.data.find(b => b.bin === prev?.bin || b.code === prev?.code);
            return found || prev || res.data[0];
          });
        }
      })
      .catch(() => {
        // Fallback to built-in DEFAULT_BANKS if network fails or offline
      });
  }, []);

  // Parse URL hash or search params
  const parseCurrentUrl = () => {
    const hash = window.location.hash;
    const search = window.location.search;

    // Check query params: ?p=... or ?token=...
    const urlParams = new URLSearchParams(search);
    const queryToken = urlParams.get('p') || urlParams.get('token');
    if (queryToken) {
      setCurrentRoute({ path: 'payment', token: queryToken });
      return;
    }

    // Check hash: #/p/<token> or #/pay?token=<token>
    if (hash.startsWith('#/p/')) {
      const token = hash.replace('#/p/', '').split('?')[0];
      if (token) {
        setCurrentRoute({ path: 'payment', token });
        return;
      }
    } else if (hash.includes('token=')) {
      const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
      const token = hashParams.get('token');
      if (token) {
        setCurrentRoute({ path: 'payment', token });
        return;
      }
    }

    setCurrentRoute({ path: 'home', token: null });
  };

  useEffect(() => {
    parseCurrentUrl();
    const handleHashChange = () => parseCurrentUrl();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Toast handler
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 3000);
  };

  // Toggle theme
  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Generation success
  const handleGenerateSuccess = (newShare) => {
    setShareData(newShare);
    // Add to history
    const updatedHistory = [newShare, ...history.filter(h => h.id !== newShare.id)].slice(0, 50);
    setHistory(updatedHistory);
    try {
      localStorage.setItem('qrfast_history', JSON.stringify(updatedHistory));
    } catch (e) {}
    showToast('Tạo link mã hóa ngẫu nhiên thành công!');
  };

  // Navigate to recipient payment view
  const handleOpenPayment = (token) => {
    window.location.hash = `#/p/${token}`;
  };

  // Navigate back to home / generator
  const handleGoHome = () => {
    window.location.hash = '#/';
    setCurrentRoute({ path: 'home', token: null });
  };

  // Delete single history item
  const handleDeleteHistoryItem = (idOrToken) => {
    const updated = history.filter(h => (h.id !== idOrToken && h.token !== idOrToken));
    setHistory(updated);
    try {
      localStorage.setItem('qrfast_history', JSON.stringify(updated));
    } catch (e) {}
    showToast('Đã xóa khỏi lịch sử.');
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('qrfast_history');
    } catch (e) {}
    showToast('Đã xóa toàn bộ lịch sử.');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
        isPaymentView={currentRoute.path === 'payment'}
        onGoHome={handleGoHome}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentRoute.path === 'payment' ? (
          <PaymentView 
            token={currentRoute.token}
            banks={banks}
            onGoHome={handleGoHome}
            onShowToast={showToast}
          />
        ) : (
          <GeneratorView 
            banks={banks}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            onOpenBankModal={() => setIsBankModalOpen(true)}
            onGenerateSuccess={handleGenerateSuccess}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>QR Fast</strong> - Ứng dụng tạo mã liên kết chuyển tiền ngẫu nhiên &amp; VietQR Napas 24/7.
        </p>
        <p style={{ marginTop: '6px', fontSize: '0.8rem' }}>
          Mã nguồn mở trên <a href="https://github.com/tghip26/qrfast" target="_blank" rel="noopener noreferrer">GitHub</a>. Không lưu trữ thông tin thẻ hay mật khẩu ngân hàng.
        </p>
      </footer>

      {/* Modals */}
      <BankModal 
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        banks={banks}
        selectedBank={selectedBank}
        onSelectBank={setSelectedBank}
      />

      <ShareModal 
        isOpen={!!shareData}
        onClose={() => setShareData(null)}
        shareData={shareData}
        onShowToast={showToast}
        onOpenPayment={handleOpenPayment}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectHistory={handleOpenPayment}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} className="toast-icon" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
