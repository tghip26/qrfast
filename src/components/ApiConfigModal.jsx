import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Check, AlertCircle, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { lookupAccountName } from '../utils/vietqr';

export default function ApiConfigModal({ 
  isOpen, 
  onClose, 
  selectedBank, 
  accountNo, 
  onSaved, 
  onShowToast 
}) {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setClientId(localStorage.getItem('vietqr_client_id') || '');
      setApiKey(localStorage.getItem('vietqr_api_key') || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('vietqr_client_id', clientId.trim());
    localStorage.setItem('vietqr_api_key', apiKey.trim());
    if (onSaved) onSaved();
    onShowToast('Đã lưu cấu hình API VietQR thành công!');
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('vietqr_client_id');
    localStorage.removeItem('vietqr_api_key');
    setClientId('');
    setApiKey('');
    setTestResult(null);
    if (onSaved) onSaved();
    onShowToast('Đã xóa thông tin API Key!');
  };

  const handleTestConnection = async () => {
    if (!clientId.trim() || !apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập đầy đủ Client ID và API Key trước khi kiểm tra!'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Save temporarily to test
    const oldClientId = localStorage.getItem('vietqr_client_id');
    const oldApiKey = localStorage.getItem('vietqr_api_key');
    localStorage.setItem('vietqr_client_id', clientId.trim());
    localStorage.setItem('vietqr_api_key', apiKey.trim());

    try {
      const testBin = selectedBank?.bin || '970422'; // Default to MBBank
      const testAcc = accountNo || '2637979279';

      const foundName = await lookupAccountName({
        bankBin: testBin,
        accountNo: testAcc
      });

      if (foundName) {
        setTestResult({
          success: true,
          message: `Kết nối thành công! Đã tra cứu tên chủ tài khoản: ${foundName}`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Kết nối không thành công hoặc sai Client ID/API Key. Vui lòng kiểm tra lại.'
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: `Lỗi kết nối: ${e.message}`
      });
    } finally {
      // Revert if not saved yet
      if (oldClientId !== null) localStorage.setItem('vietqr_client_id', oldClientId);
      else localStorage.removeItem('vietqr_client_id');
      if (oldApiKey !== null) localStorage.setItem('vietqr_api_key', oldApiKey);
      else localStorage.removeItem('vietqr_api_key');
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Key size={20} color="var(--emerald-400)" />
            <span>Cài đặt API Tra cứu Tên Ngân hàng</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Guide box */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 229, 153, 0.08)',
            border: '1px solid rgba(0, 229, 153, 0.25)',
            fontSize: '0.84rem',
            lineHeight: 1.55,
            color: 'var(--text-main)'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--emerald-400)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Cách lấy API Key miễn phí (1 phút):
            </div>
            <ol style={{ paddingLeft: '18px', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
              <li>Truy cập <a href="https://my.vietqr.io" target="_blank" rel="noreferrer" style={{ color: 'var(--emerald-400)', textDecoration: 'underline', fontWeight: 600 }}>my.vietqr.io <ExternalLink size={12} style={{ display: 'inline' }} /></a> và đăng ký/đăng nhập miễn phí.</li>
              <li>Vào mục <strong>Tích hợp / Quản lý API Key</strong>.</li>
              <li>Sao chép <strong>Client ID</strong> và <strong>API Key</strong> rồi dán vào bên dưới.</li>
            </ol>
          </div>

          {/* Client ID */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>VietQR Client ID (x-client-id)</span>
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="Ví dụ: b8a7d3f1-4c2e-49b8-..."
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* API Key */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>VietQR API Key (x-api-key)</span>
            </label>
            <input 
              type="password"
              className="form-input"
              placeholder="Ví dụ: 9a7b8c6d-3f2e-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* Test connection result */}
          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: testResult.success ? 'rgba(0, 229, 153, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${testResult.success ? 'rgba(0, 229, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              fontSize: '0.84rem',
              color: testResult.success ? 'var(--emerald-400)' : 'var(--rose-400)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={testing}
              style={{ flex: 1, minWidth: '140px' }}
            >
              {testing ? <RefreshCw size={15} className="spin" /> : <RefreshCw size={15} />}
              <span>{testing ? 'Đang thử...' : 'Kiểm tra kết nối'}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              style={{ flex: 1, minWidth: '140px' }}
            >
              <Check size={16} />
              <span>Lưu Cấu Hình</span>
            </button>

            {(clientId || apiKey) && (
              <button
                type="button"
                className="icon-btn"
                onClick={handleClear}
                title="Xóa Key"
                style={{ color: 'var(--rose-400)' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
