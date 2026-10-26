import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Building2, ChevronRight, User, DollarSign, FileText, 
  Sparkles, Zap, Trash2, QrCode, Layers, ShieldCheck, 
  CreditCard, Check, ArrowRight, AlertCircle, Info
} from 'lucide-react';
import { POPULAR_BANK_CODES } from '../data/banks';
import { buildVietQRUrl, formatVND, cleanDigits, numberToVietnameseWords } from '../utils/vietqr';
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
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [qrStyle, setQrStyle] = useState('standard'); // 'standard' (EMVCo pure) or 'styled' (VietQR card)
  const [template, setTemplate] = useState('compact2');
  
  // Real-time generated QR data URL (pure Napas EMVCo)
  const [emvcoQrUrl, setEmvcoQrUrl] = useState('');
  const [autoDetectedMessage, setAutoDetectedMessage] = useState('');

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
          <Sparkles size={15} />
          <span>Hệ thống tạo mã QR & Link chuyển khoản ngân hàng 24/7</span>
        </div>
        <h1 className="hero-title">
          Tạo link chuyển tiền <br />
          <span className="gradient-text">Mã Hóa Ngẫu Nhiên</span> kèm VietQR
        </h1>
        <p className="hero-subtitle">
          Nhập số tài khoản hoặc số thẻ ATM Napas để tạo link chuyển khoản ngẫu nhiên. Quét siêu nhạy trên 100% ứng dụng ngân hàng và ví điện tử.
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

          {/* 3. Account Name */}
          <div className="form-group">
            <div className="form-label">
              <span>Tên chủ tài khoản</span>
              <span className="label-hint">Tùy chọn (để người gửi đối chiếu)</span>
            </div>
            <div className="input-wrapper">
              <User size={18} className="input-icon-left" />
              <input 
                type="text"
                className="form-input has-left-icon"
                placeholder="Ví dụ: NGUYEN VAN A"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* 4. Amount */}
          <div className="form-group">
            <div className="form-label">
              <span>Số tiền chuyển</span>
              <span className="label-hint">Tùy chọn (để trống nếu người chuyển tự nhập)</span>
            </div>
            <div className="input-wrapper">
              <DollarSign size={18} className="input-icon-left" />
              <input 
                type="text"
                className="form-input has-left-icon"
                placeholder="Ví dụ: 200000"
                value={amount ? formatVND(amount) : ''}
                onChange={(e) => setAmount(cleanDigits(e.target.value))}
              />
              {amount && (
                <button 
                  type="button" 
                  className="input-action-btn"
                  onClick={handleClearAmount}
                  title="Xóa số tiền"
                >
                  <Trash2 size={16} />
                </button>
              )}
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
                  <QrCode size={48} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.84rem', textAlign: 'center', padding: '0 12px' }}>
                    Nhập số tài khoản hoặc số thẻ Napas để xem trước mã QR tự động
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
              {accountName && (
                <div className="meta-row">
                  <span className="meta-label">Người nhận</span>
                  <span className="meta-value">{accountName}</span>
                </div>
              )}
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
              💡 <strong>Mẹo quét:</strong> Nếu camera điện thoại quét trực tiếp trên màn hình máy tính bị chói sáng hoặc sọc màn hình, bạn hãy bấm <strong>"Tải ảnh mã QR"</strong> $\rightarrow$ Mở app ngân hàng $\rightarrow$ Chọn <strong>Quét QR</strong> $\rightarrow$ Chọn <strong>"Chọn ảnh từ thư viện"</strong>.
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
    </div>
  );
}
