// VietQR generator, currency formatters, and banking app helpers

/**
 * Builds the official VietQR image URL
 */
export function buildVietQRUrl({ bankBin, accountNo, template = 'compact2', amount = '', memo = '', accountName = '' }) {
  if (!bankBin || !accountNo) return '';
  const cleanAccount = String(accountNo).replace(/\s+/g, '');
  const baseUrl = `https://img.vietqr.io/image/${bankBin}-${cleanAccount}-${template}.png`;
  const params = new URLSearchParams();

  if (amount && Number(amount) > 0) {
    params.set('amount', String(amount));
  }
  if (memo && memo.trim()) {
    params.set('addInfo', memo.trim());
  }
  if (accountName && accountName.trim()) {
    params.set('accountName', accountName.trim().toUpperCase());
  }

  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}
/**
 * Calls official VietQR generation API for verified Napas image
 */
export async function fetchOfficialVietQR({ bankBin, accountNo, template = 'compact2', amount = '', memo = '', accountName = '' }) {
  if (!bankBin || !accountNo) return null;
  const cleanAccount = String(accountNo).replace(/\s+/g, '');
  try {
    const res = await fetch('https://api.vietqr.io/v2/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountNo: cleanAccount,
        accountName: accountName ? accountName.trim().toUpperCase() : 'CHU TAI KHOAN',
        acqId: String(bankBin),
        amount: amount && Number(amount) > 0 ? String(amount) : undefined,
        addInfo: memo ? memo.trim() : undefined,
        format: 'text',
        template: template
      })
    });
    const data = await res.json();
    if (data && data.code === '00' && data.data) {
      return data.data; // contains qrCode and qrDataURL
    }
  } catch (err) {
    console.warn('Official VietQR API call error:', err);
  }
  return null;
}

/**
 * Formats a raw number or string into Vietnamese Dong display (e.g. "1.500.000 ₫")
 */
export function formatVND(value) {
  if (!value && value !== 0) return '';
  const num = typeof value === 'number' ? value : parseInt(String(value).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
}

/**
 * Cleans string to digits only
 */
export function cleanDigits(val) {
  return String(val || '').replace(/\D/g, '');
}

/**
 * Converts number to Vietnamese words (e.g., 500000 -> "Năm trăm nghìn đồng")
 */
export function numberToVietnameseWords(number) {
  const num = typeof number === 'number' ? number : parseInt(String(number).replace(/\D/g, ''), 10);
  if (!num || isNaN(num) || num <= 0) return '';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroupOfThree(threeDigits, showZeroHundred) {
    let a = Math.floor(threeDigits / 100);
    let b = Math.floor((threeDigits % 100) / 10);
    let c = threeDigits % 10;
    let res = '';

    if (a > 0 || showZeroHundred) {
      res += digits[a] + ' trăm ';
    }

    if (b > 1) {
      res += digits[b] + ' mươi ';
      if (c === 1) res += 'mốt ';
      else if (c === 5) res += 'lăm ';
      else if (c > 0) res += digits[c] + ' ';
    } else if (b === 1) {
      res += 'mười ';
      if (c === 5) res += 'lăm ';
      else if (c > 0) res += digits[c] + ' ';
    } else if (b === 0 && (a > 0 || showZeroHundred) && c > 0) {
      res += 'lẻ ' + digits[c] + ' ';
    } else if (c > 0) {
      res += digits[c] + ' ';
    }

    return res;
  }

  let numStr = String(num);
  let groups = [];
  while (numStr.length > 0) {
    groups.unshift(parseInt(numStr.slice(-3), 10));
    numStr = numStr.slice(0, -3);
  }

  let result = '';
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i];
    if (group > 0) {
      let groupStr = readGroupOfThree(group, i > 0);
      result += groupStr + units[groups.length - 1 - i] + ' ';
    }
  }

  result = result.trim();
  if (!result) return '';
  result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
  return result;
}

/**
 * Popular banking apps in Vietnam with mobile deep-links / app store identifiers
 */
export const POPULAR_BANK_APPS = [
  { name: 'VCB Digibank', scheme: 'vcb://', ios: 'https://apps.apple.com/vn/app/vcb-digibank/id561433133', android: 'https://play.google.com/store/apps/details?id=com.VCB' },
  { name: 'MBBank', scheme: 'mbbank://', ios: 'https://apps.apple.com/vn/app/mbbank/id1041933092', android: 'https://play.google.com/store/apps/details?id=com.mbmobile' },
  { name: 'Techcombank Mobile', scheme: 'techcombank://', ios: 'https://apps.apple.com/vn/app/techcombank-mobile/id1548623362', android: 'https://play.google.com/store/apps/details?id=vn.com.techcombank.bb.app' },
  { name: 'VPBank NEO', scheme: 'vpbankneo://', ios: 'https://apps.apple.com/vn/app/vpbank-neo/id826452424', android: 'https://play.google.com/store/apps/details?id=com.vnpay.vpbankonline' },
  { name: 'TPBank Mobile', scheme: 'tpbank://', ios: 'https://apps.apple.com/vn/app/tpbank-mobile/id450464147', android: 'https://play.google.com/store/apps/details?id=com.tpb.mb.gprsandroid' },
  { name: 'BIDV SmartBanking', scheme: 'bidv://', ios: 'https://apps.apple.com/vn/app/bidv-smartbanking/id1061861477', android: 'https://play.google.com/store/apps/details?id=com.vnpay.bidv' },
  { name: 'VietinBank iPay', scheme: 'vietinbank://', ios: 'https://apps.apple.com/vn/app/vietinbank-ipay/id680197609', android: 'https://play.google.com/store/apps/details?id=com.vietinbank.ipay' },
  { name: 'ACB ONE', scheme: 'acb://', ios: 'https://apps.apple.com/vn/app/acb-one/id950141024', android: 'https://play.google.com/store/apps/details?id=mobile.acb.com.vn' },
  { name: 'MoMo', scheme: 'momo://', ios: 'https://apps.apple.com/vn/app/v%C3%AD-momo-qu%C3%A9t-m%C3%A3-chuy%E1%BB%83n-ti%E1%BB%81n/id918751511', android: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer' },
  { name: 'ZaloPay', scheme: 'zalopay://', ios: 'https://apps.apple.com/vn/app/zalopay-v%C3%AD-%C4%91i%E1%BB%87n-t%E1%BB%AD-qu%E1%BB%91c-d%C3%A2n/id1112407590', android: 'https://play.google.com/store/apps/details?id=vn.com.vng.zalopay' }
];
