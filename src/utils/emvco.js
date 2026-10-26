/**
 * Official VietQR EMVCo Standard Generator (Napas 24/7 Specification)
 * Generates 100% compliant QR strings compatible with ALL Vietnamese Banking Apps
 */

/**
 * Calculates CRC-16 CCITT (polynomial 0x1021, initial value 0xFFFF)
 */
export function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formats a single EMVCo Tag-Length-Value (TLV) field
 */
export function tlv(tag, value) {
  if (value === undefined || value === null || value === '') return '';
  const valStr = String(value);
  // Calculate length in UTF-8 bytes to ensure correct length for UTF-8 characters
  const len = new TextEncoder().encode(valStr).length;
  const lenStr = String(len).padStart(2, '0');
  return `${tag}${lenStr}${valStr}`;
}

/**
 * Strips Vietnamese accents for QR memo compatibility (banks expect unaccented uppercase/ASCII)
 */
export function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s.,\-_]/g, '')
    .trim();
}

/**
 * Generates the official VietQR / Napas 24/7 EMVCo string
 * @param {Object} options
 * @param {string} options.bankBin - 6-digit bank BIN (e.g. "970422" for MBBank)
 * @param {string} options.accountNo - Bank account number or 16-digit card number
 * @param {boolean} [options.isCard=false] - True if transferring to card number (QRIBFTTC), False for account (QRIBFTTA)
 * @param {number|string} [options.amount=''] - Amount in VND (optional)
 * @param {string} [options.memo=''] - Transfer description (optional)
 * @returns {string} EMVCo QR Payload (starts with "000201...")
 */
export function generateVietQREmvco({ bankBin, accountNo, isCard = false, amount = '', memo = '' }) {
  if (!bankBin || !accountNo) return '';

  const cleanBin = String(bankBin).trim();
  const cleanAccount = String(accountNo).replace(/\s+/g, '').trim();

  // 1. Tag 00: Payload Format Indicator (Version 01)
  const tag00 = tlv('00', '01');

  // 2. Tag 01: Point of Initiation Method ('12' = Dynamic with amount, '11' = Static)
  const hasAmount = amount && Number(amount) > 0;
  const tag01 = tlv('01', hasAmount ? '12' : '11');

  // 3. Tag 38: Merchant Account Information (NAPAS Guid + Beneficiary Bank/Account + Service Code)
  const guid = tlv('00', 'A000000727'); // Napas registered GUID
  
  // Beneficiary subtag 01 contains Bank BIN (subtag 00) and Account/Card No (subtag 01)
  const bankBinTlv = tlv('00', cleanBin);
  const accNoTlv = tlv('01', cleanAccount);
  const beneficiary = tlv('01', bankBinTlv + accNoTlv);

  // Service code: QRIBFTTA (transfer to account) or QRIBFTTC (transfer to card)
  const serviceCode = tlv('02', isCard ? 'QRIBFTTC' : 'QRIBFTTA');

  const tag38 = tlv('38', guid + beneficiary + serviceCode);

  // 4. Tag 53: Transaction Currency (704 = VND)
  const tag53 = tlv('53', '704');

  // 5. Tag 54: Transaction Amount (optional)
  const tag54 = hasAmount ? tlv('54', String(Math.floor(Number(amount)))) : '';

  // 6. Tag 58: Country Code (VN)
  const tag58 = tlv('58', 'VN');

  // 7. Tag 62: Additional Data Field (Memo / Purpose of transaction)
  let tag62 = '';
  if (memo && memo.trim()) {
    const cleanMemo = removeVietnameseAccents(memo.trim());
    if (cleanMemo) {
      const subtag08 = tlv('08', cleanMemo);
      tag62 = tlv('62', subtag08);
    }
  }

  // 8. Tag 63: CRC16 Checksum (Calculated over all characters including "6304")
  const rawPayload = tag00 + tag01 + tag38 + tag53 + tag54 + tag58 + tag62 + '6304';
  const checksum = calculateCRC16(rawPayload);

  return rawPayload + checksum;
}

/**
 * Detects bank from card number or account number prefix
 * e.g., "9704229208504906" -> detects MBBank (970422) and isCard = true
 */
export function detectBankFromCardNumber(input, banks = []) {
  if (!input) return null;
  const clean = String(input).replace(/\s+/g, '');

  // Napas card numbers are typically 16 or 19 digits starting with 9704
  if (clean.startsWith('9704') && clean.length >= 6) {
    const binPrefix = clean.substring(0, 6);
    const matchedBank = banks.find(b => String(b.bin) === binPrefix);
    if (matchedBank) {
      return {
        bank: matchedBank,
        isCard: clean.length >= 16,
        bin: binPrefix
      };
    }
  }

  return null;
}
