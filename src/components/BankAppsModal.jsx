import React from 'react';
import { X, Smartphone, ExternalLink } from 'lucide-react';
import { POPULAR_BANK_APPS } from '../utils/vietqr';

export default function BankAppsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleOpenApp = (app) => {
    // Try opening app custom scheme
    window.location.href = app.scheme;
    // Fallback timer to app store if not opened
    setTimeout(() => {
      const storeUrl = isIOS ? app.ios : app.android;
      window.open(storeUrl, '_blank');
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Smartphone size={20} className="gradient-text" />
            <span>Mở ứng dụng ngân hàng</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '16px' }}>
            Chọn ứng dụng ngân hàng hoặc ví điện tử bạn đang sử dụng để thanh toán hoặc quét mã QR:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {POPULAR_BANK_APPS.map((app) => (
              <button
                key={app.name}
                className="share-btn"
                onClick={() => handleOpenApp(app)}
                style={{ justifyContent: 'space-between', padding: '12px 14px' }}
              >
                <span style={{ fontWeight: 600 }}>{app.name}</span>
                <ExternalLink size={14} color="var(--emerald-400)" />
              </button>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            💡 <strong>Mẹo:</strong> Bạn có thể chụp màn hình hoặc tải ảnh mã QR về máy, sau đó mở app ngân hàng và chọn <strong>"Quét QR" &gt; "Chọn ảnh từ thư viện"</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
