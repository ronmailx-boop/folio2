// Folio1 – JS קטן לאתר הציבורי: תפריט מובייל, lightbox לגלריה, שליחת טופס ב-fetch.
// האתר עובד גם בלי JS (קישורים רגילים ו-POST רגיל).
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // תמונה מקושרת ממאגר חיצוני שלא נטענה (נמחקה במקור, תקלה ברשת): מציגים במקומה איור דמו ניטרלי
  document.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG' || img.dataset.fallback || !/^https:\/\/images\./.test(img.src)) return;
      img.dataset.fallback = '1';
      img.src = '/demo/about.svg';
    },
    true,
  );

  // ---------- תפריט המבורגר ----------
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ---------- Lightbox ----------
  const grids = document.querySelectorAll('[data-lightbox]');
  if (grids.length && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'תצוגה מוגדלת');
    const inner = document.createElement('div');
    inner.className = 'lightbox-inner';
    const img = document.createElement('img');
    img.alt = '';
    const cap = document.createElement('p');
    cap.className = 'lightbox-caption';
    cap.setAttribute('aria-live', 'polite');
    const mk = (cls, label, text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.setAttribute('aria-label', label);
      b.textContent = text;
      return b;
    };
    const close = mk('lb-close', 'סגירה', '×');
    // ב-RTL "הקודם" בצד ימין: החץ מצביע ימינה
    const prev = mk('lb-prev', 'התמונה הקודמת', '›');
    const next = mk('lb-next', 'התמונה הבאה', '‹');
    inner.append(img, cap, close, prev, next);
    dlg.append(inner);
    document.body.append(dlg);

    let items = [];
    let index = 0;
    let opener = null;
    const show = (i) => {
      index = (i + items.length) % items.length;
      const a = items[index];
      const thumb = a.querySelector('img');
      img.src = a.href;
      img.alt = thumb ? thumb.alt : '';
      cap.textContent = a.dataset.caption || (thumb ? thumb.alt : '');
      prev.hidden = next.hidden = items.length < 2;
    };
    grids.forEach((grid) => {
      const links = [...grid.querySelectorAll('a.gallery-link')];
      links.forEach((a, i) =>
        a.addEventListener('click', (e) => {
          e.preventDefault();
          items = links;
          opener = a;
          show(i);
          dlg.showModal();
          close.focus();
        }),
      );
    });
    close.addEventListener('click', () => dlg.close());
    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target === inner) dlg.close();
    });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(index - 1);
      if (e.key === 'ArrowLeft') show(index + 1);
    });
    dlg.addEventListener('close', () => {
      img.removeAttribute('src');
      if (opener) opener.focus();
    });
    // החלקה במובייל
    let startX = null;
    dlg.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
    dlg.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx > 0 ? index + 1 : index - 1);
      startX = null;
    });
  }

  // ---------- טופס צור קשר ----------
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const success = document.querySelector('[data-form-success]');
    const formError = form.querySelector('[data-form-error]');
    const btn = form.querySelector('button[type="submit"]');

    const setError = (name, msg) => {
      const p = form.querySelector(`[data-error-for="${name}"]`);
      const input = form.elements[name];
      if (!p || !input) return;
      p.textContent = msg || '';
      p.hidden = !msg;
      input.closest('.field').classList.toggle('has-error', !!msg);
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', p.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    };

    const validate = (d) => {
      const errors = {};
      if (!d.name.trim()) errors.name = 'נא למלא שם.';
      if (!d.body.trim()) errors.body = 'נא לכתוב הודעה.';
      if (!d.phone.trim() && !d.email.trim()) errors.phone = 'נא למלא טלפון או מייל, כדי שנוכל לחזור אליך.';
      if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errors.email = 'כתובת המייל לא תקינה.';
      if (d.phone.trim() && d.phone.replace(/\D/g, '').length < 9) errors.phone = 'מספר הטלפון קצר מדי.';
      return errors;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(['name', 'phone', 'email', 'body', 'website'].map((k) => [k, String(fd.get(k) || '')]));
      const ts = fd.get('cf-turnstile-response');
      if (ts) data.turnstile = String(ts);
      const errors = validate(data);
      ['name', 'phone', 'email', 'body'].forEach((k) => setError(k, errors[k]));
      formError.hidden = true;
      const firstBad = Object.keys(errors)[0];
      if (firstBad) {
        form.elements[firstBad].focus();
        return;
      }
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = 'שולח...';
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
          return;
        }
        if (out.errors) Object.entries(out.errors).forEach(([k, v]) => setError(k, v));
        formError.textContent = out.error || 'לא הצלחנו לשלוח את ההודעה. נסו שוב בעוד רגע.';
        formError.hidden = false;
        if (window.turnstile) window.turnstile.reset();
      } catch {
        formError.textContent = 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.';
        formError.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }
})();
