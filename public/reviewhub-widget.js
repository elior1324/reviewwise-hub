(function () {
  "use strict";

  var container = document.getElementById("reviewhub-widget");
  if (!container) return;

  var slug = container.getAttribute("data-slug");
  if (!slug) return;

  var API_URL =
    "https://nrtyavfilrmnflikyzed.supabase.co/functions/v1/widget-data?slug=" +
    encodeURIComponent(slug);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", API_URL, true);
  xhr.onload = function () {
    if (xhr.status !== 200) return;

    try {
      var data = JSON.parse(xhr.responseText);
      render(container, data);
    } catch (e) {
      // silent fail
    }
  };
  xhr.send();

  function render(el, data) {
    var rating = parseFloat(data.rating) || 0;
    var count = data.review_count || 0;
    var url = data.profile_url || "#";

    var stars = "";
    for (var i = 0; i < 5; i++) {
      var filled = i < Math.round(rating);
      stars +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="' +
        (filled ? "#f59e0b" : "none") +
        '" stroke="' +
        (filled ? "#f59e0b" : "#d1d5db") +
        '" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    el.innerHTML =
      '<a href="' +
      url +
      '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;text-decoration:none;color:#111;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;transition:box-shadow .2s" onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.1)\'" onmouseout="this.style.boxShadow=\'none\'">' +
      '<img src="https://nrtyavfilrmnflikyzed.supabase.co/storage/v1/object/public/testimonials/reviewhub-logo-widget.png" alt="ReviewHub" style="width:32px;height:32px;border-radius:8px;object-fit:cover" />' +
      '<div style="display:flex;flex-direction:column;gap:2px">' +
      '<div style="display:flex;align-items:center;gap:4px"><span style="font-weight:700;font-size:14px">' +
      rating.toFixed(1) +
      "</span>" +
      stars +
      "</div>" +
      '<span style="font-size:11px;color:#6b7280" dir="rtl">' +
      count +
      " ביקורות מאומתות</span>" +
      '<span style="font-size:10px;color:#9ca3af">מופעל ע״י ReviewHub ✓</span>' +
      "</div></a>";
  }
})();
