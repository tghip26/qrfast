import React, { useEffect, useState } from 'react';
import { 
  X, Check, Copy, Share2, Download, ExternalLink, 
  Sparkles, MessageSquare, Send, Globe 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  shareData, 
  onShowToast, 
  onOpenPayment 
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore if canvas confetti fails
      }
    }
  }, [isOpen]);

  if (!isOpen || !shareData) return null;

  const currentOrigin = window.location.origin + window.location.pathname;
  const fullShareUrl = `${currentOrigin}#/p/${shareData.token}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopiedLink(true);
      onShowToast('Đã sao chép liên kết thanh toán vào bộ nhớ tạm!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      onShowToast('Không thể tự động sao chép, vui lòng sao chép thủ công.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chuyển tiền nhanh tới ${shareData.accountName || 'tài khoản'}`,
          text: `Mã QR & Link chuyển khoản ngân hàng ${shareData.bankName || ''} - STK: ${shareData.accountNo}`,
          url: fullShareUrl,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareZalo = () => {
    window.open(`https://zalo.me/share?url=${encodeURIComponent(fullShareUrl)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullShareUrl)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Chuyển khoản tới ${shareData.accountName || 'tài khoản'} qua VietQR`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadQR = () => {
    if (shareData.qrUrl) {
      const link = document.createElement('a');
      link.href = shareData.qrUrl;
      link.download = `vietqr-${shareData.accountNo}-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('Đang tải ảnh mã QR...');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={20} color="var(--emerald-400)" />
            <span>Link & Mã QR đã được tạo!</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="success-banner">
            <div className="success-icon-wrap">
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Đường link ngẫu nhiên sẵn sàng</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Người nhận chỉ cần nhấp vào link là có thể quét mã QR và sao chép số tài khoản tức thì.
            </p>
          </div>

          {/* Randomized Encrypted Link Box */}
          <div className="form-label" style={{ marginBottom: '4px' }}>
            <span>Đường link mã hóa ngẫu nhiên:</span>
            <span className="label-hint">Duy nhất & bảo mật</span>
          </div>
          <div className="link-box-container">
            <span className="link-text">{fullShareUrl}</span>
            <button 
              className={`copy-badge-btn ${copiedLink ? 'copied' : ''}`}
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="share-buttons-grid">
            <button className="share-btn" onClick={handleShareZalo} title="Chia sẻ qua Zalo">
              <MessageSquare size={16} color="#0068ff" />
              <span>Gửi qua Zalo</span>
            </button>
            <button className="share-btn" onClick={handleShareFacebook} title="Chia sẻ qua Facebook">
              <Globe size={16} color="#1877f2" />
              <span>Facebook</span>
            </button>
            <button className="share-btn" onClick={handleShareTelegram} title="Chia sẻ qua Telegram">
              <Send size={16} color="#229ed9" />
              <span>Telegram</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            <button className="share-btn" onClick={handleDownloadQR}>
              <Download size={16} />
              <span>Tải ảnh QR</span>
            </button>
            <button className="share-btn" onClick={handleNativeShare}>
              <Share2 size={16} />
              <span>Chia sẻ thêm...</span>
            </button>
          </div>

          {/* Open Recipient View Button */}
          <button 
            className="btn-primary" 
            style={{ marginTop: '20px' }}
            onClick={() => {
              onClose();
              if (onOpenPayment) onOpenPayment(shareData.token);
            }}
          >
            <ExternalLink size={18} />
            <span>Xem trang thanh toán của người nhận</span>
          </button>
        </div>
      </div>
    </div>
  );
}
