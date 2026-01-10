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
  const trueMobile = isIOSWebKit || isIPadMacSafari;
  window.__trueMobile = trueMobile;
  if (trueMobile) {
    document.documentElement.classList.add('ios-fixed-bg');
  }
})();

// Estimate device refresh rate (best-effort; started once typing begins)
let estimatedRefreshHz = 60;
let refreshEstimatorStarted = false;
const startRefreshEstimator = () => {
  if (refreshEstimatorStarted) return;
  refreshEstimatorStarted = true;
  const sampleDuration = 220; // ms
  let frames = 0;
  let start = null;
  const tick = (ts) => {
    if (start === null) start = ts;
    frames += 1;
    const elapsed = ts - start;
    if (elapsed >= sampleDuration) {
      const hz = Math.round((frames - 1) / (elapsed / 1000));
      estimatedRefreshHz = Math.min(240, Math.max(30, hz || 60));
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

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
    'en-IE',
    'en-CA',
    'ga-IE',
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
      if (lower.includes('ie')) return 'en-IE';
      if (lower.includes('ca')) return 'en-CA';
      return 'en';
    }
    if (lower.startsWith('ga')) return 'en-IE';
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
  window.__currentLocale = currentLocale;
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
      'en-AU': { currency: 'AUD', value: '9.99', locale: 'en-AU', customSymbol: 'A$ ' },
      'en-GB': { currency: 'GBP', value: '6.99', locale: 'en-GB' },
      'en-IE': { currency: 'EUR', value: '7.99', locale: 'en-IE' },
      'en-CA': { currency: 'CAD', value: '9.99', locale: 'en-CA', customSymbol: 'CA$ ' },
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
      'zh-Hant': { currency: 'MOP', value: '58', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '58', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '220', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '58', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
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
      'en-AU': { currency: 'AUD', value: '49.99', locale: 'en-AU', customSymbol: 'A$ ' },
      'en-GB': { currency: 'GBP', value: '29.99', locale: 'en-GB' },
      'en-IE': { currency: 'EUR', value: '34.99', locale: 'en-IE' },
      'en-CA': { currency: 'CAD', value: '39.99', locale: 'en-CA', customSymbol: 'CA$ ' },
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
      'zh-Hant': { currency: 'MOP', value: '228', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '228', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '990', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '228', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
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
      'en-AU': { currency: 'AUD', value: '14.99', locale: 'en-AU', customSymbol: 'A$ ' },
      'en-GB': { currency: 'GBP', value: '9.99', locale: 'en-GB' },
      'en-IE': { currency: 'EUR', value: '9.99', locale: 'en-IE' },
      'en-CA': { currency: 'CAD', value: '12.99', locale: 'en-CA', customSymbol: 'CA$ ' },
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
      'zh-Hant': { currency: 'MOP', value: '88', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '88', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '320', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '88', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
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
      'en-AU': { currency: 'AUD', value: '59.99', locale: 'en-AU', customSymbol: 'A$ ' },
      'en-GB': { currency: 'GBP', value: '39.99', locale: 'en-GB' },
      'en-IE': { currency: 'EUR', value: '44.99', locale: 'en-IE' },
      'en-CA': { currency: 'CAD', value: '49.99', locale: 'en-CA', customSymbol: 'CA$ ' },
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
      'zh-Hant': { currency: 'MOP', value: '288', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '288', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '1290', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '288', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
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
      'en-AU': { currency: 'AUD', value: '99.99', locale: 'en-AU', customSymbol: 'A$ ' },
      'en-GB': { currency: 'GBP', value: '59.99', locale: 'en-GB' },
      'en-IE': { currency: 'EUR', value: '69.99', locale: 'en-IE' },
      'en-CA': { currency: 'CAD', value: '79.99', locale: 'en-CA', customSymbol: 'CA$ ' },
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
      'zh-Hant': { currency: 'MOP', value: '488', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
      'zh-Hant-HK': { currency: 'HKD', value: '488', locale: 'zh-HK', decimals: 0 },
      'zh-Hant-TW': { currency: 'TWD', value: '1990', locale: 'zh-TW', decimals: 0 },
      'zh-Hant-MO': { currency: 'MOP', value: '488', locale: 'zh-MO', decimals: 0, customSymbol: 'MOP$ ' },
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
    { code: 'en-CA', label: '🇨🇦 English (Canada)' },
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

  const computeCollapse = () => {
    const btnRect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const collapse = {
      tx: (btnRect.left + btnRect.width / 2) - (menuRect.left + menuRect.width / 2),
      ty: (btnRect.top + btnRect.height / 2) - (menuRect.top + menuRect.height / 2),
      sx: Math.max(0.08, btnRect.width / Math.max(1, menuRect.width)),
      sy: Math.max(0.08, btnRect.height / Math.max(1, menuRect.height))
    };
    return collapse;
  };

  const openMenu = () => {
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.style.display = 'block';
    menu.style.position = 'fixed';
    const placeMenu = () => {
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
    };

    placeMenu();
    const collapse = computeCollapse();
    menu.style.transition = 'none';
    menu.style.transform = `translate(${collapse.tx}px, ${collapse.ty}px) scale(${collapse.sx}, ${collapse.sy})`;
    menu.style.opacity = '0';
    void menu.getBoundingClientRect();
    menu.style.transition = 'transform 220ms ease, opacity 180ms ease';
    requestAnimationFrame(() => {
      placeMenu();
      menu.style.transform = 'translate(0, 0) scale(1)';
      menu.style.opacity = '1';
    });
    const onReposition = () => {
      if (!menu.classList.contains('open')) return;
      placeMenu();
    };
    window.addEventListener('scroll', onReposition, { passive: true });
    window.addEventListener('resize', onReposition);
    menu._onReposition = onReposition;
    document.addEventListener('click', handleOutside, { once: true });
  };

  const closeMenu = () => {
    btn.setAttribute('aria-expanded', 'false');
    const collapse = computeCollapse();
    menu.style.transition = 'transform 180ms ease, opacity 150ms ease';
    requestAnimationFrame(() => {
      menu.style.transform = `translate(${collapse.tx}px, ${collapse.ty}px) scale(${collapse.sx}, ${collapse.sy})`;
      menu.style.opacity = '0';
    });
    const onEnd = () => {
      menu.classList.remove('open');
      menu.style.display = 'none';
      menu.style.transform = 'translate(0, 0) scale(1)';
      menu.style.opacity = '0';
      if (menu._onReposition) {
        window.removeEventListener('scroll', menu._onReposition);
        window.removeEventListener('resize', menu._onReposition);
        menu._onReposition = null;
      }
    };
    menu.addEventListener('transitionend', onEnd, { once: true });
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
  const noteShadowHex = {
    mus_01: '#cb3fa1',
    mus_02: '#f6df18',
    mus_03: '#ee6f0a',
    mus_04: '#bb98fa',
    mus_05: '#bb98fa',
    mus_06: '#10bff6',
    mus_07: '#f76f07',
    mus_08: '#02d452',
    mus_09: '#fb5bca',
    mus_10: '#f7e315',
    mus_11: '#0fcc4f',
    mus_12: '#b997f7',
    mus_13: '#ef69c8',
    mus_14: '#fb7005',
    mus_15: '#f9dc15',
    mus_16: '#11bcf9',
    mus_17: '#b196f3',
    mus_18: '#15df54',
    mus_19: '#f7dc18',
    mus_20: '#f561c8',
    mus_21: '#fb5cc7',
    mus_22: '#fb5cc7',
    mus_23: '#fb5cc7',
    mus_24: '#06d454',
    mus_25: '#15bbea',
    mus_26: '#f2700a',
    mus_27: '#bb9beb',
    mus_28: '#f3dc21',
    mus_29: '#ee5ac7',
    mus_30: '#ea7c27',
    mus_31: '#10dc51',
    mus_32: '#b997fb',
    mus_33: '#10bdf9',
    mus_34: '#10dc51'
  };
  const showCometTail = false;
  let firstNote = true;
  let lastNote = null;
  let notesPaused = false;
  let notesSuspended = false;
  let refreshBannerShown = false;
  let debugSvg = null;
  let debugPaths = [];
  let debugPathKey = null;
  let cachedPaths = null;
  let cachedPathKey = null;
  const shadowCanvas = document.createElement('canvas');
  const shadowCtx = shadowCanvas.getContext('2d', { willReadFrequently: true });
  const isTrueMobileUser = window.__trueMobile === true;
  const screenshot3Map = {
    'en': 'assets/screenshots/screenshot3 - en.png',
    'ar': 'assets/screenshots/screenshot3 - ar.png',
    'de': 'assets/screenshots/screenshot3 - de.png',
    'es': 'assets/screenshots/screenshot3 - es.png',
    'fr': 'assets/screenshots/screenshot3 - fr.png',
    'hi': 'assets/screenshots/screenshot3 - hi.png',
    'id': 'assets/screenshots/screenshot3 - id.png',
    'it': 'assets/screenshots/screenshot3 - it.png',
    'ja': 'assets/screenshots/screenshot3 - ja.png',
    'ko': 'assets/screenshots/screenshot3 - ko.png',
    'nl': 'assets/screenshots/screenshot3 - nl.png',
    'pl': 'assets/screenshots/screenshot3 - pl.png',
    'pt-BR': 'assets/screenshots/screenshot3 - pt-BR.png',
    'sv': 'assets/screenshots/screenshot3 - sv.png',
    'th': 'assets/screenshots/screenshot3 - th.png',
    'tr': 'assets/screenshots/screenshot3 - tr.png',
    'zh-Hans': 'assets/screenshots/screenshot3 - zh-Hans.png',
    'zh-Hant': 'assets/screenshots/screenshot3 - zh-Hant.png'
  };

  const screenshot0Map = {
    'en': 'assets/screenshots/screenshot0 - en.png',
    'ar': 'assets/screenshots/screenshot0 - ar.png',
    'de': 'assets/screenshots/screenshot0 - de.png',
    'es': 'assets/screenshots/screenshot0 - es.png',
    'fr': 'assets/screenshots/screenshot0 - fr.png',
    'hi': 'assets/screenshots/screenshot0 - hi.png',
    'id': 'assets/screenshots/screenshot0 - id.png',
    'it': 'assets/screenshots/screenshot0 - it.png',
    'ja': 'assets/screenshots/screenshot0 - ja.png',
    'ko': 'assets/screenshots/screenshot0 - ko.png',
    'nl': 'assets/screenshots/screenshot0 - nl.png',
    'pl': 'assets/screenshots/screenshot0 - pl.png',
    'pt-BR': 'assets/screenshots/screenshot0 - pt-BR.png',
    'sv': 'assets/screenshots/screenshot0 - sv.png',
    'th': 'assets/screenshots/screenshot0 - th.png',
    'tr': 'assets/screenshots/screenshot0 - tr.png',
    'zh-Hans': 'assets/screenshots/screenshot0 - zh-Hans.png',
    'zh-Hant': 'assets/screenshots/screenshot0 - zh-Hant.png'
  };

  const screenshot1Map = {
    'en': 'assets/screenshots/screenshot1 - en.png',
    'ar': 'assets/screenshots/screenshot1 - ar.png',
    'de': 'assets/screenshots/screenshot1 - de.png',
    'es': 'assets/screenshots/screenshot1 - es.png',
    'fr': 'assets/screenshots/screenshot1 - fr.png',
    'hi': 'assets/screenshots/screenshot1 - hi.png',
    'id': 'assets/screenshots/screenshot1 - id.png',
    'it': 'assets/screenshots/screenshot1 - it.png',
    'ja': 'assets/screenshots/screenshot1 - ja.png',
    'ko': 'assets/screenshots/screenshot1 - ko.png',
    'nl': 'assets/screenshots/screenshot1 - nl.png',
    'pl': 'assets/screenshots/screenshot1 - pl.png',
    'pt-BR': 'assets/screenshots/screenshot1 - pt-BR.png',
    'sv': 'assets/screenshots/screenshot1 - sv.png',
    'th': 'assets/screenshots/screenshot1 - th.png',
    'tr': 'assets/screenshots/screenshot1 - tr.png',
    'zh-Hans': 'assets/screenshots/screenshot1 - zh-Hans.png',
    'zh-Hant': 'assets/screenshots/screenshot1 - zh-Hant.png'
  };

  const pickScreenshotForLocale = (map, locale) => {
    if (!locale) return map['en'];
    if (map[locale]) return map[locale];
    const base = locale.split('-')[0];
    if (base === 'pt') return map['pt-BR'] || map['en'];
    if (base === 'zh') {
      if (locale.toLowerCase().includes('hant')) return map['zh-Hant'] || map['en'];
      return map['zh-Hans'] || map['en'];
    }
    return map[base] || map['en'];
  };

  const applyLocalizedScreenshots = (locale) => {
    const src3 = pickScreenshotForLocale(screenshot3Map, locale);
    const src0 = pickScreenshotForLocale(screenshot0Map, locale);
    const src1 = pickScreenshotForLocale(screenshot1Map, locale);
    document.querySelectorAll('.hero-screenshot').forEach((img) => {
      img.src = src3;
    });
    const howCard4Img = document.querySelector('.how-cards article:nth-of-type(4) .how-card-clip img');
    if (howCard4Img) howCard4Img.src = src3;
    const howCard1Img = document.querySelector('.how-cards article:nth-of-type(1) .how-card-clip img');
    if (howCard1Img) howCard1Img.src = src0;
    const howCard2Img = document.querySelector('.how-cards article:nth-of-type(2) .how-card-clip img');
    if (howCard2Img) howCard2Img.src = src1;
  };

  const noteIdFromSrc = (src) => {
    if (!src) return null;
    const match = src.match(/mus_(\d{2})\.png(?:$|[?#])/);
    return match ? `mus_${match[1]}` : null;
  };

  const hexToRgb = (hex) => {
    if (!hex) return null;
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return null;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  };

  const buildShadowFilter = (color) => {
    const r = color?.r ?? 0;
    const g = color?.g ?? 0;
    const b = color?.b ?? 0;
    return `drop-shadow(0 8px 14px rgba(${r}, ${g}, ${b}, 0.26)) drop-shadow(0 4px 8px rgba(${r}, ${g}, ${b}, 0.32)) drop-shadow(0 2px 4px rgba(${r}, ${g}, ${b}, 0.22))`;
  };

  const buildTypingShadowFilter = (color) => {
    const r = color?.r ?? 0;
    const g = color?.g ?? 0;
    const b = color?.b ?? 0;
    // Color-matched shadow for the typing burst (slightly lighter opacity)
    return [
      `drop-shadow(0 12px 24px rgba(${r}, ${g}, ${b}, 0.14))`,
      `drop-shadow(0 6px 14px rgba(${r}, ${g}, ${b}, 0.16))`,
      `drop-shadow(0 2px 6px rgba(${r}, ${g}, ${b}, 0.12))`
    ].join(' ');
  };

  const getShadowColorFromMap = (src) => {
    const id = noteIdFromSrc(src);
    if (!id) return null;
    return hexToRgb(noteShadowHex[id]);
  };


  const startNotes = () => {
    if (!ctaRow || notesTimer !== null) return;
    const showRefreshBanner = () => {
      if (refreshBannerShown) return;
      const label = document.querySelector('.logo span');
      if (!label) return;
      refreshBannerShown = true;
      const original = label.textContent || 'Mixport';
      label.textContent = `${original} (${estimatedRefreshHz}Hz)`;
      setTimeout(() => {
        label.textContent = original;
      }, 1000);
    };
    let notesTimerType = null;
    const clearNotesTimer = () => {
      if (!notesTimer) return;
      if (notesTimerType === 'interval') {
        clearInterval(notesTimer);
      } else {
        clearTimeout(notesTimer);
      }
      notesTimer = null;
    };
    const pauseNotes = () => {
      notesPaused = true;
      clearNotesTimer();
    };
    const resumeNotes = () => {
      if (!notesPaused) return;
      notesPaused = false;
      if (notesTimer) return;
      emit();
      if (isMobileLayout()) {
        notesTimerType = 'interval';
        notesTimer = setInterval(() => {
          if (!notesPaused) emit();
        }, 4000);
      } else {
        scheduleDesktop();
      }
    };
    const getShadowColor = (img) => {
      const mapped = getShadowColorFromMap(img?.src);
      if (mapped) return mapped;
      try {
        const natW = img.naturalWidth || 32;
        const natH = img.naturalHeight || 32;
        // clamp canvas to keep cheap
        const w = Math.min(natW, 128);
        const h = Math.min(natH, 128);
        shadowCanvas.width = w;
        shadowCanvas.height = h;
        shadowCtx.clearRect(0, 0, w, h);
        shadowCtx.drawImage(img, 0, 0, w, h);

        // try center pixel first
        const cx = Math.floor(w / 2);
        const cy = Math.floor(h / 2);
        const center = shadowCtx.getImageData(cx, cy, 1, 1).data;
        if (center[3] > 10) {
          return { r: center[0], g: center[1], b: center[2] };
        }

        // fallback: search small cross around center for first opaque-ish pixel
        const offsets = [
          [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
          [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1], [1, -1], [-1, 1]
        ];
        for (const [ox, oy] of offsets) {
          const px = Math.min(w - 1, Math.max(0, cx + ox));
          const py = Math.min(h - 1, Math.max(0, cy + oy));
          const d = shadowCtx.getImageData(px, py, 1, 1).data;
          if (d[3] > 10) return { r: d[0], g: d[1], b: d[2] };
        }

        // final fallback: average all opaque pixels
        const data = shadowCtx.getImageData(0, 0, w, h).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a > 10) {
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            count++;
          }
        }
        if (count > 0) {
          return { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count) };
        }
        return { r: 0, g: 0, b: 0 };
      } catch (_) {
        return { r: 0, g: 0, b: 0 };
      }
    };
    const isMobileLayout = () => window.innerWidth <= 768;
    const emit = () => {
      if (notesPaused || notesSuspended) return;
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
        const isMobile = isMobileLayout(); // mobile large/small/tiny: keep legacy sizing/behavior
        let width, height;
        if (isMobile) {
          const natW = img.naturalWidth || 40;
          const natH = img.naturalHeight || 40;
          const cap = 60; // legacy mobile max
          if (natH >= natW) {
            height = cap;
            width = height / aspect;
          } else {
            width = cap;
            height = width * aspect;
          }
        } else {
          const natW = img.naturalWidth || 40;
          const natH = img.naturalHeight || 40;
          if (natH >= natW) {
            height = 40;
            width = height / aspect;
          } else {
            width = 40;
            height = width * aspect;
          }
        }
        const el = document.createElement('img');
        el.className = 'note-plume';
        el.src = src;
        el.style.setProperty('--note-rot', `${6 + Math.random() * 10}deg`);
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.willChange = 'transform, opacity';
        const shadowColor = getShadowColor(img);
        el.style.filter = buildShadowFilter(shadowColor);
        // comet tail disabled/removed
        // Position at top-right of the download button
        const ctaRect = ctaRow.getBoundingClientRect();
        const btnRect = heroDownload.getBoundingClientRect();
        const x = btnRect.right - ctaRect.left;
        const y = btnRect.top - ctaRect.top;
        el.style.transformOrigin = 'center';
        el.style.zIndex = '30';
        if (isMobile) {
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          el.style.animationDuration = `${6 + Math.random() * 3}s`;
          ctaRow.appendChild(el);
          el.addEventListener('animationend', () => el.remove(), { once: true });
          return;
        }

        // Desktop/tablet: custom Bezier path targeting the subtitle gap (cached per layout)
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.animation = 'none';
        const subtitleRect = subtitle?.getBoundingClientRect();
        const visualRect = heroVisual?.getBoundingClientRect();
        const start = { x, y };
        const mid = subtitleRect
          ? {
              x: subtitleRect.right - ctaRect.left,
              y: subtitleRect.bottom - ctaRect.top
            }
          : { x: x + 60, y: y - 40 };

        // Extend the vector beyond mid toward an elevated top-right endpoint
        const dx = mid.x - start.x;
        const dy = mid.y - start.y;
        // extend toward top-right and lift well into banner space
        const end = {
          x: mid.x + dx * 1.7,
          y: Math.min(mid.y - Math.max(340, Math.abs(dy) * 0.9), -260)
        };

        // Control points: stay low off the button, bulge near subtitle SE corner, then kick up ~50°
        const c1 = {
          x: start.x + dx * 0.4,
          y: start.y + Math.max(120, Math.abs(dy) * 0.25)
        };
        const c2 = {
          x: mid.x - 40,
          y: mid.y - Math.max(200, Math.abs(dy) * 0.6)
        };

        const pathKey = `${ctaRect.width}x${ctaRect.height}`;
        const baseBezier = { start, c1, c2, end, color: 'rgba(255, 0, 0, 1)' };
        if (!cachedPaths || cachedPathKey !== pathKey) {
          const diverge = (dyC1, dyC2, dyEnd, color, dx = 0, extraEndX = 0) => ({
            start,
            c1: { x: c1.x + 12 + dx, y: c1.y + dyC1 },
            c2: { x: c2.x + 18 + dx, y: c2.y + dyC2 },
            end: { x: end.x + 10 + extraEndX, y: end.y + dyEnd },
            color
          });
          const orange = diverge(-60, -140, -160, 'rgba(255, 136, 0, 1)');
          const yellow = diverge(-20, -60, -90, 'rgba(255, 214, 0, 1)');
          const green = diverge(40, 30, 20, 'rgba(0, 200, 70, 1)', -8, -20);
          const blue = diverge(80, 90, 120, 'rgba(30, 120, 255, 1)', -12, -30);
          cachedPaths = [baseBezier, orange, yellow, green, blue];
          cachedPathKey = pathKey;
        }
        const chosen = cachedPaths[Math.floor(Math.random() * cachedPaths.length)] || baseBezier;
        const { start: p0, c1: p1, c2: p2, end: p3 } = chosen;

        const dur = 4200; // ms
        const rot = 4 + Math.random() * 6;
        const rotStart = isMobile ? -20 : -40;
        const rotEnd = 45;
        const lerp = (a, b, t) => a + (b - a) * t;
        const cubic = (p0, p1, p2, p3, t) => {
          const u = 1 - t;
          return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
        };

        let startTs = null;
      const tick = (ts) => {
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / dur);
          const xPos = cubic(p0.x, p1.x, p2.x, p3.x, t);
          const yPos = cubic(p0.y, p1.y, p2.y, p3.y, t);
          let opacity = 0.85;
          if (t < 0.15) opacity = lerp(0, 0.85, t / 0.15);
          else if (t > 0.82) opacity = lerp(0.85, 0.08, (t - 0.82) / 0.18);
          const scale = 0.9 + t * 0.3;
          const rotNow = rotStart + (rotEnd - rotStart) * t;
          el.style.transform = `translate(${xPos}px, ${yPos}px) scale(${scale}) rotate(${rotNow}deg)`;
          el.style.opacity = `${opacity}`;
          // comet tail disabled/removed
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            el.remove();
          }
        };
        // initialize visible at start
        el.style.opacity = '0';
        el.style.transform = `translate(${start.x}px, ${start.y}px) scale(0.9) rotate(${rotStart}deg)`;
        ctaRow.appendChild(el);

        requestAnimationFrame(tick);
      };
    };
    // initial delay ~1s after start, then desktop/tablet uses per-spawn random delay (1–5s), mobile stays fixed
    const scheduleDesktop = () => {
      if (notesPaused || notesSuspended) {
        notesTimer = null;
        return;
      }
      const delay = 1000 + Math.random() * 4000; // 1–5s
      notesTimerType = 'timeout';
      notesTimer = setTimeout(() => {
        emit();
        scheduleDesktop();
      }, delay);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        notesSuspended = true;
        clearNotesTimer();
        cachedPathKey = null;
        cachedPaths = null;
      } else {
        if (!notesSuspended) return;
        notesSuspended = false;
        // Restart scheduling fresh; avoid backlogged emits
        if (notesTimer) clearNotesTimer();
        setTimeout(() => {
          emit();
          if (isMobileLayout()) {
            notesTimerType = 'interval';
            notesTimer = setInterval(() => {
              if (!notesPaused && !notesSuspended) emit();
            }, 4000);
          } else {
            scheduleDesktop();
          }
        }, 300);
      }
    };

    setTimeout(() => {
      showRefreshBanner();
      emit();
      if (isMobileLayout()) {
        notesTimerType = 'interval';
        notesTimer = setInterval(() => {
          if (!notesPaused && !notesSuspended) emit();
        }, 4000);
      } else {
        scheduleDesktop();
      }
      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('blur', handleVisibility);
      window.addEventListener('focus', handleVisibility);
    }, 1000);

    // Observe scroll targets to pause/resume spawn
    const howHeading = document.querySelector('#how-it-works h2');
    const perksLead = document.querySelector('.perks-row p[data-i18n=\"perks.transfer.body\"]');
    let lastScrollY = window.scrollY || 0;
    let scrollDir = 'down';
    window.addEventListener('scroll', () => {
      const y = window.scrollY || 0;
      const delta = y - lastScrollY;
      if (delta > 2) scrollDir = 'down';
      else if (delta < -2) scrollDir = 'up';
      lastScrollY = y;
    }, { passive: true });

    if (howHeading) {
      const pauseObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && scrollDir === 'down') {
              pauseNotes();
            }
          });
        },
        { rootMargin: '-10% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
      );
      pauseObserver.observe(howHeading);
    }

    const resumeAnchor = document.querySelector('[data-i18n="transfer.title"]');
    if (resumeAnchor) {
      let lastResumeCheck = 0;
      const resumeObserver = new IntersectionObserver(
        (entries) => {
          const now = performance.now();
          if (now - lastResumeCheck < 320) return;
          lastResumeCheck = now;
          entries.forEach((entry) => {
            if (entry.isIntersecting && scrollDir === 'up') {
              resumeNotes();
            }
          });
        },
        { rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.4, 0.8] }
      );
      resumeObserver.observe(resumeAnchor);
    }
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
  const typingNoteCache = new Map();
  const showTypingBurst = true;

  const preloadTypingSprites = () => {
    if (typingNoteCache.size) return;
    typingNoteSprites.forEach((id) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = `assets/music_symbols_chalk/${id}.png`;
      img.onload = () => {
        const aspect =
          img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
        typingNoteCache.set(id, { aspect });
      };
      img.onerror = () => {
        // leave uncached on failure; fallback path will load on demand
      };
    });
  };

  const emitTypingNote = () => {
    if (!showTypingBurst) return;
    if (!cursor) return;
    const sprite =
      typingNoteSprites[Math.floor(Math.random() * typingNoteSprites.length)];
    const cached = typingNoteCache.get(sprite);
    const spawn = (aspect) => {
      const height = 72; // base height for the typing note
      const width = height / (aspect || 1);
      const el = document.createElement('img');
      el.className = 'note-plume typing-note';
      el.src = `assets/music_symbols_chalk/${sprite}.png`;
      el.style.setProperty('--note-rot', `${6 + Math.random() * 10}deg`);
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.animationDuration = `1.5s`;
      el.style.opacity = '1';
      const shadowColor = getShadowColorFromMap(
        sprite ? `assets/music_symbols_chalk/${sprite}.png` : null
      );
      el.style.setProperty('--typing-shadow', buildTypingShadowFilter(shadowColor));
      const rect = cursor.getBoundingClientRect();
      el.style.position = 'fixed';
      el.style.left = `${rect.left + rect.width / 2 - 20}px`;
      el.style.top = `${rect.top + 50}px`;
      el.style.transformOrigin = 'center';
      el.style.transform = 'scale(0.9)';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    if (cached && cached.aspect) {
      spawn(cached.aspect);
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.src = `assets/music_symbols_chalk/${sprite}.png`;
    img.onload = () => {
      const aspect =
        img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
      typingNoteCache.set(sprite, { aspect });
      spawn(aspect);
    };
    img.onerror = () => {
      spawn(1);
    };
  };

  const run = async () => {
    await typeText(highlight, fullHighlight, 65);
    emitTypingNote();
    await new Promise((r) => setTimeout(r, 1500)); // start note 0.4s sooner relative to resume
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
    startRefreshEstimator();
    preloadTypingSprites();
    applyLocalizedScreenshots(window.__currentLocale || 'en');
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
