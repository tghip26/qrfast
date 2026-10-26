import React from 'react';
import { X, Trash2, ExternalLink, Copy, Check, Clock, AlertCircle } from 'lucide-react';
import { formatVND } from '../utils/vietqr';

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  history = [], 
  onSelectHistory, 
  onDeleteHistoryItem, 
  onClearHistory,
  onShowToast 
}) {
  if (!isOpen) return null;

  const handleCopyLink = async (token) => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}#/p/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      onShowToast('Đã sao chép link từ lịch sử!');
    } catch (e) {
      onShowToast('Không thể sao chép liên kết.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Clock size={20} className="gradient-text" />
            <span>Lịch sử các link đã tạo</span>
            <span className="brand-badge">{history.length}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)' }}>Chưa có link nào được tạo</p>
              <p style={{ fontSize: '0.86rem', marginTop: '4px' }}>Các mã liên kết và QR bạn tạo sẽ được lưu tự động tại đây để tra cứu và gửi lại nhanh chóng.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                <button 
                  className="preset-btn clear-btn"
                  onClick={onClearHistory}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={13} />
                  <span>Xóa toàn bộ lịch sử</span>
                </button>
              </div>

              <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {history.map((item) => (
                  <div key={item.id || item.token} className="history-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.94rem' }}>
                          {item.bankShortName || item.bankCode || 'Ngân hàng'}
                        </span>
                        <span className="brand-badge" style={{ fontSize: '0.65rem' }}>
                          {item.accountNo}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.accountName && <span>{item.accountName}</span>}
                        {item.amount && (
                          <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
                            {formatVND(item.amount)}
                          </span>
                        )}
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')} {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        className="icon-btn icon-only" 
                        title="Sao chép link"
                        onClick={() => handleCopyLink(item.token)}
                      >
                        <Copy size={15} />
                      </button>
                      <button 
                        className="icon-btn icon-only active" 
                        title="Mở trang chuyển tiền"
                        onClick={() => {
                          onClose();
                          onSelectHistory(item.token);
                        }}
                      >
                        <ExternalLink size={15} />
                      </button>
                      <button 
                        className="icon-btn icon-only" 
                        title="Xóa"
                        onClick={() => onDeleteHistoryItem(item.id || item.token)}
                        style={{ color: 'var(--rose-400)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
