/* =====================================================================
   Hannemanns Eck — Interaktivität
   Sticky-Nav · Scroll-Reveal · Parallax · Lightbox · Menü-Filter · Formulare
   Vanilla JS, keine Abhängigkeiten → schnelle Ladezeiten, offline lauffähig.
   ===================================================================== */
(function () {
  'use strict';
  document.documentElement.className += ' js';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =================================================================
     FORMSPREE-ANBINDUNG (E-Mail-Empfang der Formulare)
     -----------------------------------------------------------------
     1. Kostenloses Konto auf https://formspree.io anlegen.
     2. Neues Formular erstellen -> du erhältst eine Endpoint-URL der
        Form: https://formspree.io/f/ABCD1234
     3. Diese URL unten bei FORMSPREE_ENDPOINT eintragen. Fertig.
     Solange hier 'YOUR_FORM_ID' steht, läuft die Seite im Demo-Modus:
     Die Bestätigung wird angezeigt, aber es wird nichts versendet.
     ================================================================= */
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

  function isFormspreeConfigured() {
    return /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(FORMSPREE_ENDPOINT) &&
      FORMSPREE_ENDPOINT.indexOf('YOUR_FORM_ID') === -1;
  }

  /* Sendet ein Formular an Formspree. box = Statusfeld,
     successHtml = optionaler Bestätigungstext (sonst Originaltext). */
  function submitForm(form, data, box, successHtml, dateInput) {
    if (box && box.getAttribute('data-orig') === null) {
      box.setAttribute('data-orig', box.innerHTML);
    }
    function resetForm() {
      form.reset();
      if (dateInput) dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }
    function showSuccess() {
      if (!box) return;
      if (successHtml) box.innerHTML = successHtml;
      else if (box.getAttribute('data-orig')) box.innerHTML = box.getAttribute('data-orig');
      box.classList.remove('error');
      box.classList.add('show');
      box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }
    function showError() {
      if (!box) return;
      box.innerHTML = '<strong>Das hat leider nicht geklappt.</strong> Bitte versuchen Sie es erneut oder rufen Sie uns an: <a href="tel:+497824659916">+49 7824 659916</a>.';
      box.classList.add('error');
      box.classList.add('show');
    }
    if (!isFormspreeConfigured()) { showSuccess(); resetForm(); return; }
    var btn = form.querySelector('[type="submit"]');
    var label = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = 'Senden …'; }
    fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
      .then(function (res) { if (res.ok) { showSuccess(); resetForm(); } else { showError(); } })
      .catch(function () { showError(); })
      .finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = label; } });
  }

  /* ---------- Jahr im Footer ---------- */
  function setYear() {
    var els = document.querySelectorAll('[data-year]');
    var y = new Date().getFullYear();
    els.forEach(function (el) { el.textContent = y; });
  }

  /* ---------- Sticky-Navigation ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var toggle = nav.querySelector('.nav__toggle');
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add('nav--scrolled');
      else nav.classList.remove('nav--scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      nav.querySelectorAll('.nav__links a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }
  }

  /* ---------- Scroll-Reveal (IntersectionObserver) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); el.classList.add('reveal-done'); });
      return;
    }
    // Nach dem Vorhang-Reveal wird clip-path entfernt, damit Schatten/Overflow frei sind.
    function markDone(el) { el.classList.add('reveal-done'); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        var finish = function (ev) {
          if (ev && ev.propertyName && ev.propertyName !== 'clip-path') return;
          el.removeEventListener('transitionend', finish);
          markDone(el);
        };
        el.addEventListener('transitionend', finish);
        setTimeout(function () { markDone(el); }, 2600); // Fallback
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Parallax (dezent, rAF-gedrosselt) ---------- */
  function initParallax() {
    if (reduceMotion) return;
    var layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var rect = layer.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var speed = parseFloat(layer.getAttribute('data-parallax')) || 0.15;
        var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        layer.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.12)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Animierte Zahlen (Stats) ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1400, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target % 1 === 0 ? Math.floor(eased * target) : (eased * target).toFixed(1);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        if (reduceMotion) { el.textContent = target + suffix; }
        else requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Menü-Filter ---------- */
  function initMenuFilter() {
    var bar = document.querySelector('.menu-filter');
    if (!bar) return;
    var cats = document.querySelectorAll('.menu-cat');
    bar.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        bar.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-filter');
        cats.forEach(function (cat) {
          var show = (f === 'all' || cat.getAttribute('data-cat') === f);
          cat.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Lightbox-Galerie ---------- */
  function initLightbox() {
    var figures = Array.prototype.slice.call(document.querySelectorAll('.gallery figure'));
    var box = document.querySelector('.lightbox');
    if (!figures.length || !box) return;
    var imgEl = box.querySelector('img');
    var current = 0;
    var sources = figures.map(function (f) {
      var im = f.querySelector('img');
      return { src: im.getAttribute('src'), alt: im.getAttribute('alt') || '' };
    });
    function show(i) {
      current = (i + sources.length) % sources.length;
      imgEl.setAttribute('src', sources[current].src);
      imgEl.setAttribute('alt', sources[current].alt);
    }
    function open(i) { show(i); box.classList.add('open'); box.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
    function close() { box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    figures.forEach(function (f, i) {
      f.setAttribute('tabindex', '0');
      f.setAttribute('role', 'button');
      f.addEventListener('click', function () { open(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__nav.prev').addEventListener('click', function () { show(current - 1); });
    box.querySelector('.lightbox__nav.next').addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Reservierung: Min-Datum + Versand ---------- */
  function initReservation() {
    var form = document.getElementById('reservation-form');
    if (!form) return;
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput) {
      var today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var box = document.getElementById('reservation-success');
      var when = new Date(data.get('date') + 'T' + (data.get('time') || '19:00'));
      var fmt = when.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      var successHtml = '<strong>Vielen Dank, ' + escapeHtml(data.get('name')) + '!</strong><br>' +
        'Ihre Reservierungsanfrage für <strong>' + escapeHtml(String(data.get('guests'))) + ' Personen</strong> am <strong>' +
        fmt + '</strong> um <strong>' + escapeHtml(String(data.get('time'))) + ' Uhr</strong> ist eingegangen. ' +
        'Wir bestätigen Ihren Tisch in Kürze telefonisch oder per E-Mail.';
      data.append('_subject', 'Neue Reservierungsanfrage – Hannemanns Eck');
      submitForm(form, data, box, successHtml, dateInput);
    });
  }

  /* ---------- Generische Formulare (Kontakt / Newsletter) ---------- */
  function initSimpleForms() {
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var box = document.getElementById(form.getAttribute('data-confirm'));
        var data = new FormData(form);
        data.append('_subject', 'Neue Nachricht über die Website – Hannemanns Eck');
        submitForm(form, data, box, null, null);
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setYear();
    initNav();
    initReveal();
    initParallax();
    initCounters();
    initMenuFilter();
    initLightbox();
    initReservation();
    initSimpleForms();
  });
})();


/* =====================================================================
   Cookie-Consent + Google Analytics (Consent Mode v2, DSGVO-konform)
   ---------------------------------------------------------------------
   Google Analytics wird NUR nach ausdrücklicher Einwilligung geladen.
   Mess-ID unten bei GA_MEASUREMENT_ID eintragen (z. B. G-AB12CD34EF).
   Solange dort 'G-XXXXXXXXXX' steht, läuft alles im Demo-Modus:
   Der Banner erscheint, es wird aber kein Tracking geladen.
   ===================================================================== */
(function () {
  'use strict';
  var GA_MEASUREMENT_ID = 'G-CNHDCC3THQ'; // Google-Analytics Mess-ID
  var CONSENT_KEY = 'he_cookie_consent';
  var gaLoaded = false;

  function gaConfigured() {
    return /^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID.indexOf('X') === -1;
  }
  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Consent Mode v2 – standardmäßig alles abgelehnt, bis der Nutzer zustimmt.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });

  function loadGA() {
    if (gaLoaded || !gaConfigured()) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }
  function grant() { gtag('consent', 'update', { analytics_storage: 'granted' }); loadGA(); }
  function deny() { gtag('consent', 'update', { analytics_storage: 'denied' }); }

  function hide(b) {
    b.classList.remove('show');
    setTimeout(function () { if (b && b.parentNode) b.parentNode.removeChild(b); }, 320);
  }
  function buildBanner() {
    if (document.querySelector('.cookie-banner')) return;
    var b = document.createElement('div');
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.setAttribute('aria-label', 'Cookie-Hinweis');
    b.innerHTML =
      '<h3>Wir verwenden Cookies</h3>' +
      '<p>Wir nutzen technisch notwendige Cookies sowie – nur mit Ihrer Einwilligung – Google Analytics, ' +
      'um unsere Website zu verbessern. Mehr dazu in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="btn cookie-btn-decline" data-cookie-decline>Nur notwendige</button>' +
      '<button type="button" class="btn btn--gold" data-cookie-accept>Alle akzeptieren</button>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('show'); });
    b.querySelector('[data-cookie-accept]').addEventListener('click', function () { setConsent('granted'); grant(); hide(b); });
    b.querySelector('[data-cookie-decline]').addEventListener('click', function () { setConsent('denied'); deny(); hide(b); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (getConsent() === 'granted') grant();
    else if (getConsent() === null) buildBanner();
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); buildBanner(); });
    });
  });
})();
