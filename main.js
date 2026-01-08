(() => {
  const tag = document.querySelector('.layout-tag');
  if (!tag) return;

  const updateLabel = () => {
    const w = Math.round(window.innerWidth);
    let label = `💻 (${w})`;
    if (w <= 480) {
      label = `📱 (T) (${w})`;
    } else if (w <= 540) {
      label = `📱 (S) (${w})`;
    } else if (w <= 768) {
      label = `📱 (L) (${w})`;
    } else if (w <= 900) {
      label = `📺 (${w})`;
    }
    tag.textContent = label;
  };

  window.addEventListener('resize', updateLabel, { passive: true });
  updateLabel();
})();

// Detect mobile/tablet WebKit to simulate fixed background via overlay (covers iPadOS Safari with Mac UA)
(() => {
  const ua = navigator.userAgent || '';
  const isIOSWebKit = /iP(hone|od|ad).+AppleWebKit/i.test(ua);
  const isIPadMacSafari = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (isIOSWebKit || isIPadMacSafari) {
    document.documentElement.classList.add('ios-fixed-bg');
  }
})();

// Lightweight i18n loader
const i18n = (() => {
  const supported = [
    'fr',
    'es',
    'es-ES',
    'es-MX',
    'en',
    'en-AU',
    'en-GB',
    'de',
    'it',
    'pt-BR',
    'ja',
    'ko',
    'zh-Hans',
    'zh-Hant',
    'zh-Hant-HK',
    'zh-Hant-TW',
    'zh-Hant-MO',
    'hi',
    'ar',
    'tr',
    'nl',
    'sv',
    'id',
    'th',
    'pl'
  ];

    const normalize = (lang) => {
      if (!lang) return 'en';
      const lower = lang.toLowerCase();
      if (lower.startsWith('pt')) return 'pt-BR';
      if (lower.startsWith('es')) {
        if (lower.includes('mx')) return 'es-MX';
        return 'es';
      }
      if (lower.startsWith('en')) {
        if (lower.includes('au')) return 'en-AU';
        if (lower.includes('gb') || lower.includes('uk')) return 'en-GB';
        return 'en';
      }
      if (lower.startsWith('zh')) {
        const isHK = lower.includes('hk');
        const isTW = lower.includes('tw');
        const isMO = lower.includes('mo');
        if (lower.includes('hant') || isHK || isTW || isMO) {
          if (isHK) return 'zh-Hant-HK';
          if (isTW) return 'zh-Hant-TW';
          if (isMO) return 'zh-Hant-MO';
          return 'zh-Hant-MO';
        }
        return 'zh-Hans';
      }
    const base = lower.split('-')[0];
    const match = supported.find((l) => l.toLowerCase() === lower || l.split('-')[0] === base);
    return match || 'en';
  };

  const getLocale = () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('lang');
    if (query) return normalize(query);
    const navLangs = navigator.languages || [navigator.language];
    for (const l of navLangs) {
      const norm = normalize(l);
      if (supported.includes(norm)) return norm;
    }
    return 'en';
  };

  const applyTranslations = (strings) => {
    if (!strings) return;
    document.documentElement.lang = strings.__lang || currentLocale;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = strings[key];
      if (!val) return;
      el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const mappings = el.dataset.i18nAttr.split(',').map((s) => s.trim());
      mappings.forEach((mapping) => {
        const [attr, key] = mapping.split(':').map((s) => s.trim());
        if (!attr || !key) return;
        if (strings[key]) {
          el.setAttribute(attr, strings[key]);
        }
      });
    });
  };

  const fetchLocale = async (locale) => {
    const base = locale.split('-')[0];
    const isZhHant = locale.toLowerCase().startsWith('zh-hant');
    const tryPaths = [
      `assets/i18n/${locale}.json`,
      `assets/i18n/${locale.toLowerCase()}.json`,
      ...(isZhHant ? ['assets/i18n/zh-Hant.json'] : []),
      ...(base && base !== locale ? [`assets/i18n/${base}.json`] : [])
    ];

    for (const path of tryPaths) {
      try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error('load failed');
        return await res.json();
      } catch (_) {
        // try next path or fallback below
      }
    }

    if (locale !== 'en') {
      try {
        const res = await fetch('assets/i18n/en.json', { cache: 'no-cache' });
        if (res.ok) return res.json();
      } catch (_) {
        // fall through
      }
    }
    return null;
  };

  // Temporary forced locale override (e.g., testing). Set to null/undefined to return to auto-detect.
  const forcedLocale = null;
  const currentLocale = forcedLocale || getLocale();
  const ready = fetchLocale(currentLocale).then((strings) => {
    applyTranslations(strings);
    // Preserve lang param on internal links marked for preservation
    document.querySelectorAll('[data-lang-preserve]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(href, window.location.origin);
      url.searchParams.set('lang', currentLocale);
      a.href = url.pathname + url.search + url.hash;
    });
    // Localized pricing (shared map)
    const priceEl = document.querySelector('[data-price-target="hero-price"]');
    const priceMapMonthly = {
      en: { currency: 'USD', value: '6.99', locale: 'en-US' },
      'en-AU': { currency: 'AUD', value: '9.99', locale: 'en-AU' },
      'en-GB': { currency: 'GBP', value: '6.99', locale: 'en-GB' },
      fr: { currency: 'EUR', value: '7.99', locale: 'fr-FR' },
      es: { currency: 'EUR', value: '7.99', locale: 'es-ES' },
      'es-ES': { currency: 'EUR', value: '7.99', locale: 'es-ES' },
      'es-MX': { currency: 'MXN', value: '149', locale: 'es-MX', decimals: 0, customSymbol: 'MX$ ' },
      de: { currency: 'EUR', value: '7.99', locale: 'de-DE' },
      it: { currency: 'EUR', value: '7.99', locale: 'it-IT' },
      'pt-BR': { currency: 'BRL', value: '49,90', locale: 'pt-BR' },
      ja: { currency: 'JPY', value: '1100', locale: 'ja-JP', decimals: 0 },
      ko: { currency: 'KRW', value: '9900', locale: 'ko-KR', decimals: 0 },
      'zh-Hans': { currency: 'CNY', value: '48.00', locale: 'zh-CN' },
      'zh-Hant': { currency: 'MOP', value: '6.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '58', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '220', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '6.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      hi: { currency: 'INR', value: '699', locale: 'hi-IN' },
      ar: { currency: 'SAR', value: '29.99', locale: 'ar-SA' },
      tr: { currency: 'TRY', value: '299.99', locale: 'tr-TR' },
      nl: { currency: 'EUR', value: '7.99', locale: 'nl-NL' },
      sv: { currency: 'SEK', value: '99', locale: 'sv-SE' },
      id: { currency: 'IDR', value: '119000', locale: 'id-ID', decimals: 0 },
      th: { currency: 'THB', value: '249', locale: 'th-TH' },
      pl: { currency: 'PLN', value: '39.99', locale: 'pl-PL' }
    };

    const priceMapAnnual = {
      en: { currency: 'USD', value: '29.99', locale: 'en-US' },
      'en-AU': { currency: 'AUD', value: '49.99', locale: 'en-AU' },
      'en-GB': { currency: 'GBP', value: '29.99', locale: 'en-GB' },
      fr: { currency: 'EUR', value: '34.99', locale: 'fr-FR' },
      es: { currency: 'EUR', value: '34.99', locale: 'es-ES' },
      'es-ES': { currency: 'EUR', value: '34.99', locale: 'es-ES' },
      'es-MX': { currency: 'MXN', value: '599', locale: 'es-MX', decimals: 0, customSymbol: 'MX$ ' },
      de: { currency: 'EUR', value: '34.99', locale: 'de-DE' },
      it: { currency: 'EUR', value: '34.99', locale: 'it-IT' },
      'pt-BR': { currency: 'BRL', value: '199.90', locale: 'pt-BR' },
      ja: { currency: 'JPY', value: '5000', locale: 'ja-JP', decimals: 0 },
      ko: { currency: 'KRW', value: '44000', locale: 'ko-KR', decimals: 0 },
      'zh-Hans': { currency: 'CNY', value: '198.00', locale: 'zh-CN' },
      'zh-Hant': { currency: 'MOP', value: '29.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '228', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '990', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '29.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      hi: { currency: 'INR', value: '2999', locale: 'hi-IN' },
      ar: { currency: 'SAR', value: '129.99', locale: 'ar-SA' },
      tr: { currency: 'TRY', value: '1299.99', locale: 'tr-TR' },
      nl: { currency: 'EUR', value: '34.99', locale: 'nl-NL' },
      sv: { currency: 'SEK', value: '399', locale: 'sv-SE' },
      id: { currency: 'IDR', value: '499000', locale: 'id-ID', decimals: 0 },
      th: { currency: 'THB', value: '999', locale: 'th-TH' },
      pl: { currency: 'PLN', value: '149.99', locale: 'pl-PL' }
    };

    const priceMapFamilyMonthly = {
      en: { currency: 'USD', value: '9.99', locale: 'en-US' },
      'en-AU': { currency: 'AUD', value: '14.99', locale: 'en-AU' },
      'en-GB': { currency: 'GBP', value: '9.99', locale: 'en-GB' },
      fr: { currency: 'EUR', value: '9.99', locale: 'fr-FR' },
      es: { currency: 'EUR', value: '9.99', locale: 'es-ES' },
      'es-ES': { currency: 'EUR', value: '9.99', locale: 'es-ES' },
      'es-MX': { currency: 'MXN', value: '199', locale: 'es-MX', decimals: 0, customSymbol: 'MX$ ' },
      de: { currency: 'EUR', value: '9.99', locale: 'de-DE' },
      it: { currency: 'EUR', value: '9.99', locale: 'it-IT' },
      'pt-BR': { currency: 'BRL', value: '59.90', locale: 'pt-BR' },
      ja: { currency: 'JPY', value: '1500', locale: 'ja-JP', decimals: 0 },
      ko: { currency: 'KRW', value: '14000', locale: 'ko-KR', decimals: 0 },
      'zh-Hans': { currency: 'CNY', value: '68.00', locale: 'zh-CN' },
      'zh-Hant': { currency: 'MOP', value: '9.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '88', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '320', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '9.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      hi: { currency: 'INR', value: '999', locale: 'hi-IN' },
      ar: { currency: 'SAR', value: '39.99', locale: 'ar-SA' },
      tr: { currency: 'TRY', value: '449.99', locale: 'tr-TR' },
      nl: { currency: 'EUR', value: '9.99', locale: 'nl-NL' },
      sv: { currency: 'SEK', value: '129', locale: 'sv-SE' },
      id: { currency: 'IDR', value: '169000', locale: 'id-ID', decimals: 0 },
      th: { currency: 'THB', value: '399', locale: 'th-TH' },
      pl: { currency: 'PLN', value: '49.99', locale: 'pl-PL' }
    };

    const priceMapFamilyAnnual = {
      en: { currency: 'USD', value: '39.99', locale: 'en-US' },
      'en-AU': { currency: 'AUD', value: '59.99', locale: 'en-AU' },
      'en-GB': { currency: 'GBP', value: '39.99', locale: 'en-GB' },
      fr: { currency: 'EUR', value: '44.99', locale: 'fr-FR' },
      es: { currency: 'EUR', value: '44.99', locale: 'es-ES' },
      'es-ES': { currency: 'EUR', value: '44.99', locale: 'es-ES' },
      'es-MX': { currency: 'MXN', value: '899', locale: 'es-MX', decimals: 0, customSymbol: 'MX$ ' },
      de: { currency: 'EUR', value: '44.99', locale: 'de-DE' },
      it: { currency: 'EUR', value: '44.99', locale: 'it-IT' },
      'pt-BR': { currency: 'BRL', value: '249.90', locale: 'pt-BR' },
      ja: { currency: 'JPY', value: '6000', locale: 'ja-JP', decimals: 0 },
      ko: { currency: 'KRW', value: '55000', locale: 'ko-KR', decimals: 0 },
      'zh-Hans': { currency: 'CNY', value: '298.00', locale: 'zh-CN' },
      'zh-Hant': { currency: 'MOP', value: '39.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '288', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '1290', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '39.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      hi: { currency: 'INR', value: '3999', locale: 'hi-IN' },
      ar: { currency: 'SAR', value: '179.99', locale: 'ar-SA' },
      tr: { currency: 'TRY', value: '1799.99', locale: 'tr-TR' },
      nl: { currency: 'EUR', value: '44.99', locale: 'nl-NL' },
      sv: { currency: 'SEK', value: '499', locale: 'sv-SE' },
      id: { currency: 'IDR', value: '699000', locale: 'id-ID', decimals: 0 },
      th: { currency: 'THB', value: '1490', locale: 'th-TH' },
      pl: { currency: 'PLN', value: '199.99', locale: 'pl-PL' }
    };

    const priceMapFamilyLifetime = {
      en: { currency: 'USD', value: '59.99', locale: 'en-US' },
      'en-AU': { currency: 'AUD', value: '99.99', locale: 'en-AU' },
      'en-GB': { currency: 'GBP', value: '59.99', locale: 'en-GB' },
      fr: { currency: 'EUR', value: '69.99', locale: 'fr-FR' },
      es: { currency: 'EUR', value: '69.99', locale: 'es-ES' },
      'es-ES': { currency: 'EUR', value: '69.99', locale: 'es-ES' },
      'es-MX': { currency: 'MXN', value: '1299', locale: 'es-MX', decimals: 0, customSymbol: 'MX$ ' },
      de: { currency: 'EUR', value: '69.99', locale: 'de-DE' },
      it: { currency: 'EUR', value: '69.99', locale: 'it-IT' },
      'pt-BR': { currency: 'BRL', value: '399.90', locale: 'pt-BR' },
      ja: { currency: 'JPY', value: '10000', locale: 'ja-JP', decimals: 0 },
      ko: { currency: 'KRW', value: '88000', locale: 'ko-KR', decimals: 0 },
      'zh-Hans': { currency: 'CNY', value: '398.00', locale: 'zh-CN' },
      'zh-Hant': { currency: 'MOP', value: '59.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '488', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '1990', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '59.99', locale: 'zh-MO', decimals: 2, customSymbol: 'MOP$ ' },
      hi: { currency: 'INR', value: '5900', locale: 'hi-IN' },
      ar: { currency: 'SAR', value: '249.99', locale: 'ar-SA' },
      tr: { currency: 'TRY', value: '2999.99', locale: 'tr-TR' },
      nl: { currency: 'EUR', value: '69.99', locale: 'nl-NL' },
      sv: { currency: 'SEK', value: '799', locale: 'sv-SE' },
      id: { currency: 'IDR', value: '999000', locale: 'id-ID', decimals: 0 },
      th: { currency: 'THB', value: '1990', locale: 'th-TH' },
      pl: { currency: 'PLN', value: '299.99', locale: 'pl-PL' }
    };

    const formatPrice = (langKey, tier = 'monthly') => {
      const map =
        tier === 'annual'
          ? priceMapAnnual
          : tier === 'family-monthly'
            ? priceMapFamilyMonthly
            : tier === 'family-annual'
              ? priceMapFamilyAnnual
              : tier === 'family-lifetime'
                ? priceMapFamilyLifetime
                : priceMapMonthly;
      const baseKey = langKey.split('-')[0];
      const matchKey = map[langKey] ? langKey : (map[baseKey] ? baseKey : 'en');
      const priceInfo = map[matchKey] || map.en;
      const locale = priceInfo.locale || langKey || 'en-US';
      const effLocale =
        priceInfo.currency === 'TWD' && locale.toLowerCase().startsWith('zh')
          ? 'en-US'
          : locale;
      const numeric = parseFloat(String(priceInfo.value).replace(',', '.'));
      if (priceInfo.customSymbol) {
        const decs = typeof priceInfo.decimals === 'number' ? priceInfo.decimals : 2;
        const formatter = new Intl.NumberFormat(effLocale, {
          minimumFractionDigits: decs,
          maximumFractionDigits: decs
        });
        const numStr = formatter.format(Number.isFinite(numeric) ? numeric : Number(priceInfo.value) || 0);
        return `${priceInfo.customSymbol}${numStr}`;
      } else {
        const fmtOpts = {
          style: 'currency',
          currency: priceInfo.currency,
          currencyDisplay: 'symbol'
        };
        if (typeof priceInfo.decimals === 'number') {
          fmtOpts.minimumFractionDigits = priceInfo.decimals;
          fmtOpts.maximumFractionDigits = priceInfo.decimals;
        }
        const formatter = new Intl.NumberFormat(effLocale, fmtOpts);
        return formatter.format(Number.isFinite(numeric) ? numeric : Number(priceInfo.value) || 0);
      }
    };
    const replacePriceToken = (text, newPrice) => {
      if (!text) return newPrice;
      const tokenRegex = /([\p{Sc}A-Z]{0,3}\s?[\d.,]+(?:\s?[A-Z]{3})?)/gu;
      if (tokenRegex.test(text)) return text.replace(tokenRegex, newPrice);
      const numRegex = /[\d][\d.,]*/g;
      if (numRegex.test(text)) return text.replace(numRegex, newPrice);
      return `${newPrice} ${text}`;
    };
    if (priceEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'monthly');
      const baseText =
        (strings && strings['pricing.subtitle']) ||
        (strings && strings.pricing && strings.pricing.subtitle) ||
        priceEl.textContent ||
        '';
      const text = replacePriceToken(baseText, priceLabel);
      priceEl.textContent = text;
      priceEl.setAttribute('aria-label', text);
    }
    // Pro first-card price (pro page)
    const proPriceEl = document.querySelector('[data-price-target="pro-monthly"]');
    if (proPriceEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'monthly');
      proPriceEl.textContent = priceLabel;
      proPriceEl.setAttribute('aria-label', priceLabel);
    }
    const proAnnualEl = document.querySelector('[data-price-target="pro-annual"]');
    if (proAnnualEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'annual');
      proAnnualEl.textContent = priceLabel;
      proAnnualEl.setAttribute('aria-label', priceLabel);
    }
    const proFamilyMonthlyEl = document.querySelector('[data-price-target="pro-family-monthly"]');
    if (proFamilyMonthlyEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'family-monthly');
      proFamilyMonthlyEl.textContent = priceLabel;
      proFamilyMonthlyEl.setAttribute('aria-label', priceLabel);
    }
    const proFamilyAnnualEl = document.querySelector('[data-price-target="pro-family-annual"]');
    if (proFamilyAnnualEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'family-annual');
      proFamilyAnnualEl.textContent = priceLabel;
      proFamilyAnnualEl.setAttribute('aria-label', priceLabel);
    }
    const proFamilyLifetimeEl = document.querySelector('[data-price-target="pro-family-lifetime"]');
    if (proFamilyLifetimeEl) {
      const langKey = currentLocale || 'en';
      const priceLabel = formatPrice(langKey, 'family-lifetime');
      proFamilyLifetimeEl.textContent = priceLabel;
      proFamilyLifetimeEl.setAttribute('aria-label', priceLabel);
    }
    return strings;
  });

  return {
    ready,
    currentLocale,
    supported,
    setLocale: (locale) => {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', locale);
      window.location.href = url.toString();
    }
  };
})();

// Language picker (home only)
(() => {
  const picker = document.querySelector('.lang-picker');
  if (!picker) return;
  const btn = picker.querySelector('.lang-button');
  const menu = picker.querySelector('.lang-menu');
  if (!btn || !menu) return;

  const langs = [
    { code: 'en', label: '🇺🇸 English' },
    { code: 'en-GB', label: '🇬🇧 English (UK)' },
    { code: 'en-AU', label: '🇦🇺 English (Australia)' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'es-ES', label: '🇪🇸 Español (España)' },
    { code: 'es-MX', label: '🇲🇽 Español (México)' },
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'it', label: '🇮🇹 Italiano' },
    { code: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
    { code: 'ja', label: '🇯🇵 日本語' },
    { code: 'ko', label: '🇰🇷 한국어' },
    { code: 'zh-Hans', label: '🇨🇳 简体中文' },
    { code: 'zh-Hant-MO', label: '🇲🇴 繁體中文 (澳門)' },
    { code: 'zh-Hant-HK', label: '🇭🇰 繁體中文 (香港)' },
    { code: 'zh-Hant-TW', label: '🇹🇼 繁體中文 (台灣)' },
    { code: 'hi', label: '🇮🇳 हिन्दी' },
    { code: 'ar', label: '🇸🇦 العربية' },
    { code: 'tr', label: '🇹🇷 Türkçe' },
    { code: 'nl', label: '🇳🇱 Nederlands' },
    { code: 'sv', label: '🇸🇪 Svenska' },
    { code: 'id', label: '🇮🇩 Bahasa Indonesia' },
    { code: 'th', label: '🇹🇭 ไทย' },
    { code: 'pl', label: '🇵🇱 Polski' }
  ];

  const current = i18n.currentLocale;

  langs.forEach((lang) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.code = lang.code;
    li.textContent = lang.label;
    if (lang.code === current) li.classList.add('active');
    li.addEventListener('click', () => {
      closeMenu();
      i18n.setLocale(lang.code);
    });
    menu.appendChild(li);
  });

  const openMenu = () => {
    // move menu to body to avoid parent clipping
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    // Ensure we measure after display is applied
    menu.style.display = 'block';
    menu.style.position = 'fixed';
    // Re-measure after display so zoom/scroll placement is correct
    requestAnimationFrame(() => {
      const btnRect = btn.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const availableBelow = viewportHeight - btnRect.bottom - 12;
      const maxHeight = Math.max(160, availableBelow);
      menu.style.maxHeight = `${maxHeight}px`;
      menu.style.overflowY = 'auto';
      const top = btnRect.bottom + 6;
      const left = Math.min(
        btnRect.left,
        window.innerWidth - menuRect.width - 8
      );
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    });
    document.addEventListener('click', handleOutside, { once: true });
  };

  const closeMenu = () => {
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    menu.style.display = 'none';
  };

  const handleOutside = (e) => {
    if (!picker.contains(e.target)) closeMenu();
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
})();

// Hero wave subtle amplitude shift on scroll (clipped, no resize)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const createWaveAnimator = (selector, opts = {}) => {
    const path = document.querySelector(selector);
    if (!path) return;

    const {
      baseAmp = 26,
      maxDelta = 18,
      decay = 0.9,
      minEnergy = 0.01,
      scrollRange = 600,
      freq = 0.004,
      crestCap = 41,
      velocityGain = 0.0,
      maxEnergy = 1.5
    } = opts;

    const buildPath = (amp) => {
      const crest = Math.min(crestCap, 1 + amp); // cap within viewBox height
      return `M0,1 C225,1 225,${crest} 450,${crest} C675,${crest} 675,1 900,1 C1125,1 1125,${crest} 1350,${crest} C1575,${crest} 1575,1 1800,1 L1800,42 L0,42 Z`;
    };

    let ticking = false;
    let energy = 0;
    let scrollFactor = 0;
    let lastY = window.scrollY || 0;
    let lastT = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY || 0;
      const dy = y - lastY;
      const dt = Math.max(1, now - lastT); // ms

      scrollFactor = Math.min(1, y / scrollRange);

      // velocity-driven kick (px/ms -> px/s scaled)
      const speed = Math.abs(dy) / dt; // px per ms
      const impulse = Math.min(maxEnergy, speed * velocityGain);
      energy = Math.min(maxEnergy, energy + impulse);

      lastY = y;
      lastT = now;
    };

    const animate = (ts) => {
      energy = Math.max(minEnergy, energy * decay); // decay toward calm
      const wobble = Math.sin(ts * freq);
      const amp = baseAmp + (maxDelta * scrollFactor * wobble) + (maxDelta * energy * 0.6);
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          path.setAttribute('d', buildPath(amp));
          ticking = false;
        });
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  // Home wave (index.html)
  createWaveAnimator('.home-hero-wave path', {
    baseAmp: 26,
    maxDelta: 18,
    scrollRange: 600,
    velocityGain: 0.0,
    maxEnergy: 1.0,
  });

  // Pro foreground wave (front layer only)
  createWaveAnimator('.pro-page .hero-wave:not(.hero-wave-chaos):not(.hero-wave-back) path', {
    baseAmp: 24,
    maxDelta: 22,
    scrollRange: 500,
    freq: 0.0038,
    velocityGain: 1.2, // larger kicks on rapid scroll
    maxEnergy: 2.5,
  });
})();

// Perk marquee scroll (cycle images within container)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const track = document.querySelector('.perk-animation-track');
  if (!track) return;

  const items = Array.from(track.children);
  if (!items.length) return;

  const style = getComputedStyle(track);
  const gapPx = (() => {
    const g = parseFloat(style.gap || style.columnGap || '0');
    return Number.isFinite(g) ? g : 0;
  })();

  // Duplicate items for seamless loop without DOM shuffles
  const clones = items.map((node) => node.cloneNode(true));
  clones.forEach((node) => track.appendChild(node));

  const singleSetWidth =
    items.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) +
    gapPx * (items.length - 1);

  let offset = 0;
  let lastTime = null;
  const speed = 35; // px per second

  const step = (ts) => {
    if (lastTime == null) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;

    offset -= speed * dt;
    if (-offset >= singleSetWidth) {
      offset += singleSetWidth;
    }

    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
})();

// FAQ accordion toggles
(() => {
  const items = Array.from(document.querySelectorAll('.faq-item'));
  if (!items.length) return;

  const collapse = (item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0px';
  };

  const expand = (item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = `${answer.scrollHeight}px`;
  };

  items.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    // Init collapsed
    collapse(item);
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        collapse(item);
      } else {
        expand(item);
      }
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (item.classList.contains('open')) {
        const answer = item.querySelector('.faq-answer');
        if (answer) {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      }
    });
  }, { passive: true });
})();

// Scroll reveal animations (respect reduced motion)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const revealGroup = (nodes, { rootMargin = '0px', threshold = 0.25, baseDelay = 0, stagger = 120 } = {}) => {
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin, threshold });

    nodes.forEach((node, idx) => {
      node.classList.add('will-reveal');
      const delay = (baseDelay + idx * stagger) / 1000;
      node.style.transitionDelay = `${delay}s`;
      observer.observe(node);
    });
  };

  // Supported services cards
  revealGroup(Array.from(document.querySelectorAll('.service')), { threshold: 0.2, baseDelay: 0, stagger: 80 });

  // How it works cards (stagger inner rows per card)
  const howCards = Array.from(document.querySelectorAll('.how-card'));
  howCards.forEach((card, cardIdx) => {
    const parts = [
      card,
      ...Array.from(card.querySelectorAll('.how-card-visual')), // animate visual wrapper to preserve image transforms
      ...Array.from(card.querySelectorAll('.how-step, .how-text h3, .how-text p'))
    ];
    revealGroup(parts, { threshold: 0.2, baseDelay: cardIdx * 120, stagger: 100 });
  });

  // Pro carousel block on home page (stagger children)
  const perkContainer = document.querySelector('.perk-container');
  if (perkContainer) {
    const kids = Array.from(perkContainer.querySelectorAll('.perk-title, .perk-subtitle, .perk-animation-row, .perk-cta'));
    if (kids.length) {
      revealGroup(kids, { threshold: 0.15, baseDelay: 0, stagger: 180 });
    } else {
      revealGroup([perkContainer], { threshold: 0.15, baseDelay: 0 });
    }
  }

  // Final CTA block (stagger rows)
  const finalCta = document.querySelector('.final-cta .container');
  if (finalCta) {
    const rows = Array.from(finalCta.querySelectorAll('h2, p, .app-store-badge'));
    if (rows.length) {
      revealGroup(rows, { threshold: 0.2, baseDelay: 150, stagger: 180 });
    } else {
      revealGroup([finalCta], { threshold: 0.2, baseDelay: 150 });
    }
  }

  // FAQ items
  revealGroup(Array.from(document.querySelectorAll('.faq-item')), { threshold: 0.15, baseDelay: 0, stagger: 50 });
})();

// Typewriter effect for hero title (home only)
(() => {
  if (document.body.classList.contains('pro-page')) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const title = document.querySelector('.hero-copy h1');
  const highlight = title?.querySelector('.hero-title-highlight');
  const subtitle = document.querySelector('.hero-copy .hero-subtitle');
  const heroVisual = document.querySelector('.hero-visual');
  const heroDownload = document.querySelector('.hero-download');
  const langPicker = document.querySelector('.lang-picker');
  const ctaRow = document.querySelector('.cta-row');
  if (!title || !highlight || !subtitle) return;

  let fullHighlight = '';
  let restText = '';

  if (prefersReducedMotion) {
    subtitle.classList.add('typing-visible');
    heroVisual?.classList.add('typing-visible');
    heroDownload?.classList.add('typing-visible');
    return;
  }

  let notesTimer = null;
  const musPaths = Array.from({ length: 34 }, (_, i) => `assets/music_symbols_chalk/mus_${String(i + 1).padStart(2, '0')}.png`);
  let firstNote = true;
  let lastNote = null;

  const startNotes = () => {
    if (!ctaRow || notesTimer !== null) return;
    const emit = () => {
      let src;
      if (firstNote) {
        const firstChoices = ['assets/music_symbols_chalk/mus_09.png', 'assets/music_symbols_chalk/mus_21.png'];
        src = firstChoices[Math.floor(Math.random() * firstChoices.length)];
        firstNote = false;
      } else {
        do {
          src = musPaths[Math.floor(Math.random() * musPaths.length)];
        } while (src === lastNote);
      }
      lastNote = src;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
        const height = 40 + Math.random() * 20; // max 60px
        const width = height / aspect;
        const el = document.createElement('img');
        el.className = 'note-plume';
        el.src = src;
        el.style.setProperty('--note-rot', `${6 + Math.random() * 10}deg`);
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.animationDuration = `${6 + Math.random() * 3}s`;
        // Position at top-right of the download button
        const ctaRect = ctaRow.getBoundingClientRect();
        const btnRect = heroDownload.getBoundingClientRect();
        const x = btnRect.right - ctaRect.left;
        const y = btnRect.top - ctaRect.top;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transformOrigin = 'center';
        ctaRow.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      };
    };
    // initial delay ~3s after start, then every 4s
    setTimeout(() => {
      emit();
      notesTimer = setInterval(emit, 4000);
    }, 1000);
    return;
  }

  // Build structure: highlight span, rest span, cursor
  const restSpan = document.createElement('span');
  restSpan.className = 'hero-title-rest';
  restSpan.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  cursor.textContent = '|';

  highlight.textContent = '';
  title.innerHTML = '';
  title.appendChild(highlight);
  title.appendChild(restSpan);
  title.appendChild(cursor);

  subtitle.classList.remove('typing-visible');
  subtitle.classList.add('typing-hidden');
  if (heroVisual) {
    heroVisual.classList.remove('typing-visible');
    heroVisual.classList.add('typing-hidden');
  }
  if (heroDownload) {
    heroDownload.classList.remove('typing-visible');
    heroDownload.classList.add('typing-hidden');
  }
  if (langPicker) {
    langPicker.classList.remove('typing-visible');
    langPicker.classList.add('typing-hidden');
  }

  const typeText = (el, text, delay = 65) =>
    new Promise((resolve) => {
      let idx = 0;
      const step = () => {
        if (idx <= text.length) {
          el.textContent = text.slice(0, idx);
          idx += 1;
          setTimeout(step, delay);
        } else {
          resolve();
        }
      };
      step();
    });

  const blinkCursor = (times = 2, interval = 180) =>
    new Promise((resolve) => {
      let count = 0;
      cursor.style.visibility = 'visible'; // ensure consistent start state
      const tick = () => {
        cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
        count += 1;
        if (count >= times * 2) {
          cursor.style.visibility = 'visible';
          resolve();
          return;
        }
        setTimeout(tick, interval);
      };
      setTimeout(tick, interval);
    });

  const typingNoteSprites = ['mus_17', 'mus_08', 'mus_12', 'mus_32', 'mus_33'];

  const emitTypingNote = () => {
    if (!cursor) return;
    const img = new Image();
    const sprite =
      typingNoteSprites[Math.floor(Math.random() * typingNoteSprites.length)];
    img.src = `assets/music_symbols_chalk/${sprite}.png`;
    img.onload = () => {
      const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
      const height = 72; // base height for the typing note
      const width = height / aspect;
      const el = document.createElement('img');
      el.className = 'note-plume typing-note';
      el.src = img.src;
      el.style.setProperty('--note-rot', `${6 + Math.random() * 10}deg`);
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.animationDuration = `1.5s`;
      el.style.opacity = '1';
      const rect = cursor.getBoundingClientRect();
      el.style.position = 'fixed';
      el.style.left = `${rect.left + rect.width / 2 - 20}px`;
      el.style.top = `${rect.top + 50}px`;
      el.style.transformOrigin = 'center';
      el.style.transform = 'scale(0.9)';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };
  };

  const run = async () => {
    await typeText(highlight, fullHighlight, 65);
    emitTypingNote();
    await new Promise((r) => setTimeout(r, 600)); // start note 0.4s sooner relative to resume
    // Fade out any active typing-note immediately before resuming sentence two
    document.querySelectorAll('.note-plume.typing-note').forEach((el) => {
      // Let the drift continue; overlay a smooth fade to 0 over 1s
      el.style.transition = 'opacity 1s linear';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 1100);
    });
    await typeText(restSpan, restText, 55);
    await blinkCursor(2, 180);
    cursor.remove();
    // After typing completes, reveal subtitle then hero visual staggered
    setTimeout(() => {
      requestAnimationFrame(() => {
        subtitle.classList.remove('typing-hidden');
        subtitle.classList.add('typing-visible');
        if (heroVisual) {
          setTimeout(() => {
            heroVisual.classList.remove('typing-hidden');
            heroVisual.classList.add('typing-visible');
          }, 300);
        }
        if (heroDownload) {
          setTimeout(() => {
            heroDownload.classList.remove('typing-hidden');
            heroDownload.classList.add('typing-visible');
            if (langPicker) {
              langPicker.classList.remove('typing-hidden');
              langPicker.classList.add('typing-visible');
            }
            startNotes();
          }, 600);
        }
      });
    }, 600);
  };

  const startTyping = () => {
    requestAnimationFrame(run);
  };

  // Wait for background image to load before starting typing animation
  const bg = new Image();
  let typingStarted = false;
  const startTypingOnce = async () => {
    if (typingStarted) return;
    typingStarted = true;
    try {
      const strings = await i18n.ready;
      // Pull translated strings directly to avoid stale pre-i18n content
      const hi = strings?.['hero.titleHighlight'] || 'Your Music.';
      const rest = strings?.['hero.titleRest'] || ' Wherever you listen.';
      fullHighlight = hi;
      // Preserve the leading space before the second sentence
      restText = rest.startsWith(' ') ? rest : ` ${rest}`;
    } catch (e) {
      // ignore i18n failures; fall back to defaults
      fullHighlight = 'Your Music.';
      restText = ' Wherever you listen.';
    }
    startTyping();
  };

  bg.onload = startTypingOnce;
  bg.onerror = startTypingOnce; // fail-safe: still start typing if load fails
  bg.src = 'assets/backgrounds/background.jpg';
  if (bg.complete) startTypingOnce();
})();
