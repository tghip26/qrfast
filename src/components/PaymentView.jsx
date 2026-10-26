import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Copy, Check, Download, Share2, Smartphone, ShieldCheck, 
  ArrowLeft, AlertTriangle, ExternalLink, RefreshCw, CreditCard 
} from 'lucide-react';
import { decodePaymentData } from '../utils/cryptoLink';
import { buildVietQRUrl, formatVND, numberToVietnameseWords } from '../utils/vietqr';
import { generateVietQREmvco } from '../utils/emvco';
import { DEFAULT_BANKS } from '../data/banks';
import BankAppsModal from './BankAppsModal';

export default function PaymentView({ 
  token, 
  banks = DEFAULT_BANKS, 
  onGoHome, 
  onShowToast 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [emvcoQrUrl, setEmvcoQrUrl] = useState('');
  const [qrStyle, setQrStyle] = useState('standard'); // 'standard' (EMVCo) or 'styled' (VietQR card)
  const [showAppsModal, setShowAppsModal] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const decoded = decodePaymentData(token);
      if (decoded && decoded.bankBin && decoded.accountNo) {
        setData(decoded);

        // Find bank
        const matched = banks.find(
          b => String(b.bin) === String(decoded.bankBin) || 
               b.code.toUpperCase() === String(decoded.bankBin).toUpperCase()
        ) || {
          code: 'BANK',
          shortName: 'Ngân hàng',
          name: 'Ngân hàng Việt Nam',
          logo: `https://api.vietqr.io/img/${decoded.bankBin}.png`,
          bin: decoded.bankBin
        };
        setBankInfo(matched);

        // Generate official standard Napas EMVCo QR code string
        const cleanAccount = decoded.accountNo.replace(/\s+/g, '');
        const emvcoString = generateVietQREmvco({
          bankBin: matched.bin || decoded.bankBin,
          accountNo: cleanAccount,
          isCard: Boolean(decoded.isCard),
          amount: decoded.amount,
          memo: decoded.memo
        });

        if (emvcoString) {
          QRCode.toDataURL(emvcoString, { 
            errorCorrectionLevel: 'M', 
            margin: 1, 
            scale: 8,
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
        setData(null);
      }
    } catch (err) {
      console.error('Decode failed:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, banks]);

  const handleCopy = async (text, fieldName, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedField(fieldName);
      onShowToast(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      onShowToast(`Không thể tự động sao chép ${label}.`);
    }
  };

  const vietQrUrl = data && bankInfo ? buildVietQRUrl({
    bankBin: bankInfo.bin || data.bankBin,
    accountNo: data.accountNo,
    template: data.template || 'compact2',
    amount: data.amount,
    memo: data.memo,
    accountName: data.accountName
  }) : '';

  const handleDownloadQR = () => {
    const urlToDownload = qrStyle === 'standard' && emvcoQrUrl ? emvcoQrUrl : (vietQrUrl || emvcoQrUrl);
    if (urlToDownload) {
      const link = document.createElement('a');
      link.href = urlToDownload;
      link.download = `vietqr-${data?.accountNo || 'chuyen-khoan'}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Đã tải ảnh mã QR xuống thiết bị!');
    }
  };

  const handleShare = async () => {
    const fullUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chuyển tiền tới ${data?.accountName || 'tài khoản'}`,
          text: `Mã QR & ${data?.isCard ? 'Số thẻ Napas' : 'Số tài khoản'} chuyển tiền ${bankInfo?.shortName || ''} - ${data?.accountNo}`,
          url: fullUrl
        });
      } catch (e) {}
    } else {
      handleCopy(fullUrl, 'url', 'đường dẫn thanh toán');
    }
  };

  if (loading) {
    return (
      <div className="payment-page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <RefreshCw size={36} className="gradient-text spin" style={{ margin: '0 auto 16px auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>Đang giải mã thông tin chuyển khoản an toàn...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="payment-page-container">
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <AlertTriangle size={48} color="var(--rose-400)" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Liên kết không hợp lệ hoặc đã hết hạn</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Không tìm thấy thông tin chuyển khoản từ mã liên kết này. Vui lòng kiểm tra lại đường link người gửi cung cấp hoặc tạo mã mới.
          </p>
          <button className="btn-primary" onClick={onGoHome} style={{ margin: '0 auto', maxWidth: '280px' }}>
            <ArrowLeft size={18} />
            <span>Tạo mã QR & Link mới</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page-container">
      {/* Back to Generator button */}
      <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="icon-btn" 
          onClick={onGoHome}
          style={{ fontSize: '0.84rem' }}
        >
          <ArrowLeft size={15} />
          <span>Tạo mã của riêng bạn</span>
        </button>

        <span className="brand-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={13} />
          <span>Napas 24/7 Verified</span>
        </span>
      </div>

      <div className="payment-card">
        {/* Header with Bank Badge */}
        <div className="payment-card-header">
          <div className="payment-bank-badge">
            {bankInfo?.logo && (
              <img 
                src={bankInfo.logo} 
                alt={bankInfo.shortName} 
                style={{ width: '38px', height: '24px', objectFit: 'contain' }} 
              />
            )}
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              {bankInfo?.shortName || data.bankBin}
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            Thanh toán & Chuyển khoản
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Quét mã QR dưới đây bằng app ngân hàng để chuyển tiền ngay tức thì
          </p>

          {/* Style Selector Tabs */}
          <div style={{ display: 'inline-flex', gap: '8px', marginTop: '14px' }}>
            <button
              className={`chip-btn ${qrStyle === 'standard' ? 'active' : ''}`}
              onClick={() => setQrStyle('standard')}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            >
              ⚡ Chuẩn Napas (Quét cực nhạy)
            </button>
            <button
              className={`chip-btn ${qrStyle === 'styled' ? 'active' : ''}`}
              onClick={() => setQrStyle('styled')}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
            >
              Mẫu Thẻ VietQR
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="payment-qr-container">
          <div className="payment-qr-box">
            {qrStyle === 'standard' && emvcoQrUrl ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  {bankInfo?.logo && (
                    <img 
                      src={bankInfo.logo} 
                      alt={bankInfo.shortName} 
                      style={{ height: '26px', objectFit: 'contain' }} 
                    />
                  )}
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                    {bankInfo?.shortName}
                  </span>
                </div>

                <img 
                  src={emvcoQrUrl} 
                  alt="Mã QR Napas 24/7" 
                  className="payment-qr-img" 
                  style={{ padding: '6px' }}
                />

                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px', fontWeight: 700 }}>
                  VIETQR • NAPAS 24/7 {data.isCard ? '(CHUYỂN QUA SỐ THẺ)' : ''}
                </div>
              </div>
            ) : vietQrUrl ? (
              <img 
                src={vietQrUrl} 
                alt="Mã VietQR" 
                className="payment-qr-img"
                onError={() => setQrStyle('standard')}
              />
            ) : emvcoQrUrl ? (
              <img 
                src={emvcoQrUrl} 
                alt="Mã QR Chuyển Tiền" 
                className="payment-qr-img" 
              />
            ) : (
              <div style={{ padding: '30px', color: '#94a3b8' }}>Đang nạp mã QR...</div>
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Hỗ trợ 100% ứng dụng ngân hàng & Ví MoMo, ZaloPay, ViettelMoney
          </p>

          <div className="payment-actions-bar">
            <button className="icon-btn" onClick={() => setShowAppsModal(true)} style={{ justifyContent: 'center' }}>
              <Smartphone size={16} color="var(--emerald-400)" />
              <span>Mở App Ngân hàng</span>
            </button>
            <button className="icon-btn" onClick={handleDownloadQR} style={{ justifyContent: 'center' }}>
              <Download size={16} />
              <span>Tải ảnh QR</span>
            </button>
          </div>
        </div>

        {/* Payment Data Fields with 1-click Copy */}
        <div className="payment-data-list">
          {/* Account Number / Card Number */}
          <div className="payment-data-item">
            <div>
              <div className="data-item-label">
                {data.isCard ? 'Số thẻ ATM Napas thụ hưởng' : 'Số tài khoản thụ hưởng'}
              </div>
              <div className="data-item-val" style={{ letterSpacing: '0.05em' }}>
                {data.accountNo}
              </div>
            </div>
            <button 
              className={`copy-badge-btn ${copiedField === 'account' ? 'copied' : ''}`}
              onClick={() => handleCopy(data.accountNo, 'account', data.isCard ? 'số thẻ' : 'số tài khoản')}
            >
              {copiedField === 'account' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === 'account' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Account Name */}
          {data.accountName && (
            <div className="payment-data-item">
              <div>
                <div className="data-item-label">Tên người nhận</div>
                <div className="data-item-val" style={{ textTransform: 'uppercase' }}>
                  {data.accountName}
                </div>
              </div>
              <span className="brand-badge" style={{ alignSelf: 'center' }}>
                Chính chủ
              </span>
            </div>
          )}

          {/* Bank Full Name */}
          <div className="payment-data-item">
            <div>
              <div className="data-item-label">Ngân hàng thụ hưởng</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {bankInfo?.name || bankInfo?.shortName || data.bankBin}
              </div>
            </div>
            {data.isCard && (
              <span className="brand-badge" style={{ alignSelf: 'center' }}>
                Thẻ Napas
              </span>
            )}
          </div>

          {/* Amount */}
          {data.amount && Number(data.amount) > 0 && (
            <div className="payment-data-item" style={{ background: 'rgba(0, 229, 153, 0.05)', borderColor: 'rgba(0, 229, 153, 0.25)' }}>
              <div>
                <div className="data-item-label" style={{ color: 'var(--emerald-400)' }}>Số tiền cần chuyển</div>
                <div className="data-item-amount">
                  {formatVND(data.amount)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>
                  {numberToVietnameseWords(data.amount)}
                </div>
              </div>
              <button 
                className={`copy-badge-btn ${copiedField === 'amount' ? 'copied' : ''}`}
                onClick={() => handleCopy(data.amount, 'amount', 'số tiền')}
              >
                {copiedField === 'amount' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          )}

          {/* Memo / Description */}
          {data.memo && (
            <div className="payment-data-item">
              <div>
                <div className="data-item-label">Nội dung chuyển khoản</div>
                <div className="data-item-val" style={{ fontSize: '0.98rem' }}>
                  {data.memo}
                </div>
              </div>
              <button 
                className={`copy-badge-btn ${copiedField === 'memo' ? 'copied' : ''}`}
                onClick={() => handleCopy(data.memo, 'memo', 'nội dung chuyển khoản')}
              >
                {copiedField === 'memo' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedField === 'memo' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Bar with Share & Help */}
        <div style={{ padding: '16px 24px 24px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="icon-btn" onClick={handleShare}>
            <Share2 size={15} />
            <span>Chia sẻ trang này</span>
          </button>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Mã định danh: {data.id || token.slice(0, 10)}
          </span>
        </div>
      </div>

      {/* 3 Simple Steps Guide */}
      <div className="glass-panel" style={{ marginTop: '20px', padding: '20px 24px' }}>
        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡 3 bước chuyển tiền siêu tốc</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--emerald-400)', fontWeight: 800 }}>1.</span>
            <span>Mở bất kỳ app ngân hàng nào (VCB, MB, Techcombank, TPBank, MoMo, ZaloPay,...)</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--emerald-400)', fontWeight: 800 }}>2.</span>
            <span>Chọn tính năng <strong>Quét QR</strong> và hướng vào mã QR ở trên (hoặc tải ảnh QR lên từ máy).</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ color: 'var(--emerald-400)', fontWeight: 800 }}>3.</span>
            <span>Kiểm tra tên người nhận & xác nhận chuyển tiền. Tiền về tài khoản ngay lập tức!</span>
          </div>
        </div>
      </div>

      {/* Bank Apps Launcher Modal */}
      <BankAppsModal 
        isOpen={showAppsModal} 
        onClose={() => setShowAppsModal(false)} 
      />
    </div>
  );
}
