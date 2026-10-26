import React, { useState, useMemo } from 'react';
import { Search, X, Check, Building2 } from 'lucide-react';

export default function BankModal({ isOpen, onClose, banks = [], selectedBank, onSelectBank }) {
  const [search, setSearch] = useState('');

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    const query = search.toLowerCase().trim();
    return banks.filter(bank => 
      bank.shortName.toLowerCase().includes(query) ||
      bank.name.toLowerCase().includes(query) ||
      bank.code.toLowerCase().includes(query) ||
      bank.bin.includes(query)
    );
  }, [banks, search]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Building2 size={22} className="gradient-text" />
            <span>Chọn ngân hàng thụ hưởng</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="input-wrapper">
            <Search size={18} className="input-icon-left" />
            <input 
              type="text"
              className="bank-search-input"
              placeholder="Tìm theo tên ngân hàng, mã viết tắt, mã BIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="bank-list-grid">
            {filteredBanks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                Không tìm thấy ngân hàng phù hợp với "{search}"
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected = selectedBank && selectedBank.bin === bank.bin;
                return (
                  <button
                    key={bank.bin || bank.code}
                    className="bank-list-item"
                    onClick={() => {
                      onSelectBank(bank);
                      onClose();
                    }}
                    style={{
                      borderColor: isSelected ? 'var(--emerald-400)' : undefined,
                      background: isSelected ? 'rgba(0, 229, 153, 0.08)' : undefined
                    }}
                  >
                    <img 
                      src={bank.logo} 
                      alt={bank.shortName} 
                      className="bank-logo-img" 
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="bank-name-group" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="bank-short-name">{bank.shortName}</span>
                        <span className="brand-badge" style={{ fontSize: '0.65rem' }}>{bank.code}</span>
                      </div>
                      <span className="bank-full-name">{bank.name}</span>
                    </div>
                    {isSelected && (
                      <Check size={18} color="var(--emerald-400)" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
