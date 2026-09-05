/* OuOwOuO — frontend behaviour
   - Mobile drawer (hamburger)
   - Cmd/Ctrl+K search modal with keyboard navigation
   - Social link injection from server-provided config */
(function () {
  'use strict';

  /* ---------- Bootstrap data (rendered by Hono) ---------- */
  var DATA = { social: {}, index: [] };
  try {
    var el = document.getElementById('site-data');
    if (el) DATA = JSON.parse(el.textContent || '{}');
  } catch (_) { /* ignore */ }

  /* ---------- Social links ---------- */
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var key = a.getAttribute('data-social');
    if (DATA.social && DATA.social[key]) a.setAttribute('href', DATA.social[key]);
    if (key === 'email') { a.removeAttribute('target'); a.removeAttribute('rel'); }
  });

  /* ---------- Mobile menu ---------- */
  (function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.getElementById('mobile-menu');
    var backdrop = document.querySelector('[data-menu-backdrop]');
    if (!toggle || !menu || !backdrop) return;

    function open(state) {
      toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      toggle.setAttribute('aria-label', state ? '关闭菜单' : '打开菜单');
      menu.setAttribute('data-open', state ? 'true' : 'false');
      backdrop.setAttribute('data-open', state ? 'true' : 'false');
      document.documentElement.style.overflow = state ? 'hidden' : '';
      if (state) {
        var first = menu.querySelector('a');
        if (first) setTimeout(function () { first.focus(); }, 120);
      }
    }

    toggle.addEventListener('click', function () {
      open(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { open(false); });
    });
    backdrop.addEventListener('click', function () { open(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        open(false);
        toggle.focus();
      }
    });
    var mq = window.matchMedia('(min-width: 1025px)');
    var onChange = function () { if (mq.matches) open(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
  })();

  /* ---------- Search modal ---------- */
  (function () {
    var modal = document.getElementById('search-modal');
    var input = document.getElementById('search-input');
    var results = document.getElementById('search-results');
    var openBtn = document.querySelector('[data-search-open]');
    if (!modal || !input || !results || !openBtn) return;

    var INDEX = Array.isArray(DATA.index) ? DATA.index : [];
    var KIND_LABEL = { project: '项目', note: '笔记', lab: '实验', page: '页面' };
    var ORDER = ['project', 'note', 'lab', 'page'];
    var focusIdx = 0;

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function isOpen() { return modal.getAttribute('data-open') === 'true'; }

    function open(state) {
      modal.setAttribute('data-open', state ? 'true' : 'false');
      document.documentElement.style.overflow = state ? 'hidden' : '';
      if (state) {
        input.value = '';
        render('');
        setTimeout(function () { input.focus(); }, 60);
      }
    }

    function match(q, item) {
      if (!q) return true;
      var s = (item.title + ' ' + item.desc + ' ' + (KIND_LABEL[item.kind] || '')).toLowerCase();
      return s.indexOf(q.toLowerCase()) !== -1;
    }

    function render(q) {
      var list = INDEX.filter(function (i) { return match(q, i); });
      focusIdx = 0;
      if (!list.length) {
        results.innerHTML = '<div class="search-empty">没有匹配的结果 — 试试 "项目" 或 "笔记"</div>';
        return;
      }
      var groups = {};
      list.forEach(function (i) { (groups[i.kind] = groups[i.kind] || []).push(i); });

      var html = '';
      var idx = 0;
      ORDER.forEach(function (k) {
        if (!groups[k]) return;
        html += '<div class="search-group">' + KIND_LABEL[k] + '</div>';
        groups[k].forEach(function (item) {
          html +=
            '<div class="search-item" role="option" data-idx="' + idx + '" data-href="' + escapeHTML(item.href) + '">' +
              '<div class="search-item-icon" aria-hidden="true">' + item.icon + '</div>' +
              '<div><div class="search-item-title">' + escapeHTML(item.title) + '</div>' +
              '<div class="search-item-desc">' + escapeHTML(item.desc) + '</div></div>' +
              '<span class="search-item-kind">' + KIND_LABEL[item.kind] + '</span>' +
            '</div>';
          idx++;
        });
      });
      results.innerHTML = html;
      updateFocus();
    }

    function updateFocus() {
      var items = results.querySelectorAll('.search-item');
      items.forEach(function (el, i) { el.setAttribute('data-focus', i === focusIdx ? 'true' : 'false'); });
      var cur = items[focusIdx];
      if (cur) cur.scrollIntoView({ block: 'nearest' });
    }

    function activate(idx) {
      var el = results.querySelectorAll('.search-item')[idx];
      if (!el) return;
      var href = el.getAttribute('data-href');
      open(false);
      setTimeout(function () { location.hash = href; }, 60);
    }

    openBtn.addEventListener('click', function () { open(true); });
    document.querySelectorAll('[data-search-close]').forEach(function (el) {
      el.addEventListener('click', function () { open(false); });
    });
    input.addEventListener('input', function (e) { render(e.target.value); });
    results.addEventListener('click', function (e) {
      var item = e.target.closest('.search-item');
      if (item) activate(parseInt(item.getAttribute('data-idx'), 10));
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open(!isOpen());
        return;
      }
      if (!isOpen()) return;
      var items;
      if (e.key === 'Escape') { e.preventDefault(); open(false); openBtn.focus(); }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        items = results.querySelectorAll('.search-item');
        if (items.length) { focusIdx = (focusIdx + 1) % items.length; updateFocus(); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items = results.querySelectorAll('.search-item');
        if (items.length) { focusIdx = (focusIdx - 1 + items.length) % items.length; updateFocus(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        activate(focusIdx);
      }
    });
  })();
})();
