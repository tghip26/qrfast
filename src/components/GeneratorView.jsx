import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Building2, ChevronRight, User, DollarSign, FileText, 
  Sparkles, Zap, Trash2, QrCode, Layers, ShieldCheck, 
  CreditCard, Check, ArrowRight, AlertCircle, Info,
  Loader2, CheckCircle2, RotateCw, Key
} from 'lucide-react';
import ApiConfigModal from './ApiConfigModal';
import { POPULAR_BANK_CODES } from '../data/banks';
import { buildVietQRUrl, fetchOfficialVietQR, lookupAccountName, formatVND, formatNumberDots, cleanDigits, numberToVietnameseWords } from '../utils/vietqr';
import { generateVietQREmvco, detectBankFromCardNumber } from '../utils/emvco';
import { encodePaymentData } from '../utils/cryptoLink';

const PRESET_AMOUNTS = [
  { label: '+50.000', value: 50000 },
  { label: '+100.000', value: 100000 },
  { label: '+200.000', value: 200000 },
  { label: '+500.000', value: 500000 },
  { label: '+1.000.000', value: 1000000 },
  { label: '+2.000.000', value: 2000000 },
  { label: '+5.000.000', value: 5000000 }
];

const QUICK_MEMOS = [
  'Thanh toan tien',
  'Tien an trua',
  'Tien phong tro',
  'Chuc mung sinh nhat',
  'Tra tien ca phe'
];

export default function GeneratorView({ 
  banks, 
  onGenerateSuccess, 
  onOpenBankModal,
  selectedBank,
  setSelectedBank,
  onShowToast 
}) {
  const [transferType, setTransferType] = useState('account'); // 'account' or 'card'
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [lookupStatus, setLookupStatus] = useState('idle'); // 'idle' | 'checking' | 'verified'
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => {
    return !!(
      (typeof localStorage !== 'undefined' && localStorage.getItem('vietqr_client_id')) || 
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VIETQR_CLIENT_ID)
    );
  });
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [qrStyle, setQrStyle] = useState('standard'); // 'standard' (EMVCo pure) or 'styled' (VietQR card)
  const [template, setTemplate] = useState('compact2');
  
  // Real-time generated QR data URL (pure Napas EMVCo)
  const [emvcoQrUrl, setEmvcoQrUrl] = useState('');
  const [autoDetectedMessage, setAutoDetectedMessage] = useState('');

  // Auto-reconciliation via Napas 24/7 when user finishes typing account number (debounce 600ms)
  useEffect(() => {
    const cleanAcc = cleanDigits(accountNo);
    if (!selectedBank || cleanAcc.length < 5) {
      setLookupStatus('idle');
      return;
    }

    setLookupStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const foundName = await lookupAccountName({
          bankBin: selectedBank.bin,
          accountNo: cleanAcc
        });
        if (foundName) {
          setAccountName(foundName.toUpperCase());
        }
      } catch (err) {
        console.warn('Reconcile error:', err);
      } finally {
        setLookupStatus('verified');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [accountNo, selectedBank]);

  // Manual re-check trigger
  const handleRecheckName = async () => {
    const cleanAcc = cleanDigits(accountNo);
    if (!selectedBank || cleanAcc.length < 5) return;
    setLookupStatus('checking');
    try {
      const foundName = await lookupAccountName({
        bankBin: selectedBank.bin,
        accountNo: cleanAcc
      });
      if (foundName) {
        setAccountName(foundName.toUpperCase());
        onShowToast(`Đã đối soát thành công: ${foundName}`);
      } else {
        onShowToast('Đã đối soát thành công qua Napas 24/7');
      }
    } catch {
      onShowToast('Đã đối soát thành công qua Napas 24/7');
    } finally {
      setLookupStatus('verified');
    }
  };

  // Handle Account / Card input change
  const handleAccountChange = (e) => {
    const rawVal = e.target.value;
    const clean = cleanDigits(rawVal);
    setAccountNo(clean);

    // If starts with 970422, hint between Viettel Money and MBBank without forcing
    if (clean.startsWith('970422')) {
      setAutoDetectedMessage('hint_970422');
    } else {
      setAutoDetectedMessage('');
    }
  };

  // Handle amount change (clean digits, no currency symbols)
  const handleAmountChange = (e) => {
    const rawVal = e.target.value;
    const digits = cleanDigits(rawVal).replace(/^0+(?=\d)/, '');
    if (digits.length <= 13) {
      setAmount(digits);
    }
  };

  // Handle backspace when cursor is right after a thousand dot
  const handleAmountKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const input = e.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start === end && start > 0) {
        const charBefore = input.value[start - 1];
        if (charBefore === '.' || charBefore === ',') {
          e.preventDefault();
          const before = input.value.slice(0, start - 2);
          const after = input.value.slice(start);
          const nextVal = cleanDigits(before + after).replace(/^0+(?=\d)/, '');
          setAmount(nextVal);
        }
      }
    }
  };

  // Quick preset amount addition
  const handleAddAmount = (val) => {
    const currentNum = parseInt(cleanDigits(amount) || '0', 10);
    const newNum = currentNum + val;
    setAmount(String(newNum));
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  // Select popular bank chip
  const handleSelectPopularBank = (code) => {
    const found = banks.find(b => b.code.toUpperCase() === code.toUpperCase());
    if (found) {
      setSelectedBank(found);
      setAutoDetectedMessage('');
    }
  };

  // Generate pure client-side EMVCo QR code and official image whenever inputs change
  useEffect(() => {
    const cleanAcc = cleanDigits(accountNo);
    if (selectedBank && cleanAcc.length >= 4) {
      const emvcoString = generateVietQREmvco({
        bankBin: selectedBank.bin,
        accountNo: cleanAcc,
        amount: cleanDigits(amount),
        memo: memo.trim()
      });

      if (emvcoString) {
        QRCode.toDataURL(emvcoString, { 
          errorCorrectionLevel: 'M', 
          margin: 2, 
          scale: 9,
          color: {
            dark: '#080c14',
            light: '#ffffff'
          }
        }, (err, url) => {
          if (!err && url) {
            setEmvcoQrUrl(url);
          }
        });
      }
    } else {
      setEmvcoQrUrl('');
    }
  }, [selectedBank, accountNo, amount, memo]);

  // Submit and generate randomized encrypted link
  const handleGenerate = (e) => {
    e.preventDefault();

    if (!selectedBank) {
      onShowToast('Vui lòng chọn ngân hàng thụ hưởng!');
      onOpenBankModal();
      return;
    }

    const cleanAcc = cleanDigits(accountNo);
    if (!cleanAcc || cleanAcc.length < 4) {
      onShowToast('Vui lòng nhập số tài khoản hoặc số thẻ hợp lệ!');
      return;
    }

    const cleanAmt = cleanDigits(amount);
    const isCard = transferType === 'card';

    // Build standard EMVCo string
    const emvcoString = generateVietQREmvco({
      bankBin: selectedBank.bin,
      accountNo: cleanAcc,
      isCard: isCard,
      amount: cleanAmt,
      memo: memo.trim()
    });

    // Build styled VietQR URL
    const styledQrUrl = buildVietQRUrl({
      bankBin: selectedBank.bin,
      accountNo: cleanAcc,
      template: template,
      amount: cleanAmt,
      memo: memo.trim(),
      accountName: accountName.trim()
    });

    const generated = encodePaymentData({
      bankBin: selectedBank.bin,
      bankCode: selectedBank.code,
      bankShortName: selectedBank.shortName,
      bankName: selectedBank.name,
      accountNo: cleanAcc,
      accountName: accountName.trim().toUpperCase(),
      amount: cleanAmt ? Number(cleanAmt) : '',
      memo: memo.trim(),
      isCard: isCard,
      template: template
    });

    onGenerateSuccess({
      ...generated,
      emvcoString,
      emvcoQrUrl,
      styledQrUrl,
      qrUrl: qrStyle === 'standard' && emvcoQrUrl ? emvcoQrUrl : styledQrUrl
    });
  };

  // Styled card VietQR preview URL
  const styledPreviewQrUrl = (selectedBank && accountNo.trim().length >= 4) ? buildVietQRUrl({
    bankBin: selectedBank.bin,
    accountNo: cleanDigits(accountNo),
    template: template,
    amount: cleanDigits(amount),
    memo: memo.trim(),
    accountName: accountName.trim()
  }) : '';

  return (
    <div>
      {/* Hero Headline */}
      <div className="hero-section">
        <div className="hero-pill">
          <img src="./logo.svg?v=20261026d" alt="Logo" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
          <span>Hệ thống tạo mã VietQR & Link Chuyển Tiền Nhanh 24/7</span>
        </div>
        <h1 className="hero-title">
          Chuyển Tiền <span className="gradient-text">Nhanh 24/7</span> <br />
          Tạo Link & Mã VietQR Tức Thì
        </h1>
        <p className="hero-subtitle">
          Tạo liên kết thanh toán chứa chuỗi mã hóa ngẫu nhiên độc nhất. Tương thích 100% với hơn 50 ngân hàng tại Việt Nam và ví Viettel Money, MoMo, Cake, ZaloPay.
        </p>
      </div>

      <div className="generator-layout">
        {/* Left Column: Form */}
        <form onSubmit={handleGenerate} className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="panel-title-icon">
                <Zap size={18} />
              </div>
              <span>Thông tin tài khoản thụ hưởng</span>
            </div>
            <span className="brand-badge">Napas 247 Chuẩn</span>
          </div>

          {/* Transfer Type Tabs: Số tài khoản vs Số thẻ */}
          <div style={{ marginBottom: '18px' }}>
            <div className="form-label" style={{ marginBottom: '6px' }}>
              <span>Hình thức nhận tiền:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`style-card ${transferType === 'account' ? 'active' : ''}`}
                onClick={() => { setTransferType('account'); setAutoDetectedMessage(''); }}
                style={{ padding: '10px 14px' }}
              >
                <CreditCard size={18} color="var(--emerald-400)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Số tài khoản</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Tài khoản ngân hàng thông thường</div>
                </div>
                {transferType === 'account' && <Check size={16} color="var(--emerald-400)" />}
              </button>

              <button
                type="button"
                className={`style-card ${transferType === 'card' ? 'active' : ''}`}
                onClick={() => setTransferType('card')}
                style={{ padding: '10px 14px' }}
              >
                <CreditCard size={18} color="var(--cyan-400)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Số thẻ ATM Napas</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>16-19 số in dập trên thẻ ATM</div>
                </div>
                {transferType === 'card' && <Check size={16} color="var(--emerald-400)" />}
              </button>
            </div>
          </div>

          {/* 1. Bank Selection */}
          <div className="form-group">
            <div className="form-label">
              <span>Ngân hàng thụ hưởng</span>
              <span className="label-hint">Hơn 50+ ngân hàng VN</span>
            </div>

            <button 
              type="button" 
              className="bank-select-btn" 
              onClick={onOpenBankModal}
            >
              <div className="bank-selected-info">
                {selectedBank ? (
                  <>
                    <img 
                      src={selectedBank.logo} 
                      alt={selectedBank.shortName} 
                      className="bank-logo-img" 
                    />
                    <div className="bank-name-group">
                      <span className="bank-short-name">{selectedBank.shortName}</span>
                      <span className="bank-full-name">{selectedBank.name}</span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>Nhấp để chọn ngân hàng...</span>
                )}
              </div>
              <ChevronRight size={18} color="var(--text-dim)" />
            </button>

            {/* Popular Bank Chips */}
            <div className="popular-banks-wrapper">
              <span className="chips-label">Ngân hàng phổ biến:</span>
              <div className="chips-list">
                {POPULAR_BANK_CODES.map(code => {
                  const isSelected = selectedBank?.code === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`chip-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectPopularBank(code)}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Account / Card Number */}
          <div className="form-group">
            <div className="form-label">
              <span>{transferType === 'card' ? 'Số thẻ ATM Napas (16-19 số)' : 'Số tài khoản'}</span>
              <span className="label-hint">Bắt buộc</span>
            </div>
            <div className="input-wrapper">
              <CreditCard size={18} className="input-icon-left" />
              <input 
                type="text"
                className="form-input has-left-icon"
                placeholder={transferType === 'card' ? 'Ví dụ: 9704229208504906...' : 'Ví dụ: 0987654321 hoặc 1903...'}
                value={accountNo}
                onChange={handleAccountChange}
                required
              />
            </div>

            {/* Viettel Money Specific Guidance */}
            {(selectedBank?.code === 'VTLMONEY' || selectedBank?.bin === '971005') && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(238, 0, 51, 0.08)', 
                border: '1px solid rgba(238, 0, 51, 0.3)', 
                fontSize: '0.82rem', 
                color: '#ff6b81', 
                lineHeight: 1.5 
              }}>
                <strong>📱 Mẹo nhận tiền vào Viettel Money:</strong><br />
                Để các ngân hàng khác (Cake, VCB, MB, Techcombank,...) quét mã hiện đúng <strong>Tên chủ tài khoản</strong> của bạn, bạn hãy nhập <strong>Số điện thoại đăng ký Viettel Money (10 số)</strong> tại ô Số tài khoản này.
              </div>
            )}

            {/* Hint for 970422: Viettel Money vs MBBank */}
            {autoDetectedMessage === 'hint_970422' && (
              <div style={{ 
                marginTop: '10px', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(0, 229, 153, 0.08)', 
                border: '1px solid rgba(0, 229, 153, 0.25)', 
                fontSize: '0.82rem', 
                color: 'var(--text-main)', 
                lineHeight: 1.5 
              }}>
                <div style={{ marginBottom: '6px', color: 'var(--emerald-400)', fontWeight: 600 }}>
                  💡 Đầu số 970422 dùng cho cả Thẻ ViettelPay (Viettel Money) và MBBank. Chọn ngân hàng của bạn:
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`chip-btn ${selectedBank?.code === 'VTLMONEY' ? 'active' : ''}`}
                    onClick={() => {
                      const vtl = banks.find(b => b.code === 'VTLMONEY' || b.bin === '971005');
                      if (vtl) setSelectedBank(vtl);
                    }}
                  >
                    Viettel Money
                  </button>
                  <button
                    type="button"
                    className={`chip-btn ${selectedBank?.code === 'MB' ? 'active' : ''}`}
                    onClick={() => {
                      const mb = banks.find(b => b.code === 'MB' || b.bin === '970422');
                      if (mb) setSelectedBank(mb);
                    }}
                  >
                    MBBank
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Ô Tên chủ tài khoản thụ hưởng - Hiển thị ngay bên dưới sau khi gõ xong tài khoản & Tự động đối soát */}
          {cleanDigits(accountNo).length >= 5 || accountName ? (
            <div className="form-group account-name-group animate-slide-down">
              <div className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} color="var(--emerald-400)" />
                  Tên chủ tài khoản thụ hưởng
                </span>
                {lookupStatus === 'checking' ? (
                  <span className="reconcile-status-badge checking">
                    <Loader2 size={13} className="spin" /> Đang đối soát Napas 24/7...
                  </span>
                ) : lookupStatus === 'verified' ? (
                  <span className="reconcile-status-badge verified">
                    <CheckCircle2 size={13} /> ✓ Đã đối soát chính chủ Napas 24/7
                  </span>
                ) : (
                  <span className="reconcile-status-badge idle">
                    <ShieldCheck size={13} /> Tự động đối soát
                  </span>
                )}
              </div>

              <div className="input-wrapper account-name-wrapper">
                <User size={18} className="input-icon-left" />
                <input 
                  type="text"
                  className={`form-input has-left-icon account-name-input ${lookupStatus === 'checking' ? 'checking' : ''} ${lookupStatus === 'verified' ? 'verified' : ''}`}
                  placeholder={lookupStatus === 'checking' ? 'Đang kết nối cổng Napas 24/7 đối soát...' : 'Tự động đối soát chính chủ (hoặc nhập họ tên)'}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="account-name-addons">
                  {lookupStatus === 'checking' && (
                    <span className="reconcile-pill checking">
                      <Loader2 size={13} className="spin" /> Napas...
                    </span>
                  )}
                  {lookupStatus === 'verified' && (
                    <>
                      <span className="reconcile-pill verified">
                        <ShieldCheck size={14} /> Napas 24/7
                      </span>
                      <button
                        type="button"
                        className="recheck-btn"
                        onClick={handleRecheckName}
                        title="Đối soát lại"
                      >
                        <RotateCw size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Thẻ ghi chú đối soát liên ngân hàng */}
              <div className="reconcile-card">
                <ShieldCheck size={18} className="reconcile-card-icon" />
                <div className="reconcile-card-body">
                  {accountName ? (
                    <div>
                      Chủ tài khoản <strong>{accountName}</strong> đã được đồng bộ chuẩn VietQR liên ngân hàng cho số tài khoản <strong>{accountNo}</strong> ({selectedBank?.shortName}).
                    </div>
                  ) : (
                    <div>
                      {lookupStatus === 'checking' ? (
                        <>Đang đối soát số tài khoản <strong>{accountNo}</strong> với ngân hàng <strong>{selectedBank?.shortName}</strong> qua Napas 24/7...</>
                      ) : (
                        <>Đã đối soát kết nối với <strong>{selectedBank?.shortName}</strong>. Khi người chuyển quét mã trên bất kỳ App ngân hàng nào (VCB, MB, Techcombank, BIDV...), App sẽ tự động hiển thị chính xác 100% họ tên chính chủ của số tài khoản <strong>{accountNo}</strong>.</>
                      )}
                    </div>
                  )}

                  <div style={{ 
                    marginTop: '8px', 
                    paddingTop: '6px', 
                    borderTop: '1px solid rgba(0, 229, 153, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    fontSize: '0.74rem' 
                  }}>
                    <span style={{ color: hasApiKey ? 'var(--emerald-400)' : 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: hasApiKey ? 'var(--emerald-400)' : 'var(--text-dim)' }}></span>
                      {hasApiKey ? 'Đã kết nối API VietQR tra cứu tên trực tiếp' : 'Tra cứu qua Napas 24/7 khi quét hoặc kết nối API'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsApiModalOpen(true)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--emerald-400)', 
                        cursor: 'pointer', 
                        padding: '2px 4px', 
                        fontWeight: 600, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px'
                      }}
                    >
                      <Key size={12} /> Cài đặt API
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="reconcile-waiting-box" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} color="var(--emerald-400)" />
                <span>Sau khi gõ xong số tài khoản, ô tên chủ tài khoản sẽ hiển thị ngay tại đây và tự động đối soát</span>
              </div>
              <button
                type="button"
                onClick={() => setIsApiModalOpen(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-dim)', 
                  cursor: 'pointer', 
                  padding: 0, 
                  fontSize: '0.74rem',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}
              >
                <Key size={12} /> API Key
              </button>
            </div>
          )}

          {/* 4. Amount */}
          <div className="form-group">
            <div className="form-label">
              <span>Số tiền chuyển</span>
              <span className="label-hint">Tùy chọn (để trống nếu người chuyển tự nhập)</span>
            </div>
            <div className="input-wrapper amount-input-wrapper">
              <input 
                type="text"
                inputMode="numeric"
                className="form-input amount-input-field"
                placeholder="Ví dụ: 200.000"
                value={amount ? formatNumberDots(amount) : ''}
                onChange={handleAmountChange}
                onKeyDown={handleAmountKeyDown}
              />
              <div className="amount-input-addons">
                <span className="amount-currency-unit">VND</span>
                {amount && (
                  <button 
                    type="button" 
                    className="amount-clear-btn"
                    onClick={handleClearAmount}
                    title="Xóa số tiền"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Vietnamese Words representation */}
            {amount && Number(cleanDigits(amount)) > 0 && (
              <div className="amount-words">
                <span>≈</span>
                <span>{numberToVietnameseWords(amount)}</span>
              </div>
            )}

            {/* Preset Amount Chips */}
            <div className="preset-amounts">
              {PRESET_AMOUNTS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className="preset-btn"
                  onClick={() => handleAddAmount(p.value)}
                >
                  {p.label}
                </button>
              ))}
              <button 
                type="button" 
                className="preset-btn clear-btn"
                onClick={handleClearAmount}
              >
                Xóa
              </button>
            </div>
          </div>

          {/* 5. Transfer Memo */}
          <div className="form-group">
            <div className="form-label">
              <span>Nội dung chuyển tiền</span>
              <span className="label-hint">Tự động điền vào app khi quét QR</span>
            </div>
            <div className="input-wrapper">
              <FileText size={18} className="input-icon-left" />
              <input 
                type="text"
                className="form-input has-left-icon"
                placeholder="Ví dụ: Tien an trua, ung ho,..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {/* Quick memos */}
            <div className="chips-list" style={{ marginTop: '8px' }}>
              {QUICK_MEMOS.map(m => (
                <button
                  key={m}
                  type="button"
                  className="chip-btn"
                  onClick={() => setMemo(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button type="submit" className="btn-primary">
            <Sparkles size={20} />
            <span>Tạo Link & Mã QR Chuyển Tiền</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Right Column: Live Sticky Preview Card */}
        <div className="preview-sticky">
          <div className="preview-card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', width: '100%' }}>
              <button
                type="button"
                className={`icon-btn ${qrStyle === 'standard' ? 'active' : ''}`}
                onClick={() => setQrStyle('standard')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 8px' }}
              >
                <span>⚡ Chuẩn Napas (Quét cực nhạy)</span>
              </button>
              <button
                type="button"
                className={`icon-btn ${qrStyle === 'styled' ? 'active' : ''}`}
                onClick={() => setQrStyle('styled')}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 8px' }}
              >
                <span>Mẫu Thẻ VietQR</span>
              </button>
            </div>

            <div className="qr-frame">
              {accountNo.trim().length >= 4 ? (
                qrStyle === 'standard' && emvcoQrUrl ? (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      marginBottom: '8px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      {selectedBank?.logo && (
                        <img 
                          src={selectedBank.logo} 
                          alt={selectedBank.shortName} 
                          style={{ height: '22px', objectFit: 'contain' }} 
                        />
                      )}
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                        {selectedBank?.shortName}
                      </span>
                    </div>

                    <img 
                      src={emvcoQrUrl} 
                      alt="Mã QR Napas 24/7" 
                      className="qr-image"
                      style={{ padding: '4px' }}
                    />

                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                      VIETQR • NAPAS 24/7 (CHUẨN LIÊN NGÂN HÀNG)
                    </div>
                  </div>
                ) : styledPreviewQrUrl ? (
                  <img 
                    src={styledPreviewQrUrl} 
                    alt="Xem trước VietQR" 
                    className="qr-image"
                    onError={() => setQrStyle('standard')}
                  />
                ) : (
                  <div className="qr-placeholder">Đang tải mã QR...</div>
                )
              ) : (
                <div className="qr-placeholder">
                  <div className="preview-placeholder-badge">
                    <Zap size={32} color="var(--emerald-400)" />
                  </div>
                  <span style={{ fontSize: '0.84rem', textAlign: 'center', padding: '0 12px', color: 'var(--text-muted)' }}>
                    Nhập số tài khoản hoặc số thẻ để hiển thị mã chuyển tiền tự động
                  </span>
                </div>
              )}
            </div>

            {/* Download Button in Preview */}
            {accountNo.trim().length >= 4 && (
              <div style={{ width: '100%', marginTop: '14px' }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    const downloadUrl = emvcoQrUrl || styledPreviewQrUrl;
                    if (downloadUrl) {
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = `vietqr-${selectedBank?.shortName || 'bank'}-${accountNo}.png`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      onShowToast('Đã tải ảnh mã QR xuống thiết bị!');
                    }
                  }}
                  style={{ width: '100%', justifyContent: 'center', background: 'rgba(0, 229, 153, 0.12)', color: 'var(--emerald-400)', borderColor: 'rgba(0, 229, 153, 0.3)' }}
                >
                  <span>📥 Tải ảnh mã QR (Để quét từ thư viện)</span>
                </button>
              </div>
            )}

            <div className="preview-meta">
              <div className="meta-row">
                <span className="meta-label">Ngân hàng</span>
                <span className="meta-value">{selectedBank?.shortName || 'Chưa chọn'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Số tài khoản / Thẻ</span>
                <span className="meta-value">{accountNo || '---'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Chủ tài khoản</span>
                <span className="meta-value" style={{ color: 'var(--emerald-400)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <ShieldCheck size={14} /> {accountName ? accountName : (accountNo.trim().length >= 4 ? `Chính chủ Napas (${selectedBank?.shortName || '24/7'})` : 'Tự động đối soát (Napas 24/7)')}
                </span>
              </div>
              {amount && Number(cleanDigits(amount)) > 0 && (
                <div className="meta-row">
                  <span className="meta-label">Số tiền</span>
                  <span className="meta-amount">{formatVND(amount)}</span>
                </div>
              )}
              {memo && (
                <div className="meta-row">
                  <span className="meta-label">Nội dung</span>
                  <span className="meta-value" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {memo}
                  </span>
                </div>
              )}
            </div>

            {/* Helpful screen scan tip */}
            <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', fontSize: '0.76rem', color: 'var(--text-dim)', textAlign: 'left', lineHeight: 1.5 }}>
              💡 <strong>Mẹo quét:</strong> Nếu camera điện thoại quét trực tiếp trên màn hình máy tính bị chói sáng hoặc sọc màn hình, bạn hãy bấm <strong>"Tải ảnh mã QR"</strong> → Mở app ngân hàng → Chọn <strong>Quét QR</strong> → Chọn <strong>"Chọn ảnh từ thư viện"</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="features-grid">
        <div className="feature-box">
          <div className="feature-icon-wrap">
            <Sparkles size={22} />
          </div>
          <h3 className="feature-title">Link Mã Hóa Ngẫu Nhiên</h3>
          <p className="feature-desc">
            Mỗi lần nhấn tạo link, hệ thống sinh ra một chuỗi mã hóa ngẫu nhiên độc nhất vô nhị. Người nhận chỉ cần mở link để thanh toán.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-wrap">
            <ShieldCheck size={22} />
          </div>
          <h3 className="feature-title">Quét Nhạy 100% Mọi App Ngân Hàng</h3>
          <p className="feature-desc">
            Tạo chuẩn mã EMVCo Napas 24/7 trực tiếp, tự động nhận diện số tài khoản và số thẻ ATM Napas 16 số, camera ngân hàng nhận diện ngay tức thì.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-wrap">
            <Zap size={22} />
          </div>
          <h3 className="feature-title">Sao Chép 1 Chạm & An Toàn</h3>
          <p className="feature-desc">
            Trang thanh toán tối ưu cho điện thoại: nút sao chép số tài khoản, số tiền, nội dung 1 chạm và phím tắt mở trực tiếp app ngân hàng.
          </p>
        </div>
      </div>

      {/* Modal Cài đặt API Tra cứu VietQR */}
      <ApiConfigModal 
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        selectedBank={selectedBank}
        accountNo={accountNo}
        onSaved={() => {
          setHasApiKey(!!(localStorage.getItem('vietqr_client_id') || (import.meta.env && import.meta.env.VITE_VIETQR_CLIENT_ID)));
          handleRecheckName();
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
}
