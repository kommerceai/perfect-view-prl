/*
 * Perfect View PRL – public site config
 * Loaded globally as `window.PV_CONFIG` and used to populate
 * phone / email / tracking across the static site.
 *
 * To update the contact info or tracking IDs, edit this file only.
 */
(function () {
  // TODO: swap to local NC number (704 or 980) once CallRail provisions
  var PHONE_DISPLAY = '(747) 966-3950';
  var PHONE_TEL = '7479663950';
  var EMAIL = 'info@perfectviewprl.com';

  var PV_CONFIG = {
    PHONE_DISPLAY: PHONE_DISPLAY,
    PHONE_TEL: PHONE_TEL,
    EMAIL: EMAIL,

    // Tracking — fires only if ID set AND host is production domain.
    // Set these when you provision the pixels.
    GA_ID: '',              // e.g. "G-XXXXXXXXXX"
    META_PIXEL_ID: '',      // e.g. "1234567890123456"
    LINKEDIN_PARTNER_ID: '' // e.g. "1234567"
  };

  // Production-domain gate (equivalent to NODE_ENV === "production")
  PV_CONFIG.IS_PROD = /(^|\.)perfectviewprl\.com$/.test(location.hostname);

  window.PV_CONFIG = PV_CONFIG;

  function init() {
    // Replace text for display elements
    document.querySelectorAll('[data-pv-phone-display]').forEach(function (el) {
      // Preserve existing leading icon/entity if present (e.g. "✆ ")
      var prefix = el.getAttribute('data-pv-prefix') || '';
      el.textContent = prefix + PHONE_DISPLAY;
    });
    document.querySelectorAll('[data-pv-email-display]').forEach(function (el) {
      el.textContent = EMAIL;
    });

    // Update href attributes
    document.querySelectorAll('[data-pv-phone-tel]').forEach(function (el) {
      el.setAttribute('href', 'tel:' + PHONE_TEL);
    });
    document.querySelectorAll('[data-pv-email-mailto]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + EMAIL);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
