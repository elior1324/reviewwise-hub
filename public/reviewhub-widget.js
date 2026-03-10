/**
 * ReviewWise Trust Badge — Embeddable Widget Script v2.0
 *
 * Usage — place anywhere in your HTML:
 *
 *   <!-- Compact (footer / navbar) -->
 *   <div class="reviewhub-widget" data-slug="your-slug" data-size="compact"></div>
 *
 *   <!-- Standard (sidebar / landing page) — DEFAULT -->
 *   <div class="reviewhub-widget" data-slug="your-slug" data-size="standard"></div>
 *
 *   <!-- Expanded (hero / marketing blocks) -->
 *   <div class="reviewhub-widget" data-slug="your-slug" data-size="expanded"></div>
 *
 *   <script src="https://reviewhub.co.il/reviewhub-widget.js" async></script>
 *
 * Multiple badges on the same page are fully supported.
 * Anti-fake: invalid slugs render nothing. Verified status checked live.
 */
(function (global) {
  "use strict";

  /* ── Config ──────────────────────────────────────────────────────────── */
  var BASE     = "https://reviewhub.co.il";
  var API      = "https://nrtyavfilrmnflikyzed.supabase.co/functions/v1/widget-data";
  var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydHlhdmZpbHJtbmZsaWt5emVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNjQxMTEsImV4cCI6MjA1MzY0MDExMX0.QfJAOCt5_pSFFeMBvD2XOaLhMHDSAkIMXl-UBpKNNIA";

  /* ── Design tokens (dark theme, mirrors platform palette) ─────────────── */
  var C = {
    bg:        "#0d0d0d",
    card:      "#0f1410",
    border:    "rgba(34,120,88,0.28)",
    sep:       "rgba(255,255,255,0.07)",
    text:      "#f5f5f5",
    muted:     "rgba(255,255,255,0.38)",
    teal:      "#4ecb8d",
    tealDark:  "#2a7a58",
    tealBg:    "rgba(34,100,70,0.4)",
    gold:      "#f8a521",
    shadow:    "0 4px 28px rgba(0,0,0,0.55),inset 0 1px 0 rgba(78,203,141,0.07)",
    font:      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"
  };

  /* ── Micro utilities ─────────────────────────────────────────────────── */

  function fmt(n) {
    try { return Number(n).toLocaleString("he-IL"); }
    catch(e) { return String(n); }
  }

  function starsSVG(rating, sz) {
    sz = sz || 14;
    var html = '<span style="display:inline-flex;align-items:center;gap:1px;">';
    for (var i = 0; i < 5; i++) {
      var pct = rating >= i + 1 ? 100 : rating >= i + 0.5 ? 50 : 0;
      var id  = "rw" + i + Math.random().toString(36).slice(2,6);
      html += '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none">';
      html += '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(255,255,255,0.12)"/>';
      if (pct > 0) {
        html += '<defs><clipPath id="' + id + '"><rect x="0" y="0" width="' + pct + '%" height="100%"/></clipPath></defs>';
        html += '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="' + C.gold + '" clip-path="url(#' + id + ')"/>';
      }
      html += '</svg>';
    }
    return html + '</span>';
  }

  function shieldSVG(sz) {
    sz = sz || 22;
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 32 32" fill="none">' +
      '<rect width="32" height="32" rx="8" fill="' + C.tealDark + '"/>' +
      '<path d="M16 5L7 9v7c0 5 4 9.7 9 11 5-1.3 9-6 9-11V9L16 5z" fill="rgba(120,220,180,0.22)" stroke="rgba(140,230,190,0.8)" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M16 10.5l1.25 2.6 2.75.4-2 2 .47 2.8L16 17.1l-2.47 1.2.47-2.8-2-2 2.75-.4L16 10.5z" fill="' + C.gold + '"/>' +
      '</svg>';
  }

  function divV(h) { /* vertical separator */
    return '<div style="width:1px;height:' + (h||24) + 'px;background:' + C.sep + ';flex-shrink:0;"></div>';
  }
  function divH() { /* horizontal separator */
    return '<div style="height:1px;background:' + C.sep + ';"></div>';
  }
  function hover(el, on, off) { el.onmouseover=function(){this.style.cssText+=on;}; el.onmouseout=function(){this.style.cssText+=off;}; }

  /* ── Skeleton (loading state) ────────────────────────────────────────── */

  function skeleton(el) {
    el.innerHTML =
      '<div style="display:inline-flex;align-items:center;gap:10px;padding:9px 14px;' +
      'border-radius:12px;background:' + C.bg + ';border:1px solid ' + C.border + ';' +
      'min-width:220px;animation:rw-pulse 1.4s ease infinite;">' +
        '<div style="width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.06);"></div>' +
        '<div style="display:flex;flex-direction:column;gap:5px;">' +
          '<div style="width:80px;height:10px;border-radius:4px;background:rgba(255,255,255,0.07);"></div>' +
          '<div style="width:52px;height:8px;border-radius:4px;background:rgba(255,255,255,0.04);"></div>' +
        '</div>' +
      '</div>';
  }

  /* ── Badge renderers ─────────────────────────────────────────────────── */

  /* 1. COMPACT — single row, ~260×48 px */
  function renderCompact(el, d) {
    var a = document.createElement("a");
    a.href   = BASE + "/biz/" + d.slug;
    a.target = "_blank";
    a.rel    = "noopener noreferrer";
    a.style.cssText =
      "display:inline-flex;align-items:center;gap:10px;padding:8px 14px;" +
      "border-radius:12px;background:linear-gradient(135deg," + C.bg + "," + C.card + ");" +
      "border:1px solid " + C.border + ";box-shadow:" + C.shadow + ";" +
      "text-decoration:none;color:inherit;font-family:" + C.font + ";" +
      "min-width:220px;max-width:300px;transition:transform 0.2s ease;";
    a.onmouseover = function(){ this.style.transform = "scale(1.02)"; };
    a.onmouseout  = function(){ this.style.transform = "scale(1)"; };
    a.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:' + C.tealBg + ';border:1px solid rgba(78,203,141,0.25);flex-shrink:0;">' + shieldSVG(16) + '</div>' +
      divV(24) +
      '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
        '<span style="font-size:15px;font-weight:700;color:' + C.text + ';font-variant-numeric:tabular-nums;">' + d.rating.toFixed(1) + '</span>' +
        starsSVG(d.rating, 13) +
      '</div>' +
      divV(24) +
      '<div style="display:flex;flex-direction:column;line-height:1.25;">' +
        '<span style="font-size:10px;font-weight:600;color:' + C.teal + ';letter-spacing:0.04em;">Verified Reviews</span>' +
        '<span style="font-size:9px;color:' + C.muted + ';">' + fmt(d.review_count) + ' ביקורות</span>' +
      '</div>';
    el.innerHTML = "";
    el.appendChild(a);
  }

  /* 2. STANDARD — card ~280×110 px */
  function renderStandard(el, d) {
    var href = BASE + "/biz/" + d.slug;
    el.innerHTML =
      '<div style="display:inline-flex;flex-direction:column;width:100%;max-width:290px;' +
      'border-radius:16px;overflow:hidden;font-family:' + C.font + ';' +
      'background:linear-gradient(160deg,' + C.bg + ',' + C.card + ');' +
      'border:1px solid ' + C.border + ';box-shadow:' + C.shadow + ';">' +

        /* header */
        '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid ' + C.sep + ';">' +
          shieldSVG(22) +
          '<div style="display:flex;flex-direction:column;line-height:1.2;">' +
            '<span style="font-size:13px;font-weight:700;color:' + C.text + ';letter-spacing:-0.01em;">ReviewWise</span>' +
            '<span style="font-size:10px;font-weight:500;color:' + C.teal + ';">✓ Verified Reviews</span>' +
          '</div>' +
        '</div>' +

        /* rating */
        '<div style="display:flex;flex-direction:column;gap:5px;padding:14px 16px;">' +
          '<div style="display:flex;align-items:flex-end;gap:8px;">' +
            '<span style="font-size:34px;font-weight:700;color:' + C.text + ';line-height:1;font-variant-numeric:tabular-nums;">' + d.rating.toFixed(1) + '</span>' +
            '<div style="display:flex;flex-direction:column;gap:3px;padding-bottom:2px;">' +
              starsSVG(d.rating, 16) +
              '<span style="font-size:10px;font-weight:600;color:' + C.teal + ';letter-spacing:0.06em;">מצוין</span>' +
            '</div>' +
          '</div>' +
          '<span style="font-size:11px;color:' + C.muted + ';">מבוסס על ' + fmt(d.review_count) + ' ביקורות מאומתות</span>' +
        '</div>' +

        /* cta */
        '<a href="' + href + '" target="_blank" rel="noopener noreferrer" ' +
           'style="display:flex;align-items:center;justify-content:space-between;' +
                  'padding:10px 16px;border-top:1px solid ' + C.sep + ';' +
                  'text-decoration:none;color:' + C.teal + ';font-size:11px;font-weight:600;transition:background 0.15s;" ' +
           'onmouseover="this.style.background=\'rgba(34,120,80,0.2)\'" ' +
           'onmouseout="this.style.background=\'transparent\'">' +
          'כל הביקורות ←' +
        '</a>' +
      '</div>';
  }

  /* 3. EXPANDED — full marketing widget ~340×auto */
  function renderExpanded(el, d) {
    var href    = BASE + "/biz/" + d.slug;
    var barPct  = Math.round((d.rating / 5) * 100);
    var snippet = "";

    if (d.featured_review) {
      var r    = d.featured_review;
      var name = r.is_anonymous ? "אנונימי" : (r.reviewer_name || "לקוח");
      var text = String(r.content || "").slice(0, 145);
      snippet =
        '<div style="border-top:1px solid ' + C.sep + ';padding-top:12px;">' +
          '<div style="display:flex;flex-direction:column;gap:7px;padding:12px;margin:0 16px 4px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              '<span style="font-size:20px;color:' + C.tealDark + ';opacity:0.8;line-height:1;">❝</span>' +
              starsSVG(r.rating || 5, 12) +
            '</div>' +
            '<p style="font-size:12px;color:rgba(255,255,255,0.72);line-height:1.55;margin:0;">' + text + (text.length >= 145 ? "…" : "") + '</p>' +
            '<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:' + C.muted + ';">' +
              '<span style="font-weight:600;color:rgba(255,255,255,0.55);">' + name + '</span>' +
              (r.is_verified_purchase ? '<span style="color:' + C.teal + ';">· ✓ מאומת</span>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
    }

    el.innerHTML =
      '<div style="display:inline-flex;flex-direction:column;width:100%;max-width:340px;' +
      'border-radius:18px;overflow:hidden;font-family:' + C.font + ';' +
      'background:linear-gradient(175deg,' + C.bg + ',' + C.card + ');' +
      'border:1px solid ' + C.border + ';box-shadow:' + C.shadow + ';">' +

        /* brand header */
        '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid ' + C.sep + ';">' +
          shieldSVG(26) +
          '<div style="display:flex;flex-direction:column;line-height:1.2;">' +
            '<span style="font-size:14px;font-weight:700;color:' + C.text + ';letter-spacing:-0.01em;">ReviewWise</span>' +
            '<span style="font-size:10px;font-weight:500;color:' + C.teal + ';">✓ ביקורות מאומתות</span>' +
          '</div>' +
          /* score pill */
          '<div style="margin-right:auto;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;background:rgba(34,100,70,0.5);border:1px solid rgba(78,203,141,0.25);">' +
            '<span style="font-size:12px;font-weight:700;color:' + C.teal + ';">' + d.rating.toFixed(1) + '</span>' +
            '<span style="font-size:10px;color:' + C.tealDark + ';">/ 5</span>' +
          '</div>' +
        '</div>' +

        /* rating + bar */
        '<div style="display:flex;flex-direction:column;gap:10px;padding:14px 16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            starsSVG(d.rating, 18) +
            '<span style="font-size:11px;font-weight:600;color:' + C.teal + ';letter-spacing:0.05em;">מצוין</span>' +
          '</div>' +
          '<div style="width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;">' +
            '<div style="height:100%;width:' + barPct + '%;border-radius:99px;background:linear-gradient(90deg,' + C.tealDark + ',' + C.teal + ');"></div>' +
          '</div>' +
          '<span style="font-size:10px;color:' + C.muted + ';">' + fmt(d.review_count) + ' ביקורות מאומתות · עודכן בזמן אמת</span>' +
        '</div>' +

        snippet +

        /* cta */
        '<a href="' + href + '" target="_blank" rel="noopener noreferrer" ' +
           'style="display:flex;align-items:center;justify-content:center;gap:8px;' +
                  'padding:10px 16px;margin:12px 16px 16px;border-radius:12px;' +
                  'border:1px solid rgba(78,203,141,0.35);background:rgba(34,100,70,0.3);' +
                  'text-decoration:none;color:' + C.teal + ';font-size:12px;font-weight:600;transition:background 0.15s;" ' +
           'onmouseover="this.style.background=\'rgba(34,100,70,0.5)\'" ' +
           'onmouseout="this.style.background=\'rgba(34,100,70,0.3)\'">' +
          'קראו ביקורות ב-ReviewWise ←' +
        '</a>' +
      '</div>';
  }

  /* ── Inject global pulse animation once ─────────────────────────────── */

  function injectStyles() {
    if (global.__rwStyled) return;
    global.__rwStyled = true;
    var s = document.createElement("style");
    s.textContent = "@keyframes rw-pulse{0%,100%{opacity:1}50%{opacity:.4}}";
    (document.head || document.documentElement).appendChild(s);
  }

  /* ── Core: init a single widget element ─────────────────────────────── */

  function initOne(el) {
    var slug = el.getAttribute("data-slug") || el.getAttribute("data-reviewhub");
    var size = (el.getAttribute("data-size") || "standard").toLowerCase();
    if (!slug) {
      el.innerHTML = '<span style="color:rgba(255,80,80,0.7);font-size:11px;font-family:sans-serif;">ReviewWise: missing data-slug</span>';
      return;
    }
    injectStyles();
    skeleton(el);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", API + "?slug=" + encodeURIComponent(slug) + "&include_review=1", true);
    xhr.setRequestHeader("apikey", ANON_KEY);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status !== 200) { el.innerHTML = ""; return; }  /* silent — anti-fake */
      try {
        var d = JSON.parse(xhr.responseText);
        if (d.error || !d.rating) { el.innerHTML = ""; return; } /* no verified data → hide */
        d.rating = parseFloat(d.rating) || 0;
        switch (size) {
          case "compact":  renderCompact(el, d);  break;
          case "expanded": renderExpanded(el, d); break;
          default:         renderStandard(el, d); break;
        }
      } catch(e) { el.innerHTML = ""; }
    };
    xhr.send();
  }

  /* ── Boot: find all widget containers ───────────────────────────────── */

  function init() {
    var els = document.querySelectorAll("#reviewhub-widget,.reviewhub-widget,[data-reviewhub]");
    for (var i = 0; i < els.length; i++) initOne(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Expose for manual re-init in SPAs */
  global.ReviewWiseWidget = { init: init, initOne: initOne };

}(window));
