import React, { useState } from 'react';
import { 
  Building2, ChevronRight, User, DollarSign, FileText, 
  Sparkles, Zap, Trash2, QrCode, Layers, ShieldCheck, 
  CreditCard, Check, ArrowRight
} from 'lucide-react';
import { POPULAR_BANK_CODES } from '../data/banks';
import { buildVietQRUrl, formatVND, cleanDigits, numberToVietnameseWords } from '../utils/vietqr';
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
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [template, setTemplate] = useState('compact2');
  const [previewError, setPreviewError] = useState(false);

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
    }
  };

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
      onShowToast('Vui lòng nhập số tài khoản hợp lệ!');
      return;
    }

    const cleanAmt = cleanDigits(amount);

    const generated = encodePaymentData({
      bankBin: selectedBank.bin,
      bankCode: selectedBank.code,
      bankShortName: selectedBank.shortName,
      bankName: selectedBank.name,
      accountNo: cleanAcc,
      accountName: accountName.trim().toUpperCase(),
      amount: cleanAmt ? Number(cleanAmt) : '',
      memo: memo.trim(),
      template: template
    });

    const qrUrl = buildVietQRUrl({
      bankBin: selectedBank.bin,
      accountNo: cleanAcc,
      template: template,
      amount: cleanAmt,
      memo: memo.trim(),
      accountName: accountName.trim()
    });

    onGenerateSuccess({
      ...generated,
      qrUrl
    });
  };

  // Live QR Url for preview
  const livePreviewQrUrl = (selectedBank && accountNo.trim().length >= 4) ? buildVietQRUrl({
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
          Nhập số tài khoản & chọn ngân hàng để tạo đường link độc nhất vô nhị. Người nhận chỉ cần mở link là có thể quét mã QR chuyển tiền ngay tức thì mà không cần cài đặt gì.
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
            <span className="brand-badge">Napas 247</span>
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

          {/* 2. Account Number */}
          <div className="form-group">
            <div className="form-label">
              <span>Số tài khoản</span>
              <span className="label-hint">Bắt buộc</span>
            </div>
            <div className="input-wrapper">
              <CreditCard size={18} className="input-icon-left" />
              <input 
                type="text"
                className="form-input has-left-icon"
                placeholder="Ví dụ: 0987654321 hoặc 1903..."
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 3. Account Name */}
          <div className="form-group">
            <div className="form-label">
              <span>Tên chủ tài khoản</span>
              <span className="label-hint">Tùy chọn (hiển thị để người gửi đối chiếu)</span>
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

          {/* 6. Template style */}
          <div className="form-group">
            <div className="form-label">
              <span>Mẫu mã VietQR</span>
            </div>
            <div className="style-options">
              <button
                type="button"
                className={`style-card ${template === 'compact2' ? 'active' : ''}`}
                onClick={() => setTemplate('compact2')}
              >
                <div style={{ flex: 1 }}>
                  <div className="style-card-title">Napas 247 Chuẩn</div>
                  <div className="style-card-desc">Có khung thẻ, logo ngân hàng & số tiền</div>
                </div>
                {template === 'compact2' && <Check size={16} color="var(--emerald-400)" />}
              </button>

              <button
                type="button"
                className={`style-card ${template === 'qr_only' ? 'active' : ''}`}
                onClick={() => setTemplate('qr_only')}
              >
                <div style={{ flex: 1 }}>
                  <div className="style-card-title">Chỉ mã QR</div>
                  <div className="style-card-desc">Mã QR đơn giản, kích thước tối giản</div>
                </div>
                {template === 'qr_only' && <Check size={16} color="var(--emerald-400)" />}
              </button>
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
            <span className="preview-badge">
              <QrCode size={13} />
              <span>Xem trước mã QR thời gian thực</span>
            </span>

            <div className="qr-frame">
              {livePreviewQrUrl && !previewError ? (
                <img 
                  src={livePreviewQrUrl} 
                  alt="Xem trước VietQR" 
                  className="qr-image"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="qr-placeholder">
                  <QrCode size={48} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.84rem', textAlign: 'center', padding: '0 12px' }}>
                    Nhập số tài khoản & ngân hàng để xem trước mã VietQR tự động
                  </span>
                </div>
              )}
            </div>

            <div className="preview-meta">
              <div className="meta-row">
                <span className="meta-label">Ngân hàng</span>
                <span className="meta-value">{selectedBank?.shortName || 'Chưa chọn'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Số tài khoản</span>
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
          <h3 className="feature-title">Chuẩn VietQR & Napas 24/7</h3>
          <p className="feature-desc">
            Tương thích 100% với hơn 50 app ngân hàng tại Việt Nam (Vietcombank, MB, Techcombank, TPBank, VPBank,...) và ví MoMo, ZaloPay.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-wrap">
            <Zap size={22} />
          </div>
          <h3 className="feature-title">Sao Chép 1 Chạm & Quét Tức Thì</h3>
          <p className="feature-desc">
            Trang thanh toán tối ưu cho điện thoại: nút sao chép số tài khoản, số tiền, nội dung 1 chạm và phím tắt mở trực tiếp app ngân hàng.
          </p>
        </div>
      </div>
    </div>
  );
}
