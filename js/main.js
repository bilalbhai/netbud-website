/* NetBud: shared, buildless website behaviour. No local data requests or imports. */
(function () {
  "use strict";

  var config = window.NETBUD_CONFIG || {};
  var products = Array.isArray(window.NETBUD_PRODUCTS) ? window.NETBUD_PRODUCTS : [];
  var base = document.body.dataset.base || "";

  function cleanUrl(value) { return value.replace(/\/index\.html(?=[?#]|$)/, '/').replace(/\.html(?=[?#]|$)/, '/'); }
  if (location.protocol !== 'file:' && /\.html$/.test(location.pathname) && !/\/404\.html$/.test(location.pathname)) location.replace(cleanUrl(location.href));
  function cleanLinks() {
    document.querySelectorAll('a[href]').forEach(function(a) { if(a.origin===location.origin && /\.html$/.test(a.pathname) && !/\/404\.html$/.test(a.pathname)) { var next=cleanUrl(a.href); if(next!==a.href)a.href=next; } });
  }
  new MutationObserver(cleanLinks).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
  cleanLinks();

  var cartKey = "netbud-quote-basket-v1";
  var cart = [];
  var storageAvailable = true;
  var filterState = { category: "All", search: "", sort: "featured", billing: "All", industry: "All" };
  var toastTimer;
  var formStatusCounter = 0;
  var fieldErrorCounter = 0;
  var refreshFloatingControls = function () {};

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function localPath(path) { return cleanUrl('/' + path.replace(/^\/+/, '')); }
  function safeHttps(url) { return typeof url === "string" && /^https:\/\/[^\s]+$/i.test(url) ? url : ""; }
  function safeSiteUrl() { return safeHttps(config.siteUrl || "").replace(/\/$/, ""); }
  function productById(id) { return products.find(function (product) { return product.id === Number(id); }); }
  function publicPrice(product) {
    if (!config.launchPricingApproved || !config.publicPricing || !product || product.price === null || product.price === "") return null;
    return typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0 ? product.price : null;
  }

  function formatCurrency(amount) {
    var value = Number(amount);
    if (!Number.isFinite(value) || value < 0) return "To be confirmed";
    try {
      return new Intl.NumberFormat(config.locale || "en-AU", {
        style: "currency", currency: config.currency || "AUD", currencyDisplay: "narrowSymbol",
        minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2
      }).format(value).replace(config.currency === "AUD" ? /^\$/ : /$^/, "A$");
    } catch (error) { return (config.currency || "AUD") + " " + value.toFixed(2); }
  }

  function currencyLabel(amount) {
    return formatCurrency(amount) + " " + (config.currency || "AUD");
  }

  var iconPaths = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M8 12l2-3 2 2 2-3"/>',
    workflow: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h5a4 4 0 0 1 4 4v5M6 9v5a4 4 0 0 0 4 4h5"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7c-1.4-.8-.8-3 1-3h2a4 4 0 0 0 4-4c0-4-4.2-7.3-9-7.3Z"/><path d="M7 10h.01M10 7h.01M15 7h.01M7 15h.01" stroke-width="2.8"/>',
    nfc: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9v6M11 8a6 6 0 0 1 0 8M14 7a8 8 0 0 1 0 10"/>',
    support: '<path d="M4 13v-1a8 8 0 0 1 16 0v1M4 12H3v6h4v-6H4Zm16 0h1v6h-4v-6h3ZM19 18c0 3-4 3-7 3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    phone: '<path d="m7 3 3 5-3 2c1.2 3 3 4.8 6 6l2-3 5 3-1 4C10 22 2 14 3 5l4-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18m-14 4h2m4 0h2"/>',
    heart: '<path d="M20.4 5.6a5 5 0 0 0-7.1 0L12 7l-1.3-1.4a5 5 0 0 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1Z"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    link: '<path d="m10 7 2-2a5 5 0 0 1 7 7l-2 2M14 17l-2 2a5 5 0 0 1-7-7l2-2m1 6 8-8"/>',
    bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    whatsapp: '<path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.5-4.7A9 9 0 1 1 21 11.5Z"/><path d="m8 7 2 3-1.2 1.1a8 8 0 0 0 4 4L14 14l3 2c-1 3-4 2-7-1S6 9 8 7Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01" stroke-width="3"/>',
    facebook: '<path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7h.01M11 17v-7m0 3c0-4 6-4 6 0v4"/>',
    location: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    external: '<path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6"/>'
  };

  function icon(name) {
    return '<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (iconPaths[name] || iconPaths.spark) + '</svg>';
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (element) { element.innerHTML = icon(element.dataset.icon); });
  }

  function whatsappUrl(message) {
    var number = String(config.whatsappNumber || "").replace(/\D/g, "");
    return /^\d{8,15}$/.test(number) ? "https://wa.me/" + number + "?text=" + encodeURIComponent(message || "Hi NetBud, I would like to discuss my business.") : "";
  }

  function notify(message) {
    var toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    clearTimeout(toastTimer);
    toast.hidden = false;
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); toast.hidden = true; }, 4200);
  }

  // Shared navigation and footer keep editable business details in config.js.
  function renderShell() {
    var page = document.body.dataset.page || "";
    var callbackHref = document.getElementById("callback") ? "#callback" : localPath("contact.html#callback");
    var links = [
      ["home", "index.html", "Home"], ["shop", "shop.html", "Shop"], ["portfolio", "portfolio.html", "Our Work"], ["about", "about.html", "About"], ["contact", "contact.html", "Contact"]
    ];
    var header = document.getElementById("site-header");
    if (header) {
      header.classList.add("site-header");
      header.innerHTML = '<div class="container header-inner"><a class="brand" href="' + localPath("index.html") + '" aria-label="NetBud home"><img src="' + localPath("images/logo.svg?v=20261028-b1") + '" width="160" height="44" alt="NetBud"></a>' +
        '<nav class="desktop-nav" id="primary-navigation" aria-label="Main navigation"><ul class="nav-links">' + links.map(function (link) {
          return '<li><a href="' + localPath(link[1]) + '"' + (page === link[0] ? ' aria-current="page"' : "") + '>' + link[2] + '</a></li>';
        }).join("") + '<li class="nav-mobile-callback"><a class="button button-primary" href="' + callbackHref + '">Request a Callback</a></li></ul></nav>' +
        '<div class="header-actions"><a class="cart-link" href="' + localPath("cart.html") + '" aria-label="Quote basket"><span>' + icon("bag") + '</span><span class="cart-badge" data-cart-count>0</span></a>' +
        '<a class="button button-primary header-callback" href="' + callbackHref + '">Request a Callback ' + icon("arrow") + '</a>' +
        '<button class="menu-toggle" type="button" aria-controls="primary-navigation" aria-expanded="false" aria-label="Open navigation">' + icon("menu") + '</button></div></div>';
      var toggle = header.querySelector(".menu-toggle");
      var navigation = header.querySelector(".desktop-nav");
      var pointerInteraction = false;
      function focusWithoutJump(element) {
        if (!element) return;
        try { element.focus({ preventScroll: true }); }
        catch (error) { element.focus(); }
      }
      // Touch browsers may blur a focused link before delivering the tapped link's click.
      // Keep the menu present through that sequence; link/outside clicks still dismiss it.
      ["pointerdown", "touchstart", "mousedown"].forEach(function (type) {
        document.addEventListener(type, function () { pointerInteraction = true; }, { capture: true, passive: true });
      });
      document.addEventListener("keydown", function () { pointerInteraction = false; }, true);
      function closeMenu(restoreFocus) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation");
        toggle.innerHTML = icon("menu");
        navigation.classList.remove("is-open");
        document.body.classList.remove("menu-open");
        document.dispatchEvent(new CustomEvent("netbud:menuchange"));
        if (restoreFocus) focusWithoutJump(toggle);
      }
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        toggle.innerHTML = icon(open ? "close" : "menu");
        navigation.classList.toggle("is-open", open);
        document.body.classList.toggle("menu-open", open);
        document.dispatchEvent(new CustomEvent("netbud:menuchange"));
        if (open) {
          var firstLink = navigation.querySelector("a");
          focusWithoutJump(firstLink);
        }
      });
      navigation.addEventListener("click", function (event) { if (event.target.closest("a")) closeMenu(false); });
      document.addEventListener("keydown", function (event) { if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu(true); });
      document.addEventListener("click", function (event) {
        pointerInteraction = false;
        // Replacing the toggle's SVG detaches the original click target. The event path
        // retains its original header ancestry, so an icon tap is never an outside click.
        var path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        var insideHeader = path.indexOf(header) !== -1 || header.contains(event.target);
        if (!insideHeader && toggle.getAttribute("aria-expanded") === "true") closeMenu(false);
      });
      // This is a nonmodal menu: leaving the header closes it without trapping focus.
      header.addEventListener("focusout", function (event) {
        if (toggle.getAttribute("aria-expanded") !== "true" || pointerInteraction) return;
        if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu(false);
        else if (!event.relatedTarget) setTimeout(function () {
          if (!header.contains(document.activeElement) && toggle.getAttribute("aria-expanded") === "true") closeMenu(false);
        }, 0);
      });
      window.addEventListener("resize", function () { if (window.innerWidth > 1000) closeMenu(false); });
    }
    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.classList.add("site-footer");
      var socials = ["instagram", "facebook", "linkedin"].map(function (name) {
        var title = name.charAt(0).toUpperCase() + name.slice(1);
        var url = safeHttps((config.socialLinks || {})[name]);
        return url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" aria-label="NetBud on ' + title + '">' + icon(name) + '</a>' : '<button type="button" data-social-placeholder="' + title + '" aria-label="' + title + ' profile — link coming soon" title="Profile link coming soon">' + icon(name) + '</button>';
      }).join("");
      var analyticsPreference = /^G-[A-Z0-9]+$/.test(config.googleAnalyticsId || "")
        ? '<button type="button" class="button-link footer-preferences" data-analytics-preferences>Analytics preferences</button>' : "";
      footer.innerHTML = '<div class="container"><div class="footer-grid"><div class="footer-brand"><a class="brand" href="' + localPath("index.html") + '"><img src="' + localPath("images/logo-dark.svg?v=20261028-b1") + '" width="172" height="48" alt="NetBud home"></a><p class="footer-tagline">' + escapeHtml(config.tagline) + '</p><p>Custom Websites · Branding · NFC · Digital Growth<br>Friendly support. One trusted mate.</p><div class="social-links">' + socials + '</div></div>' +
        '<div class="footer-links"><h2>What we do</h2><a href="' + localPath("services.html#websites") + '">Websites & online stores</a><a href="' + localPath("services.html#seo") + '">SEO & Google visibility</a><a href="' + localPath("services.html#systems") + '">Systems & automation</a><a href="' + localPath("services.html#support") + '">Hosting & support</a><a href="' + localPath("shop.html") + '">Explore all packages</a><a href="/services/#website-benefits">Custom-coded websites</a></div>' +
        '<div class="footer-links"><h2>Around here</h2><a href="' + localPath("about.html") + '">Meet NetBud</a><a href="' + localPath("portfolio.html") + '">Our work</a><a href="' + localPath("how-it-works.html") + '">How it works</a><a href="' + localPath("pricing.html") + '">Pricing</a><a href="' + localPath("free-preview.html") + '">Free homepage preview</a></div>' +
        '<div class="footer-links footer-contact"><h2>Let’s have a chat</h2><a data-contact-phone></a><a data-contact-email></a><p>' + escapeHtml(config.businessLocation) + '</p><p>Supporting Western Sydney,<br>Greater Sydney & businesses across Australia.</p><a class="footer-callback" href="' + callbackHref + '">Request a callback ' + icon("arrow") + '</a></div></div>' +
        '<div class="footer-bottom"><p>© <span data-current-year></span> ' + escapeHtml(config.agencyName || "NetBud") + '. All rights reserved.</p><div><a href="' + localPath("privacy.html") + '">Privacy Policy</a><a href="' + localPath("terms.html") + '">Website Terms</a>' + analyticsPreference + '</div><p>Made with care, in Sydney.</p></div></div>';
    }
    document.querySelectorAll("[data-current-year]").forEach(function (node) { node.textContent = new Date().getFullYear(); });
    document.querySelectorAll("[data-starting-price]").forEach(function (node) { node.textContent = publicPrice(productById(1)) !== null ? formatCurrency(productById(1).price) : "Request pricing"; });
    document.querySelectorAll("[data-contact-email]").forEach(function (node) {
      node.textContent = config.contactEmail || "Email details coming soon";
      if (config.contactEmail) node.href = "mailto:" + config.contactEmail;
    });
    document.querySelectorAll("[data-contact-phone]").forEach(function (node) {
      node.textContent = config.phoneDisplay || config.phoneNumber || "Phone details coming soon";
      if (config.phoneNumber) node.href = "tel:" + String(config.phoneNumber).replace(/[^+\d]/g, "");
    });
    if (!document.querySelector(".mobile-cta")) {
      var mobileCta = document.createElement("a");
      mobileCta.className = "mobile-cta";
      mobileCta.href = callbackHref;
      mobileCta.innerHTML = icon("phone") + '<span>Request a Callback</span>' + icon("arrow");
      document.body.appendChild(mobileCta);
    }
    var whatsApp = whatsappUrl();
    if (whatsApp && !document.querySelector(".whatsapp-float")) {
      var floatingLink = document.createElement("a");
      floatingLink.className = "whatsapp-float";
      floatingLink.href = whatsApp;
      floatingLink.target = "_blank";
      floatingLink.rel = "noopener noreferrer";
      floatingLink.setAttribute("aria-label", "Start a WhatsApp enquiry with NetBud");
      floatingLink.innerHTML = icon("whatsapp") + '<span>Let’s chat</span>';
      document.body.appendChild(floatingLink);
    }
  }

  function productHref(product) { return localPath('shop/' + product.slug + '.html'); }
  function priceMarkup(product) {
    var price = publicPrice(product);
    return '<span class="price-value">' + (price === null ? 'Get a quote' : 'From ' + escapeHtml(formatCurrency(price)) + (product.pricingType === 'monthly' ? '<small>/month</small>' : '')) + '</span><span class="price-detail">' + escapeHtml(product.billingLabel || (product.pricingType === 'monthly' ? 'Monthly' : 'One-time project')) + '</span>';
  }
  function productCard(product) {
    return '<article class="product-card"><a class="product-visual" href="' + productHref(product) + '" tabindex="-1" aria-hidden="true"><img class="product-image" src="' + localPath(product.imageSmall || product.image) + '"' + (product.imageSmall ? ' srcset="' + localPath(product.imageSmall) + ' 600w, ' + localPath(product.image) + ' ' + (product.imageWidth || 1200) + 'w" sizes="(max-width:760px) 92vw, (max-width:1050px) 46vw, 380px"' : '') + ' width="' + (product.imageWidth || 640) + '" height="' + (product.imageHeight || 460) + '" alt="' + escapeHtml(product.imageAlt || '') + '" loading="lazy" decoding="async">' + (product.imageCaption ? '<span class="product-image-caption">' + escapeHtml(product.imageCaption) + '</span>' : '') + (product.featured ? '<span class="product-badge">Featured</span>' : '') + '</a><div class="product-info"><p class="eyebrow product-category">' + escapeHtml(product.category) + '</p><h3><a href="' + productHref(product) + '">' + escapeHtml(product.name) + '</a></h3><p>' + escapeHtml(product.description) + '</p><div class="product-price">' + priceMarkup(product) + '</div><div class="product-actions"><a class="button button-outline" href="' + productHref(product) + '">View details</a><a class="button button-primary" href="' + productHref(product) + '#product-enquiry">' + (product.physical ? 'Order enquiry' : 'Get my quote') + '</a></div></div></article>';
  }
  function renderFeaturedProducts() {
    document.querySelectorAll('[data-featured-products]').forEach(function (container) {
      container.innerHTML = products.filter(function (p) { return p.featured && p.available !== false; }).slice(0, Number(container.dataset.limit) || 3).map(productCard).join('');
    });
    document.querySelectorAll('[data-launch-price]').forEach(function (node) { var p = productById(node.dataset.launchPrice); if (p) node.innerHTML = publicPrice(p) === null ? 'Request a tailored quote' : 'From ' + escapeHtml(formatCurrency(p.price)) + (p.pricingType === 'monthly' ? '/month' : ''); });
  }
  function filteredProducts() {
    return products.filter(function (p) {
      return (filterState.category === 'All' || p.category === filterState.category) &&
        (filterState.billing === 'All' || p.pricingType === filterState.billing) &&
        (filterState.industry === 'All' || (p.industries || []).indexOf(filterState.industry) !== -1) &&
        (p.name + ' ' + p.category + ' ' + p.description + ' ' + (p.features || []).join(' ')).toLowerCase().indexOf(filterState.search.toLowerCase()) !== -1;
    }).sort(function (a,b) {
      if (filterState.sort === 'name') return a.name.localeCompare(b.name);
      if (/price/.test(filterState.sort)) { var x=publicPrice(a),y=publicPrice(b); return x===null&&y===null ? a.name.localeCompare(b.name) : x===null ? 1 : y===null ? -1 : filterState.sort==='price-desc' ? y-x : x-y; }
      return Number(b.featured)-Number(a.featured) || a.catalogueNumber.localeCompare(b.catalogueNumber);
    });
  }
  function renderCatalogue() {
    var grid=document.querySelector('[data-product-grid]'); if (!grid) return;
    var result=filteredProducts();
    grid.innerHTML=result.length ? result.map(productCard).join('') : '<div class="empty-state"><h2>No matches yet.</h2><p>Try a broader search or reset your filters.</p><button class="button button-outline" type="button" data-reset-filters>Reset filters</button></div>';
    document.querySelector('[data-results-count]').textContent=result.length+' of '+products.length+' products and services';
    document.querySelectorAll('[data-category]').forEach(function (button) { var active=button.dataset.category===filterState.category;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active)); });
  }
  function setupCatalogue() {
    var params=new URLSearchParams(location.search), categories=['All'].concat(Array.from(new Set(products.map(function(p){return p.category;}))));
    if(categories.indexOf(params.get('category'))!==-1)filterState.category=params.get('category');
    var industry=params.get('industry');if(products.some(function(p){return(p.industries||[]).indexOf(industry)!==-1;}))filterState.industry=industry;
    [['product-search','search','input'],['category-filter','category','change'],['product-sort','sort','change'],['billing-filter','billing','change'],['industry-filter','industry','change']].forEach(function(item){var e=document.getElementById(item[0]);if(e){e.value=filterState[item[1]];e.addEventListener(item[2],function(){filterState[item[1]]=e.value.trim();renderCatalogue();});}});
    renderCatalogue();
  }

  function updateMeta(selector, value) {
    var element = document.querySelector(selector);
    if (!element) {
      var attribute = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
      if (attribute) { element = document.createElement('meta'); element.setAttribute(attribute[1], attribute[2]); document.head.appendChild(element); }
    }
    if (element) element.setAttribute("content", value);
  }

  function updateCanonical(url) {
    if (!safeHttps(url)) return;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = cleanUrl(url);
    updateMeta('meta[property="og:url"]', canonical.href);
  }

  function renderProductDetail() {
    var container=document.querySelector('[data-product-detail]');if(!container)return;
    var product=productById(document.body.dataset.productId || new URLSearchParams(location.search).get('id'));
    if(!product && ['8','9'].indexOf(new URLSearchParams(location.search).get('id'))!==-1){window.location.replace(localPath('contact.html?service='+encodeURIComponent(new URLSearchParams(location.search).get('id')==='8'?'Paid digital advertising':'Social content and paid advertising')+'#enquiry'));return;}
    if(!product){container.innerHTML='<div class="empty-state"><h1>Let’s find the right service.</h1><p>This package link is no longer available.</p><a class="button button-primary" href="'+localPath('shop.html')+'">Explore the shop</a></div>';document.title='Package not found | NetBud';return;}
    document.title=product.name+' | NetBud';updateMeta('meta[name="description"]',product.description);updateMeta('meta[property="og:title"]',document.title);updateMeta('meta[property="og:description"]',product.description);updateMeta('meta[name="twitter:title"]',document.title);updateMeta('meta[name="twitter:description"]',product.description);updateCanonical(safeSiteUrl()+'/shop/'+product.slug+'.html');
    function list(items){return '<ul class="feature-list">'+(items||[]).map(function(v){return '<li>'+escapeHtml(v)+'</li>';}).join('')+'</ul>';}
    function panel(title,items){return '<article class="card"><h2>'+title+'</h2>'+list(items)+'</article>';}
    var quote='Your final quote depends on your requirements, project size and any extra features. We’ll confirm the full price with you before starting.';
    var approach=product.websiteApproach ? '<section class="section website-approach"><p class="eyebrow">Made around your business</p><h2>'+escapeHtml(product.websiteApproach.title)+'</h2><p>'+escapeHtml(product.websiteApproach.intro)+'</p>'+list(product.websiteApproach.benefits)+'<p class="small muted">'+escapeHtml(product.websiteApproach.note)+'</p><a class="text-link" href="/services/#website-benefits">Explore the benefits of a custom-built website '+icon('arrow')+'</a></section>' : '';
    var fields='';
    if(product.physical)fields='<div class="field"><label for="product-quantity">Card quantity</label><input id="product-quantity" name="quantity" type="number" min="1" max="999" value="1"></div><div class="field"><label for="product-link">'+(product.id===10?'Google Business Profile / review link':'Website or contact-page link')+' (optional)</label><input id="product-link" name="destination" type="url" placeholder="https://" maxlength="500"></div>';
    if(product.id===5)fields+='<div class="field"><label for="product-title">Job title (optional)</label><input id="product-title" name="jobTitle" maxlength="100"></div><div class="field"><label for="product-social">Social links (optional)</label><input id="product-social" name="socialLinks" maxlength="500"></div>';
    if(product.id===4)fields+='<div class="field"><label for="product-industry">Industry (optional)</label><input id="product-industry" name="industry" maxlength="100"></div><div class="field"><label for="product-style">Brand personality / colours (optional)</label><input id="product-style" name="designPreferences" maxlength="300"></div>';
    var special=product.id===10?'<div class="tap-steps"><span>01 · Tap or scan</span><span>02 · Open your Google review page</span><span>03 · Customer chooses to leave a genuine review</span></div><p>No incentives, review gating or promised positive reviews. A Google Account is needed to leave a review. <a href="https://support.google.com/business/answer/3474122" target="_blank" rel="noopener">Google’s review guidance</a></p>':'';
    var preview=product.category==='Websites'?'<aside class="shop-preview"><p class="eyebrow">See a direction before committing</p><h2>Your next website. A first look, free.</h2><p>One limited homepage concept for eligible businesses after discovery. Target: three business days, subject to availability.</p><a class="button button-outline" href="'+localPath('free-preview.html')+'">Request my free preview</a></aside>':'';
    container.innerHTML='<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="'+localPath('shop.html')+'">Shop</a><span aria-hidden="true">/</span><span aria-current="page">'+escapeHtml(product.name)+'</span></nav><div class="product-detail-grid"><div class="product-detail-visual product-gallery"><img src="'+localPath(product.image)+'" width="'+(product.imageWidth||640)+'" height="'+(product.imageHeight||460)+'" decoding="async" fetchpriority="high" alt="'+escapeHtml(product.imageAlt||('Illustrative concept for '+product.name))+'"><button type="button" class="gallery-enlarge" data-view-image="'+localPath(product.image)+'" data-image-alt="'+escapeHtml(product.imageAlt||product.name)+'">View image <span aria-hidden="true">↗</span></button><p class="small muted">'+escapeHtml(product.imageCaption === '' ? '' : (product.imageCaption||'Illustrative product concept. Final scope and appearance are agreed in your quote.'))+'</p></div><div class="product-detail-info"><p class="eyebrow">'+escapeHtml(product.category)+'</p><h1>'+escapeHtml(product.name)+'</h1><p class="lead">'+escapeHtml(config.launchPricingApproved&&product.proposedOffer?product.proposedOffer:product.description)+'</p><div class="product-price">'+priceMarkup(product)+'</div><p>'+quote+'</p><div class="button-row"><a class="button button-primary" href="#product-enquiry">'+(product.physical?'Order enquiry':'Get my quote')+'</a><button class="button button-outline" type="button" data-add-product="'+product.id+'">Add to quote basket</button></div><p class="small muted">No payment is taken. '+escapeHtml(config.pricingNote)+'</p></div></div>'+approach+'<section class="product-scope"><p class="lead">'+escapeHtml(product.detail)+'</p>'+special+'<div class="shop-detail-panels">'+panel('Who it’s for',Array.isArray(product.audience)?product.audience:[product.audience])+panel('Starting package includes',product.inclusions)+panel('Not included in the entry package',product.exclusions)+panel('Options & upgrades',product.options)+panel('What happens next',product.process)+panel('What we need from you',product.requirements)+'</div><p class="notice">'+escapeHtml(product.note)+'</p></section>'+preview+'<section class="section"><h2>Good questions. Clear answers.</h2><div class="faq-list">'+(product.faqs||[]).map(function(f){return '<details><summary>'+escapeHtml(f.q)+'</summary><p>'+escapeHtml(f.a)+'</p></details>';}).join('')+'</div></section><section class="shop-enquiry" id="product-enquiry"><div><p class="eyebrow">One useful next step</p><h2>Let’s talk about '+escapeHtml(product.name)+'.</h2><p>Start with your name and email. We’ll agree the details, scope and final quote together.</p><p>Logo or artwork? Mention it below; we’ll arrange a suitable way to share files after you enquire.</p><p>We prepare a draft for you to review and send through your email or WhatsApp app.</p></div><form class="enquiry-form" method="post" data-enquiry-form="product" data-form-title="'+escapeHtml(product.name)+' enquiry"><div class="form-grid"><div class="field"><label for="product-name">Your name *</label><input id="product-name" name="name" autocomplete="name" required maxlength="100"></div><div class="field"><label for="product-email">Email *</label><input id="product-email" name="email" type="email" autocomplete="email" required maxlength="200"></div><div class="field"><label for="product-phone">Phone (optional)</label><input id="product-phone" name="phone" type="tel" autocomplete="tel" maxlength="30"></div><div class="field"><label for="product-business">Business / brand name (optional)</label><input id="product-business" name="business" autocomplete="organization" maxlength="120"></div><div class="field field-full"><label for="product-selected">Selected product</label><input id="product-selected" name="selectedProduct" value="'+escapeHtml(product.name)+'" readonly></div>'+fields+'<div class="field field-full"><label for="product-notes">What do you have in mind? (optional)</label><textarea id="product-notes" name="message" rows="3" maxlength="3000" placeholder="Preferences, style references or a quick description…"></textarea></div></div><div class="honeypot" aria-hidden="true"><label for="product-check">Leave empty</label><input id="product-check" name="website_confirm" tabindex="-1" autocomplete="off"></div><p class="small muted">Your details are used to respond to this enquiry. <a href="'+localPath('privacy.html')+'">Privacy information</a>.</p><button type="submit" class="button button-primary" disabled>Prepare my enquiry</button><div class="form-status" role="status" aria-live="polite"></div></form></section><section class="section related-products"><div class="section-heading"><div><p class="eyebrow">Useful together</p><h2>Build on your next step.</h2></div><a class="text-link" href="'+localPath('shop.html')+'">All products & services ↗</a></div><div class="grid-3">'+(product.relatedIds||[]).map(productById).filter(Boolean).slice(0,4).map(productCard).join('')+'</div></section>';
  }

  function renderPricing() { document.querySelectorAll('[data-pricing-note]').forEach(function(node){node.textContent=config.pricingNote;}); }

  function renderPortfolio() {
    document.querySelectorAll('[data-portfolio-grid]').forEach(function (container) {
      var entries = (config.portfolio || []).slice(0, Number(container.dataset.limit) || undefined);
      container.innerHTML = entries.map(function (project) {
        var external = Boolean(safeHttps(project.url));
        var href = external ? project.url : localPath(project.url || 'portfolio.html');
        var workReveal = project.title === 'PACES' && project.status === 'Authorised project' ? ' data-reveal="work"' : '';
        return '<article class="portfolio-card"' + workReveal + '><a class="portfolio-visual" href="' + escapeHtml(href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '><span class="portfolio-media"><img src="' + localPath(project.image) + '" width="720" height="510" alt="' + escapeHtml(project.imageAlt) + '" loading="lazy"></span><span class="portfolio-status">' + escapeHtml(project.status) + '</span></a><div class="portfolio-info"><p class="eyebrow">' + escapeHtml(project.industry) + '</p><h3>' + escapeHtml(project.title) + '</h3><p>' + escapeHtml(project.description) + '</p>' + (project.title === 'PACES' ? '<dl class="project-notes"><dt>The purpose</dt><dd>Help visitors understand disability support services and find a clear way to enquire.</dd><dt>The approach</dt><dd>Welcoming content, focused service pages and straightforward contact pathways.</dd></dl>' : '') + '<div class="project-tags">' + project.services.map(function (service) { return '<span class="pill">' + escapeHtml(service) + '</span>'; }).join('') + '</div><a class="text-link" href="' + escapeHtml(href) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + escapeHtml(project.linkLabel || 'View project') + ' ' + icon(external ? 'external' : 'arrow') + '</a></div></article>';
      }).join('');
    });
  }

  // Only product IDs and quantities are persisted. Enquiry details never enter storage.
  function sanitiseCart(value) {
    if (!Array.isArray(value)) return [];
    var combined = {};
    value.slice(0, 100).forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var product = productById(item.id);
      var quantity = Number(item.quantity);
      if (!product || product.available === false || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
      if (product.price !== null && (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0)) return;
      combined[product.id] = Math.min(99, (combined[product.id] || 0) + quantity);
    });
    return Object.keys(combined).map(function (id) { return { id: Number(id), quantity: combined[id] }; });
  }

  function loadCart() {
    var saved;
    try {
      saved = window.localStorage.getItem(cartKey);
      storageAvailable = true;
    } catch (error) { storageAvailable = false; cart = []; return; }
    // Invalid old data is different from a browser that blocks storage access.
    try { var previousCart=saved?JSON.parse(saved):[]; cart = sanitiseCart(previousCart); if(Array.isArray(previousCart)&&previousCart.some(function(item){return item&&(Number(item.id)===8||Number(item.id)===9);})) notify('Paid campaign packages now need a tailored enquiry. Please contact us to include them in your quote.'); }
    catch (error) { cart = []; }
  }

  function saveCart() {
    try { window.localStorage.setItem(cartKey, JSON.stringify(cart)); storageAvailable = true; }
    catch (error) { storageAvailable = false; }
    updateCartCount();
    renderCart();
  }

  function updateCartCount() {
    var count = cart.reduce(function (total, item) { return total + item.quantity; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (badge) { badge.textContent = String(count); });
    document.querySelectorAll('.cart-link').forEach(function (link) { link.setAttribute('aria-label', 'Quote basket, ' + count + (count === 1 ? ' item' : ' items')); });
  }

  function addToCart(id, quantity) {
    var product = productById(id);
    var amount = quantity === undefined ? 1 : Number(quantity);
    if (!product || product.available === false || !Number.isInteger(amount) || amount < 1 || amount > 99) return false;
    if (product.price !== null && (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0)) return false;
    var current = cart.find(function (item) { return item.id === product.id; });
    if (current) current.quantity = Math.min(99, current.quantity + amount);
    else cart.push({ id: product.id, quantity: amount });
    saveCart();
    notify(product.name + ' added to your quote basket.');
    return true;
  }

  function setQuantity(id, quantity) {
    var amount = Number(quantity);
    var item = cart.find(function (entry) { return entry.id === Number(id); });
    if (!item || !Number.isInteger(amount) || amount < 1 || amount > 99) return false;
    item.quantity = amount;
    saveCart();
    return true;
  }

  function removeFromCart(id) {
    cart = cart.filter(function (item) { return item.id !== Number(id); });
    saveCart();
  }

  function calculateTotals(items) {
    var totals = { oneTime: 0, monthly: 0, quoteOnly: 0, monthlyQuoteOnly: 0, startingAt: false, physical: false };
    sanitiseCart(items || cart).forEach(function (item) {
      var product = productById(item.id);
      var price = publicPrice(product);
      if (product.physical) totals.physical = true;
      if (price === null) {
        totals.quoteOnly += item.quantity;
        if (product.pricingType === 'monthly') totals.monthlyQuoteOnly += item.quantity;
      } else if (product.pricingType === 'monthly') totals.monthly += price * item.quantity;
      else totals.oneTime += price * item.quantity;
      if (product.startingAt && price !== null) totals.startingAt = true;
    });
    return totals;
  }

  function cartSummaryText() {
    var totals = calculateTotals();
    var lines = ['NETBUD QUOTE REQUEST', ''];
    cart.forEach(function (item) {
      var product = productById(item.id);
      var price = publicPrice(product);
      lines.push(product.name + ' × ' + item.quantity + ' — ' + (price === null ? (product.pricingType === 'monthly' ? 'Monthly fee to be quoted' : 'Price to be confirmed') : (product.startingAt ? 'From ' : '') + currencyLabel(price) + (product.pricingType === 'monthly' ? '/month' : ' each')));
    });
    lines.push('', (totals.startingAt ? 'Indicative one-time starting total: ' : 'One-time priced subtotal: ') + currencyLabel(totals.oneTime));
    lines.push('Recurring monthly fees: ' + (totals.monthly === 0 && totals.monthlyQuoteOnly ? 'To be quoted separately' : totals.monthly === 0 ? 'None selected' : currencyLabel(totals.monthly) + '/month' + (totals.monthlyQuoteOnly ? ' + services to be quoted' : '')));
    if (totals.quoteOnly) lines.push('Quote-only item quantities: ' + totals.quoteOnly + ' (excluded from priced subtotals).');
    if (totals.physical) lines.push('Physical item delivery charges and final quantities require confirmation.');
    lines.push('Final scope, total, payment schedule and any recurring terms require a written proposal. This is an enquiry, not a paid or accepted order.');
    return lines.join('\n');
  }

  function checkoutMarkup() {
    return '<section class="checkout-section checkout-form" data-checkout-section aria-labelledby="checkout-title"><div class="section-heading"><div><p class="eyebrow">One simple next step</p><h2 id="checkout-title">Tell us where to start.</h2><p>Review an enquiry draft, then choose how to contact us. Your basket does not commit you to a purchase.</p></div></div>' +
      '<form class="enquiry-form" method="post" data-enquiry-form="checkout" data-form-title="Quote basket enquiry"><div class="form-grid">' +
      '<div class="field"><label for="checkout-name">Full name <span aria-hidden="true">*</span></label><input id="checkout-name" name="name" autocomplete="name" required minlength="2" maxlength="100"></div>' +
      '<div class="field"><label for="checkout-business">Business name <span class="muted">(optional)</span></label><input id="checkout-business" name="business" autocomplete="organization" maxlength="150"></div>' +
      '<div class="field"><label for="checkout-email">Email address <span aria-hidden="true">*</span></label><input id="checkout-email" name="email" type="email" autocomplete="email" required maxlength="200"></div>' +
      '<div class="field"><label for="checkout-phone">Australian phone number <span class="muted">(optional)</span></label><input id="checkout-phone" name="phone" type="tel" autocomplete="tel" maxlength="25" placeholder="04xx xxx xxx"></div>' +
      '<div class="field field-full"><label for="checkout-billing">Billing address <span class="muted">(optional for digital services)</span></label><textarea id="checkout-billing" name="billingAddress" autocomplete="billing street-address" rows="2" maxlength="500"></textarea></div>' +
      '<div class="field field-full" data-delivery-field hidden><label for="checkout-delivery">Delivery suburb / postcode <span class="muted">(optional for the enquiry)</span></label><textarea id="checkout-delivery" name="deliveryAddress" autocomplete="shipping street-address" rows="3" maxlength="500"></textarea><p class="field-help">Delivery cost and address are confirmed before dispatch.</p></div>' +
      '<div class="field field-full"><label for="checkout-notes">Additional instructions <span class="muted">(optional)</span></label><textarea id="checkout-notes" name="message" rows="4" maxlength="3000" placeholder="Tell us a little about your business and what you need."></textarea></div>' +
      '<div class="field field-full"><label class="checkbox-label"><input type="checkbox" name="marketing" value="yes"><span>I’d also like occasional NetBud updates. <span class="muted">Optional; you can opt out.</span></span></label></div>' +
      '<div class="honeypot" aria-hidden="true"><label for="checkout-check">Leave this field empty</label><input id="checkout-check" name="website_confirm" tabindex="-1" autocomplete="off"></div>' +
      '</div><p class="small muted">Please don’t include health, disability or other sensitive personal information. Read our <a href="' + localPath('privacy.html') + '">draft Privacy Policy</a>.</p><button class="button button-primary" type="submit" disabled>Prepare quote enquiry ' + icon('arrow') + '</button><div class="form-status" role="status" aria-live="polite"></div></form></section>';
  }

  function renderCart() {
    var container = document.querySelector('[data-cart]');
    if (!container) return;
    var activeControl = container.contains(document.activeElement) ? document.activeElement : null;
    var focusSelector = null;
    ['data-increase', 'data-decrease', 'data-remove', 'data-quantity'].some(function (attribute) {
      if (activeControl && activeControl.hasAttribute(attribute)) { focusSelector = '[' + attribute + '="' + Number(activeControl.getAttribute(attribute)) + '"]'; return true; }
      return false;
    });
    if (!container.querySelector('[data-cart-items]')) {
      container.innerHTML = '<div data-cart-empty></div><div class="cart-layout" data-cart-layout><section aria-label="Selected packages"><div class="cart-items" data-cart-items></div><div class="cart-tools"><a class="text-link" href="' + localPath('shop.html') + '">' + icon('arrow') + ' Explore more packages</a><button type="button" class="text-link" data-empty-cart>Empty basket</button></div></section><aside class="cart-summary" data-cart-summary aria-label="Quote estimate"></aside></div><p class="small muted" data-cart-storage></p>' + checkoutMarkup();
      setupForms(container);
      refreshFloatingControls();
    }
    var empty = !cart.length;
    container.querySelector('[data-cart-layout]').hidden = empty;
    container.querySelector('[data-checkout-section]').hidden = empty;
    container.querySelector('[data-cart-empty]').innerHTML = empty ? '<div class="empty-state"><span class="icon-box">' + icon('bag') + '</span><h2>A fresh start for your digital side.</h2><p>Add a package to build a quote request. No payment or commitment is required.</p><a class="button button-primary" href="' + localPath('shop.html') + '">Explore packages ' + icon('arrow') + '</a></div>' : '';
    var storageNotice = container.querySelector('[data-cart-storage]');
    storageNotice.textContent = storageAvailable ? 'This browser stores package IDs and quantities only. Your contact details are not saved.' : 'This browser cannot save the basket. It will stay available for this page visit, but may reset on refresh or navigation. You can still prepare an enquiry below.';
    if (empty) {
      if (activeControl) {
        var emptyLink = container.querySelector('[data-cart-empty] a');
        if (emptyLink) emptyLink.focus({ preventScroll: true });
      }
      refreshFloatingControls();
      return;
    }
    container.querySelector('[data-cart-items]').innerHTML = cart.map(function (item) {
      var product = productById(item.id);
      var price = publicPrice(product);
      return '<article class="cart-item"><a class="cart-item-image" aria-label="View ' + escapeHtml(product.name) + ' details" href="' + productHref(product) + '"><img src="' + localPath(product.image) + '" width="160" height="120" alt="' + escapeHtml(product.imageAlt || product.name) + '" loading="lazy" decoding="async"></a><div class="cart-item-info"><p class="eyebrow">' + escapeHtml(product.category) + '</p><h2><a href="' + productHref(product) + '">' + escapeHtml(product.name) + '</a></h2><p>' + (price === null ? 'Pricing to be confirmed' : (product.startingAt ? 'From ' : '') + escapeHtml(currencyLabel(price)) + (product.pricingType === 'monthly' ? '/month' : ' per package')) + '</p>' + (product.physical ? '<p class="small muted">Physical item · delivery quoted separately</p>' : '') + '<div class="cart-controls"><div class="quantity-control cart-controls"><button type="button" data-decrease="' + product.id + '" aria-label="Decrease quantity of ' + escapeHtml(product.name) + '"' + (item.quantity <= 1 ? ' disabled' : '') + '>' + icon('minus') + '</button><label class="sr-only" for="quantity-' + product.id + '">Quantity for ' + escapeHtml(product.name) + '</label><input id="quantity-' + product.id + '" data-quantity="' + product.id + '" type="number" inputmode="numeric" min="1" max="99" step="1" value="' + item.quantity + '"><button type="button" data-increase="' + product.id + '" aria-label="Increase quantity of ' + escapeHtml(product.name) + '"' + (item.quantity >= 99 ? ' disabled' : '') + '>' + icon('plus') + '</button></div><button class="remove-item" type="button" data-remove="' + product.id + '" aria-label="Remove ' + escapeHtml(product.name) + ' from quote basket">' + icon('trash') + '<span>Remove</span></button></div></div><div class="cart-line-total cart-item-price">' + (price === null ? 'To be quoted' : (product.startingAt ? 'From ' : '') + escapeHtml(formatCurrency(price * item.quantity)) + (product.pricingType === 'monthly' ? '<small>/month</small>' : '')) + '</div></article>';
    }).join('');
    var totals = calculateTotals();
    var oneTimeDisplay = totals.oneTime === 0 && totals.quoteOnly > totals.monthlyQuoteOnly ? 'To be quoted' : currencyLabel(totals.oneTime);
    var monthlyDisplay = totals.monthlyQuoteOnly && totals.monthly === 0 ? 'To be quoted' : totals.monthly === 0 ? 'None selected' : currencyLabel(totals.monthly) + '/month';
    if (totals.monthlyQuoteOnly && totals.monthly > 0) monthlyDisplay += ' + services to quote';
    container.querySelector('[data-cart-summary]').innerHTML = '<p class="eyebrow">Your quote basket</p><h2>A clear starting point.</h2><dl><div><dt>' + (totals.startingAt ? 'One-time starting subtotal' : 'One-time priced subtotal') + '</dt><dd>' + escapeHtml(oneTimeDisplay) + '</dd></div><div><dt>Recurring monthly subtotal</dt><dd>' + escapeHtml(monthlyDisplay) + '</dd></div>' + (totals.quoteOnly ? '<div><dt>Unpriced item quantities</dt><dd>' + totals.quoteOnly + ' to quote</dd></div>' : '') + '</dl><p class="notice">' + (totals.quoteOnly ? 'Quote-only packages are excluded from the priced subtotals. ' : '') + 'This is an indicative enquiry estimate. Your final scope, total and terms are confirmed before work begins.</p><p class="small muted">' + escapeHtml(config.pricingNote || '') + ' Monthly charges are separate; no subscription is activated.</p><a class="button button-primary" href="#checkout-title">Prepare my enquiry ' + icon('arrow') + '</a>';
    var delivery = container.querySelector('[data-delivery-field]');
    delivery.hidden = !totals.physical;
    delivery.querySelector('textarea').required = false;
    delivery.querySelector('textarea').disabled = !totals.physical || container.querySelector('form[data-enquiry-form="checkout"]').getAttribute('aria-busy') === 'true';
    var review = container.querySelector('.enquiry-review');
    if (review) review.remove();
    var status = container.querySelector('.form-status');
    if (status) status.textContent = '';
    if (focusSelector) {
      var restoredControl = container.querySelector(focusSelector);
      if (restoredControl && !restoredControl.disabled) restoredControl.focus({ preventScroll: true });
      else {
        var nextControl = container.querySelector('[data-quantity]');
        if (nextControl) nextControl.focus({ preventScroll: true });
      }
    }
    refreshFloatingControls();
  }

  // Floating shortcuts step aside when the page already offers a useful action.
  // A single observer supplies visibility state; scroll handlers and polling are unnecessary.
  function setupFloatingControls() {
    var whatsapp = document.querySelector('.whatsapp-float');
    var callback = document.querySelector('.mobile-cta');
    var homeCallback = document.body.dataset.page === 'home' ? document.getElementById('callback') : null;
    if (!whatsapp && !callback) return;
    var watched = new Map();
    var observer = null;
    var framePending = false;
    var fallback = false;
    var scheduleFrame = window.requestAnimationFrame || function (run) { return setTimeout(run, 16); };

    function applyVisibility() {
      var activeElement = document.activeElement;
      var formVisible = Boolean(activeElement && activeElement.closest('form[data-enquiry-form], .comparison, [data-project-carousel], .project-carousel-controls'));
      var productVisible = false;
      var heroVisible = false;
      var waitingForViewport = false;
      watched.forEach(function (state) {
        if (state.visible === null) { waitingForViewport = true; return; }
        if (!state.visible) return;
        if (state.kind === 'form' || state.kind === 'interactive') formVisible = true;
        if (state.kind === 'product') productVisible = true;
        if (state.kind === 'hero') heroVisible = true;
      });
      var menuOpen = document.body.classList.contains('menu-open');
      function update(control, shouldHide) {
        if (!control) return;
        // Never remove the control a keyboard user is currently using.
        control.hidden = shouldHide && !control.contains(document.activeElement);
      }
      update(whatsapp, waitingForViewport || menuOpen || formVisible || productVisible);
      // On the homepage the callback stays visible from the first screen until
      // the visitor reaches the callback section, and returns when scrolling above it.
      var reachedCallback = homeCallback && homeCallback.getBoundingClientRect().top < window.innerHeight;
      update(callback, homeCallback ? menuOpen || reachedCallback : waitingForViewport || menuOpen || formVisible || heroVisible);
    }

    function scheduleUpdate() {
      if (framePending) return;
      framePending = true;
      scheduleFrame(function () { framePending = false; applyVisibility(); });
    }

    function registerContexts() {
      watched.forEach(function (state, element) {
        if (!document.contains(element)) { if (observer) observer.unobserve(element); watched.delete(element); }
      });
      var entries = [];
      document.querySelectorAll('form[data-enquiry-form]').forEach(function (element) { entries.push([element, 'form']); });
      document.querySelectorAll('.comparison, [data-project-carousel], [data-story-order]').forEach(function (element) { entries.push([element, 'interactive']); });
      document.querySelectorAll('.product-detail-info').forEach(function (element) { entries.push([element, 'product']); });
      if (document.body.dataset.page === 'home') document.querySelectorAll('.hero .button-primary').forEach(function (element) { entries.push([element, 'hero']); });
      entries.forEach(function (entry) {
        if (watched.has(entry[0])) return;
        watched.set(entry[0], { kind: entry[1], visible: fallback ? true : null });
        if (observer) observer.observe(entry[0]);
      });
      scheduleUpdate();
    }

    // Start unobtrusively until the observer has returned the initial viewport state.
    if (whatsapp && !whatsapp.contains(document.activeElement)) whatsapp.hidden = true;
    if (callback && !callback.contains(document.activeElement)) callback.hidden = true;
    if (window.IntersectionObserver) {
      try {
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var state = watched.get(entry.target);
            if (state) state.visible = entry.isIntersecting && entry.boundingClientRect.width > 0 && entry.boundingClientRect.height > 0;
          });
          scheduleUpdate();
        }, { threshold: 0 });
      } catch (error) { fallback = true; }
    } else fallback = true;
    // Without observation, keep shortcuts off on form/detail pages rather than cover controls.
    refreshFloatingControls = registerContexts;
    registerContexts();
    document.addEventListener('netbud:menuchange', scheduleUpdate);
    document.addEventListener('focusin', scheduleUpdate);
    document.addEventListener('focusout', scheduleUpdate);
    if (homeCallback) window.addEventListener('scroll', scheduleUpdate, { passive: true });
  }

  function validAustralianPhone(value) {
    var digits = String(value || '').replace(/[\s().-]/g, '');
    return /^(?:0[23478]\d{8}|\+?61[23478]\d{8}|1[38]00\d{6}|13\d{4})$/.test(digits);
  }

  var formLabels = {
    selectedProduct: 'Selected product', quantity: 'Quantity', destination: 'Destination link', jobTitle: 'Job title', socialLinks: 'Social links', name: 'Contact name', business: 'Business name', email: 'Email address', phone: 'Phone number',
    website: 'Current website', services: 'Services required', message: 'Message / instructions', preferredTime: 'Preferred callback time',
    industry: 'Industry', designPreferences: 'Design preferences', preferences: 'Design preferences', goals: 'Project goals', billingAddress: 'Billing address', deliveryAddress: 'Delivery address'
  };

  function formDataObject(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key === 'website_confirm') return;
      var text = String(value).trim();
      if (text) data[key] = data[key] ? data[key] + ', ' + text : text;
    });
    data.marketing = form.querySelector('[name="marketing"]:checked') ? 'Yes — occasional updates requested' : 'No — enquiry only';
    return data;
  }

  function buildEnquiryText(form, data) {
    var lines = ['Hi NetBud,', '', form.dataset.formTitle || 'Business enquiry', ''];
    Object.keys(data).forEach(function (key) {
      if (key === 'marketing') return;
      lines.push((formLabels[key] || key.replace(/([A-Z])/g, ' $1')) + ': ' + data[key]);
    });
    if (form.dataset.enquiryForm === 'checkout') lines.push('', cartSummaryText());
    lines.push('', 'Marketing preference: ' + data.marketing, '', 'Please contact me to discuss the next steps.');
    return lines.join('\n');
  }

  function setFormStatus(form, message, kind) {
    var status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('div'); status.className = 'form-status';
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); form.appendChild(status);
    }
    if (!status.id) {
      var statusId;
      do { formStatusCounter += 1; statusId = 'form-status-' + formStatusCounter; }
      while (document.getElementById(statusId));
      status.id = statusId;
    }
    status.textContent = message;
    status.dataset.state = kind || 'info';
    return status;
  }

  function showEnquiryDraft(form, text, failedDelivery) {
    var existing = form.querySelector('.enquiry-review');
    if (existing) existing.remove();
    var review = document.createElement('section');
    review.className = 'enquiry-review notice';
    review.setAttribute('aria-label', 'Review your enquiry draft');
    var heading = document.createElement('h3'); heading.textContent = 'Your enquiry draft is ready.'; review.appendChild(heading);
    var explanation = document.createElement('p');
    explanation.textContent = failedDelivery
      ? 'Delivery through the form service could not be confirmed. Your enquiry is preserved below. You can review it and choose an alternative contact method; your selected app will receive the details when you open its draft.'
      : 'Nothing has been sent. Review the details below, then open an email or WhatsApp draft and send it yourself. Your selected app will receive the details when you open the draft.';
    review.appendChild(explanation);
    var draft = document.createElement('pre'); draft.className = 'enquiry-draft'; draft.textContent = text; review.appendChild(draft);
    var actions = document.createElement('div'); actions.className = 'button-group button-row';
    if (config.contactEmail) {
      var emailLink = document.createElement('a'); emailLink.className = 'button button-primary';
      emailLink.href = 'mailto:' + config.contactEmail + '?subject=' + encodeURIComponent('NetBud — ' + (form.dataset.formTitle || 'Business enquiry')) + '&body=' + encodeURIComponent(text);
      emailLink.innerHTML = icon('mail') + '<span>Open email draft</span>'; actions.appendChild(emailLink);
    }
    var whatsapp = whatsappUrl(text);
    if (whatsapp) {
      var whatsappLink = document.createElement('a'); whatsappLink.className = 'button button-outline'; whatsappLink.href = whatsapp;
      whatsappLink.target = '_blank'; whatsappLink.rel = 'noopener noreferrer'; whatsappLink.innerHTML = icon('whatsapp') + '<span>Open WhatsApp draft</span>'; actions.appendChild(whatsappLink);
    }
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'button button-outline'; copy.textContent = 'Copy enquiry';
    copy.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { notify('Enquiry copied. You can paste it into your preferred contact app.'); }).catch(function () { selectDraft(draft); });
      } else selectDraft(draft);
    });
    actions.appendChild(copy); review.appendChild(actions);
    if (!config.contactEmail && !whatsapp) {
      var noContact = document.createElement('p'); noContact.textContent = 'Contact details are not configured yet. Copy your draft and contact the business through a confirmed channel.'; review.appendChild(noContact);
    }
    form.appendChild(review);
    setFormStatus(form, failedDelivery ? 'We could not confirm delivery. Your details are preserved in the draft below; nothing has been marked as sent.' : 'Draft ready. Nothing has been sent. Choose an option below to send your enquiry.', failedDelivery ? 'error' : 'info');
  }

  function selectDraft(draft) {
    var selection = window.getSelection(); var range = document.createRange();
    range.selectNodeContents(draft); selection.removeAllRanges(); selection.addRange(range);
    notify('Draft selected. Use your device’s copy command to copy it.');
  }

  function setupForms(root) {
    (root || document).querySelectorAll('form[data-enquiry-form]').forEach(function (form) {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';
      var phone = form.querySelector('[name="phone"]');
      var submitting = false;
      var formRevision = 0;
      setFormStatus(form, '', 'info');
      // Keep errors readable in the page as well as in the browser's native prompt.
      form.addEventListener('invalid', function (event) {
        event.target.setAttribute('aria-invalid', 'true');
        var message = event.target.validationMessage || 'Please check the highlighted field.';
        var status = setFormStatus(form, message, 'error');
        var error = document.getElementById(event.target.dataset.errorId || '');
        if (!error) {
          error = document.createElement('p');
          do { fieldErrorCounter += 1; error.id = 'field-error-' + fieldErrorCounter; }
          while (document.getElementById(error.id));
          error.className = 'field-error';
          event.target.dataset.errorId = error.id;
          event.target.insertAdjacentElement('afterend', error);
        }
        error.textContent = message;
        var descriptionIds = (event.target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        descriptionIds = descriptionIds.filter(function (id) { return id !== status.id; });
        if (descriptionIds.indexOf(error.id) === -1) descriptionIds.push(error.id);
        event.target.setAttribute('aria-describedby', descriptionIds.join(' '));
      }, true);
      function handleEdit(event) {
        formRevision += 1;
        var field = event.target;
        if (typeof field.setCustomValidity === 'function') field.setCustomValidity('');
        field.removeAttribute('aria-invalid');
        var status = form.querySelector('.form-status');
        if (status && field.hasAttribute('aria-describedby')) {
          var descriptionIds = field.getAttribute('aria-describedby').split(/\s+/).filter(function (id) { return id && id !== status.id && id !== field.dataset.errorId; });
          if (descriptionIds.length) field.setAttribute('aria-describedby', descriptionIds.join(' '));
          else field.removeAttribute('aria-describedby');
        }
        var error = document.getElementById(field.dataset.errorId || '');
        if (error) error.remove();
        delete field.dataset.errorId;
        var review = form.querySelector('.enquiry-review');
        if (review) {
          review.remove();
          setFormStatus(form, 'Details changed. Prepare your updated enquiry.', 'info');
        }
      }
      form.addEventListener('input', handleEdit);
      form.addEventListener('change', handleEdit);
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (submitting) return;
        // Delivery and other required fields can become active after this form is bound.
        var requiredText = Array.from(form.querySelectorAll('input[required],textarea[required]')).filter(function (field) {
          return !field.matches(':disabled') && (field.tagName === 'TEXTAREA' || /^(text|email|tel|url|search)$/.test(field.type));
        });
        requiredText.forEach(function (field) {
          field.value = field.value.trim();
          field.setCustomValidity(!field.value ? 'Please enter a value; spaces alone are not enough.' : field.minLength > 0 && field.value.length < field.minLength ? 'Please enter at least ' + field.minLength + ' characters.' : '');
        });
        if (phone) phone.setCustomValidity(!phone.value && !phone.required || validAustralianPhone(phone.value) ? '' : 'Enter a valid Australian mobile or phone number, such as 0425 714 451.');
        if (!form.reportValidity()) return;
        var trap = form.querySelector('[name="website_confirm"]');
        if (trap && trap.value) { setFormStatus(form, 'We could not prepare this request. Please contact us directly.', 'error'); return; }
        if (form.dataset.enquiryForm === 'checkout' && !cart.length) { setFormStatus(form, 'Add at least one package before preparing your quote request.', 'error'); return; }
        var data = formDataObject(form);
        var text = buildEnquiryText(form, data);
        var endpoint = safeHttps(config.formEndpoint);
        if (!endpoint) { showEnquiryDraft(form, text, false); return; }
        submitting = true;
        var submittedRevision = formRevision;
        var basketSnapshot = form.dataset.enquiryForm === 'checkout' ? JSON.stringify(cart) : null;
        var lockedFields = Array.from(form.querySelectorAll('input,select,textarea')).filter(function (field) { return field.name !== 'website_confirm'; }).map(function (field) {
          var record = { field: field, disabled: field.disabled };
          field.disabled = true;
          return record;
        });
        form.setAttribute('aria-busy', 'true');
        var button = form.querySelector('[type="submit"]');
        var previousLabel = button ? button.innerHTML : '';
        if (button) { button.disabled = true; button.textContent = 'Sending your request…'; }
        setFormStatus(form, 'Sending your request securely…', 'loading');
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeout = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
        try {
          var response = await fetch(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(Object.assign({}, data, { _subject: 'NetBud — ' + (form.dataset.formTitle || 'Business enquiry'), enquiryType: form.dataset.enquiryForm, enquirySummary: text, _gotcha: '' })),
            credentials: 'omit', signal: controller ? controller.signal : undefined
          });
          if (!response.ok) throw new Error('Delivery was not accepted');
          var oldReview = form.querySelector('.enquiry-review'); if (oldReview) oldReview.remove();
          var changed = formRevision !== submittedRevision || basketSnapshot !== null && basketSnapshot !== JSON.stringify(cart);
          setFormStatus(form, changed ? 'Your submitted enquiry has been received by our form service. Your basket or form changed while it was sending; the latest changes remain here and have not been sent.' : 'Your enquiry has been submitted through our form service. We’ll be in touch to discuss it. This is an enquiry, not a confirmed order.', 'success');
          if (!changed) form.reset();
        } catch (error) {
          if (formRevision !== submittedRevision || basketSnapshot !== null && basketSnapshot !== JSON.stringify(cart)) setFormStatus(form, 'Delivery could not be confirmed. Your latest changes have been kept. Review them before preparing another enquiry, or contact us directly.', 'error');
          else showEnquiryDraft(form, text, true);
        }
        finally {
          if (timeout) clearTimeout(timeout);
          submitting = false;
          form.removeAttribute('aria-busy');
          lockedFields.forEach(function (record) { record.field.disabled = record.disabled; });
          var delivery = form.querySelector('[name="deliveryAddress"]');
          if (delivery && form.dataset.enquiryForm === 'checkout') delivery.disabled = !calculateTotals().physical;
          if (button) { button.disabled = false; button.innerHTML = previousLabel; }
        }
      });
      // Static forms start disabled so JavaScript-free visits cannot submit private details to a page URL.
      form.querySelectorAll('[type="submit"]').forEach(function (button) { button.disabled = false; });
    });
    var service = new URLSearchParams(window.location.search).get('service');
    if (service && service.length <= 150) {
      (root || document).querySelectorAll('form[data-enquiry-form="contact"]').forEach(function(form){if(!form.querySelector('[name="selectedProduct"]')){var row=document.createElement('div');row.className='field field-full';var label=document.createElement('label');label.htmlFor='contact-selected-product';label.textContent='Selected service';var input=document.createElement('input');input.id='contact-selected-product';input.name='selectedProduct';input.readOnly=true;input.value=service;row.appendChild(label);row.appendChild(input);form.querySelector('.form-grid').prepend(row);}});
      (root || document).querySelectorAll('[name="services"]').forEach(function (field) {
        if (field.tagName === 'SELECT') {
          var requestedProduct = products.find(function (product) { return product.name === service; });
          var categoryValue = requestedProduct ? { 'Websites': 'websites', 'Digital Growth': 'seo', 'Branding & Design': 'branding', 'NFC Products': 'nfc', 'Business Systems & Support': 'systems' }[requestedProduct.category] : /website/i.test(service) ? 'websites' : '';
          var matching = Array.from(field.options).find(function (option) { return option.value === service || option.textContent === service || categoryValue && option.value === categoryValue; });
          if (matching) field.value = matching.value;
        } else if (field.type !== 'checkbox' && field.type !== 'radio' && !field.value) field.value = service;
      });
      if (products.some(function (product) { return product.name === service; }) || (config.pricingPlans || []).some(function (plan) { return plan.title === service; })) {
        (root || document).querySelectorAll('form[data-enquiry-form="contact"] [name="message"]').forEach(function (field) { if (!field.value) field.value = 'I’m interested in ' + service + '. '; });
      }
    }
  }

  function setupPayments() {
    document.querySelectorAll('[data-hosted-payments]').forEach(function (container) {
      var links = (config.hostedPaymentLinks || []).filter(function (link) { return safeHttps(link.url); });
      container.hidden = !links.length;
      if (!links.length) return;
      container.innerHTML = '<h2>Already have an agreed invoice?</h2><p>Only pay the amount and service agreed in your proposal. Hosted payment links open the payment provider’s website.</p><div class="button-group button-row">' + links.map(function (link) { return '<a class="button button-outline" href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(link.label || 'Open secure payment link') + ' ' + icon('external') + '</a>'; }).join('') + '</div>';
    });
    document.querySelectorAll('[data-upi-section]').forEach(function (container) {
      var upi = config.upi || {};
      var localQr = typeof upi.qrImage === 'string' && /^(?:images\/)[a-zA-Z0-9_./-]+\.(?:svg|png|jpe?g|webp)$/i.test(upi.qrImage) && upi.qrImage.indexOf('..') === -1;
      var enabled = Boolean(upi.enabled && config.currency === 'INR' && /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upi.id || '') && localQr);
      container.hidden = !enabled;
      if (!enabled) return;
      container.innerHTML = '<h2>Manual UPI payment</h2><img src="' + localPath(upi.qrImage) + '" alt="UPI payment QR code for the configured recipient" width="220" height="220"><p><strong>Recipient UPI ID:</strong> ' + escapeHtml(upi.id) + '</p><p>' + escapeHtml(upi.instructions) + '</p><p class="notice">Confirm the recipient and agreed invoice amount before paying. This website cannot verify a manual payment.</p>';
    });
  }

  function setupAnalytics() {
    var id = config.googleAnalyticsId || '';
    if (!/^G-[A-Z0-9]+$/.test(id)) return;
    var consent = null;
    var analyticsStarted = false;
    var disableKey = 'ga-disable-' + id;
    try { consent = window.localStorage.getItem('netbud-analytics-consent'); } catch (error) { /* Consent can still apply for this visit. */ }
    function activate() {
      window[disableKey] = false;
      if (analyticsStarted) return;
      analyticsStarted = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id, { send_page_view: true });
      var script = document.createElement('script'); script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id); document.head.appendChild(script);
    }
    function showChoice(moveFocus) {
      if (document.querySelector('.analytics-consent')) return;
      // Google documents this flag as the control for stopping gtag data collection.
      // https://developers.google.com/tag-platform/security/guides/privacy
      window[disableKey] = true;
      var banner = document.createElement('aside');
      banner.className = 'analytics-consent consent-banner';
      banner.setAttribute('aria-label', 'Optional analytics choice');
      banner.innerHTML = '<p>May we use optional Google Analytics to understand website visits? Your enquiry details are never sent as analytics events. Analytics stay off while you choose. <a href="' + localPath('privacy.html') + '">Read the draft policy</a>.</p><div class="button-group button-row"><button type="button" class="button button-primary" data-analytics-yes>Allow analytics</button><button type="button" class="button button-outline" data-analytics-no>No thanks</button></div>';
      banner.addEventListener('click', function (event) {
        var yes = event.target.closest('[data-analytics-yes]');
        var no = event.target.closest('[data-analytics-no]');
        if (!yes && !no) return;
        try { window.localStorage.setItem('netbud-analytics-consent', yes ? 'yes' : 'no'); } catch (error) { /* Browser storage is optional. */ }
        if (yes) activate();
        else window[disableKey] = true;
        banner.remove();
        var preferenceButton = document.querySelector('[data-analytics-preferences]');
        if (moveFocus && preferenceButton) preferenceButton.focus({ preventScroll: true });
        notify(yes ? 'Your analytics preference has been saved.' : 'Optional analytics are off.');
      });
      document.body.appendChild(banner);
      if (moveFocus) banner.querySelector('button').focus();
    }
    document.querySelectorAll('[data-analytics-preferences]').forEach(function (button) {
      button.addEventListener('click', function () {
        try { window.localStorage.removeItem('netbud-analytics-consent'); } catch (error) { /* Preference can still change for this visit. */ }
        showChoice(true);
      });
    });
    window[disableKey] = consent !== 'yes';
    if (consent === 'yes') activate();
    else if (consent !== 'no') showChoice(false);
  }

  function configureProductionMetadata() {
    var url = safeSiteUrl();
    if (!url) return;
    var pagePath = document.body.dataset.page === 'preview-studio' ? '/previews/' : cleanUrl(window.location.pathname);
    updateCanonical(url + pagePath);
    updateMeta('meta[property="og:image"]', url + '/images/social-card.jpg?v=20261028-b1');
    updateMeta('meta[name="twitter:image"]', url + '/images/social-card.jpg?v=20261028-b1');
  }

  // The optional rotating preview always retains manual tabs and an explicit pause control.
  function setupDemoTabs() {
    var tabs = Array.from(document.querySelectorAll('[data-demo-tab]'));
    var panels = Array.from(document.querySelectorAll('[data-demo-panel]'));
    if (!tabs.length || !panels.length) return;
    var motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var host = tabs[0].closest('.hero-studio[data-demo-interval]');
    var pauseButton = host && host.querySelector('[data-demo-pause]');
    var status = host && host.querySelector('[data-demo-status]');
    var interval = host ? Number(host.dataset.demoInterval) : 0;
    var autoplayEnabled = Boolean(host && pauseButton && motionPreference && Number.isFinite(interval) && interval >= 1000);
    var hoverPreference = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
    var userPaused = false;
    var focusWithin = Boolean(host && host.contains(document.activeElement));
    var hovered = Boolean(host && hoverPreference && hoverPreference.matches && host.matches(':hover'));
    var inView = true;
    var pageActive = true;
    var timer = null;
    var activeTab = null;
    var incomingAnimation = null;
    function clearTimer() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }
    function reducedMotion() { return Boolean(motionPreference && motionPreference.matches); }
    function canRotate() {
      return autoplayEnabled && host.isConnected && !userPaused && !reducedMotion() && !focusWithin && !hovered && !document.hidden && inView && pageActive;
    }
    function updateRotationControls() {
      if (host) host.classList.toggle('is-scene-paused', userPaused || document.hidden || !inView || !pageActive);
      if (!autoplayEnabled) return;
      pauseButton.hidden = false;
      pauseButton.disabled = reducedMotion();
      pauseButton.setAttribute('aria-pressed', String(userPaused));
      pauseButton.textContent = userPaused ? 'Play' : 'Pause';
      pauseButton.setAttribute('aria-label', userPaused ? 'Enable automatic service preview rotation' : 'Pause automatic service preview rotation');
      var message = (interval === 1000 ? 'Every second' : 'Every ' + (interval / 1000) + ' seconds') + ' · illustrative examples.';
      if (reducedMotion()) message = 'Reduced motion · choose a tab.';
      else if (userPaused) message = 'Paused · choose Play to resume.';
      else if (focusWithin) message = 'Move focus outside to resume.';
      else if (hovered) message = 'Move pointer away to resume.';
      else if (!inView || document.hidden || !pageActive) message = 'Paused while out of view.';
      if (status && status.textContent !== message) status.textContent = message;
    }
    function scheduleNext() {
      clearTimer();
      updateRotationControls();
      if (!canRotate()) return;
      timer = window.setTimeout(function () {
        timer = null;
        if (!canRotate()) { updateRotationControls(); return; }
        var next = (tabs.indexOf(activeTab) + 1) % tabs.length;
        activate(tabs[next], false, true);
      }, interval);
    }
    function cancelEntrance() {
      if (!incomingAnimation) return;
      incomingAnimation.cancel();
      incomingAnimation = null;
    }
    function activate(tab, moveFocus, animateSelection) {
      var changed = activeTab !== tab;
      cancelEntrance();
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(function (panel) {
        var selected = panel.dataset.demoPanel === tab.dataset.demoTab;
        panel.hidden = !selected;
        panel.classList.toggle('is-active', selected);
      });
      activeTab = tab;
      if (animateSelection && changed && motionPreference && !motionPreference.matches) {
        var panel = panels.find(function (item) { return !item.hidden; });
        var visual = panel && (panel.querySelector('[data-scene-visual]') || panel.querySelector('img'));
        if (visual && typeof visual.animate === 'function') {
          try {
            var animation = visual.animate([
              { opacity: 0 },
              { opacity: 1 }
            ], { duration: 240, easing: 'cubic-bezier(.22,1,.36,1)' });
            incomingAnimation = animation;
            animation.onfinish = function () { if (incomingAnimation === animation) incomingAnimation = null; };
          } catch (error) { cancelEntrance(); }
        }
      }
      if (moveFocus) tab.focus();
      scheduleNext();
    }
    tabs.forEach(function (tab, index) {
      var key = tab.dataset.demoTab;
      var panel = panels.find(function (item) { return item.dataset.demoPanel === key; });
      tab.setAttribute('role', 'tab');
      if (!tab.id) tab.id = 'demo-tab-' + key;
      if (panel) {
        if (!panel.id) panel.id = 'hero-panel-' + key;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
      }
      tab.addEventListener('click', function () { activate(tab, false, true); });
      tab.addEventListener('keydown', function (event) {
        var destination = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') destination = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') destination = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') destination = 0;
        if (event.key === 'End') destination = tabs.length - 1;
        if (destination === null) return;
        event.preventDefault();
        activate(tabs[destination], true, true);
      });
    });
    activate(tabs.find(function (tab) { return tab.getAttribute('aria-selected') === 'true'; }) || tabs[0], false);
    function handleMotionChange(event) {
      if (event.matches) cancelEntrance();
      scheduleNext();
    }
    if (motionPreference && motionPreference.addEventListener) motionPreference.addEventListener('change', handleMotionChange);
    else if (motionPreference && motionPreference.addListener) motionPreference.addListener(handleMotionChange);
    window.addEventListener('pagehide', function () { pageActive = false; clearTimer(); cancelEntrance(); });
    window.addEventListener('pageshow', function (event) {
      pageActive = true;
      if (event.persisted) cancelEntrance();
      scheduleNext();
    });
    if (!autoplayEnabled) return;
    pauseButton.addEventListener('click', function () {
      userPaused = !userPaused;
      scheduleNext();
    });
    host.addEventListener('focusin', function () { focusWithin = true; scheduleNext(); });
    host.addEventListener('focusout', function (event) {
      if (event.relatedTarget) {
        focusWithin = host.contains(event.relatedTarget);
        scheduleNext();
      } else Promise.resolve().then(function () {
        focusWithin = host.contains(document.activeElement);
        scheduleNext();
      });
    });
    host.addEventListener('mouseenter', function () {
      if (hoverPreference && hoverPreference.matches) { hovered = true; scheduleNext(); }
    });
    host.addEventListener('mouseleave', function () { hovered = false; scheduleNext(); });
    function handleHoverChange() {
      hovered = Boolean(hoverPreference && hoverPreference.matches && host.matches(':hover'));
      scheduleNext();
    }
    if (hoverPreference && hoverPreference.addEventListener) hoverPreference.addEventListener('change', handleHoverChange);
    else if (hoverPreference && hoverPreference.addListener) hoverPreference.addListener(handleHoverChange);
    document.addEventListener('visibilitychange', scheduleNext);
    if (window.IntersectionObserver) {
      try {
        var bounds = host.getBoundingClientRect();
        inView = bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth;
        var visibilityObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { if (entry.target === host) inView = entry.isIntersecting; });
          scheduleNext();
        }, { threshold: 0 });
        visibilityObserver.observe(host);
      } catch (error) { inView = true; }
    }
    scheduleNext();
  }

  // The native range control retains its keyboard and touch behaviour.
  function setupComparisons() {
    document.querySelectorAll('input[data-comparison]').forEach(function (input) {
      var comparison = input.closest('.comparison') || input.parentElement;
      var output = comparison.querySelector('[data-comparison-value]');
      function update() {
        var amount = Number(input.value);
        if (!Number.isFinite(amount)) amount = 50;
        amount = Math.max(0, Math.min(100, amount));
        comparison.style.setProperty('--split', amount + '%');
        input.setAttribute('aria-valuetext', amount + '% of the updated design shown');
        if (output) output.textContent = amount + '%';
      }
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      update();
    });
  }

  // Content starts visible. Scroll effects are an optional, motion-aware enhancement.
  function setupReveals() {
    // Collect coherent units once. Later catalogue/basket renders stay immediately visible.
    var roots = [document.querySelector('main'), document.getElementById('site-footer')].filter(Boolean);
    var groupSelector = '.hero-studio, .hero-note, .service-ribbon, .page-art, .product-card, .portfolio-card, .price-card, .service-row, .service-jump, .partner-point, .home-step, .step, .value-row, .card, .cart-item, .cart-summary, .cart-tools, .product-gallery, .product-price, .breadcrumbs, .catalogue-toolbar, .category-tabs, form, details, .button-row, .button-group, .social-links, .footer-brand, .footer-links, .footer-bottom';
    var leafSelector = 'h1, h2, h3, h4, p, ul, ol, dl, figure, picture, img, svg[role="img"], a.button, button.button, .button-link, .text-link';
    function blocked(element) {
      if (element.closest('[hidden], [data-no-reveal], .sr-only, noscript, script, style, .honeypot, .form-status, .field-error, .enquiry-review, [role="status"], [role="alert"]')) return true;
      if (element.closest('[data-demo-panel]')) return true;
      var desk = element.closest('.hero-studio');
      if (desk && desk !== element) return true;
      var parentReveal = element.parentElement && element.parentElement.closest('[data-reveal]');
      return Boolean(parentReveal && !parentReveal.hasAttribute('data-process-reveal'));
    }
    function addTarget(element, group) {
      if (element.hasAttribute('data-reveal') || blocked(element) || element.querySelector('[data-reveal]')) return;
      if (!group && element.closest('form, details')) return;
      if (element.matches('img') && !element.getAttribute('alt')) return;
      if (element.matches('h1, h2, h3, h4, p, ul, ol') && !element.textContent.trim()) return;
      // Keep very long forms/cards readable as ordinary content; surrounding headings still fade.
      if (group && element.getBoundingClientRect().height > (window.innerHeight || 800) * 1.5) return;
      element.setAttribute('data-reveal', 'auto');
    }
    roots.forEach(function (root) {
      root.querySelectorAll(groupSelector).forEach(function (element) { addTarget(element, true); });
      root.querySelectorAll(leafSelector).forEach(function (element) { addTarget(element, false); });
    });
    var elements = Array.from(document.querySelectorAll('[data-reveal]')).filter(function (element) { return !blocked(element); });
    if (!window.matchMedia) return;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;
    var observer;
    function reveal(element, immediate) {
      if (immediate) {
        element.classList.add('reveal-instant');
        element.style.setProperty('--reveal-delay', '0ms');
        element.style.setProperty('--reveal-duration', '0ms');
      }
      element.classList.add('is-revealed');
      if (observer) observer.unobserve(element);
    }
    function showEverything() {
      document.body.classList.remove('motion-ready');
      elements.forEach(function (element) { element.classList.remove('reveal-ready'); reveal(element, true); });
      if (observer) observer.disconnect();
    }
    // Browser-restored scroll positions should display content without another entrance.
    function isHistoryRestore() {
      try {
        var navigation = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0];
        return Boolean(navigation && navigation.type === 'back_forward');
      } catch (error) { return false; }
    }
    if (isHistoryRestore()) { showEverything(); return; }
    document.body.classList.add('motion-ready');
    function handleMotionChange(event) { if (event.matches) showEverything(); }
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', handleMotionChange);
    else if (motionPreference.addListener) motionPreference.addListener(handleMotionChange);
    window.addEventListener('pageshow', function (event) { if (event.persisted || isHistoryRestore()) showEverything(); });
    if (!elements.length || !window.IntersectionObserver) return;
    var compactViewport = window.matchMedia('(max-width: 767px)');
    function assignGroupDelays() {
      document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
        Array.from(group.children).filter(function (child) { return child.hasAttribute('data-reveal'); }).forEach(function (element, index) {
          if (!element.classList.contains('is-revealed')) element.style.setProperty('--reveal-delay', (compactViewport.matches ? 0 : Math.min(index * 50, 200)) + 'ms');
        });
      });
    }
    assignGroupDelays();
    if (compactViewport.addEventListener) compactViewport.addEventListener('change', assignGroupDelays);
    else if (compactViewport.addListener) compactViewport.addListener(assignGroupDelays);
    // Keyboard focus must never wait for a scroll animation to expose its control.
    document.addEventListener('focusin', function (event) {
      elements.forEach(function (element) {
        if (element.classList.contains('reveal-ready') && element.contains(event.target)) reveal(element, true);
      });
    });
    try {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var tall = entry.boundingClientRect && entry.boundingClientRect.height > (window.innerHeight || 800) * 1.5;
          if (entry.isIntersecting && (entry.intersectionRatio >= 0.06 || tall)) reveal(entry.target);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -12px 0px' });
      elements.forEach(function (element) {
        element.classList.add('reveal-ready');
        var bounds = element.getBoundingClientRect();
        // First-screen content is readable immediately; only later content fades on scroll.
        if (element.contains(document.activeElement) || (bounds.top < window.innerHeight && bounds.bottom > 0)) reveal(element, true);
        else observer.observe(element);
      });
    } catch (error) { showEverything(); return; }
  }

  function openImagePreview(trigger) {
    var dialog = document.querySelector('.image-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'image-dialog';
      dialog.setAttribute('aria-label', 'Product image preview');
      dialog.innerHTML = '<form method="dialog"><button type="submit">Close image ×</button></form><img alt="">';
      document.body.appendChild(dialog);
      dialog.addEventListener('click', function(event) { if (event.target === dialog) dialog.close(); });
    }
    var image = dialog.querySelector('img');
    image.src = trigger.dataset.viewImage;
    image.alt = trigger.dataset.imageAlt;
    dialog.showModal();
  }

  function setupGlobalEvents() {
    document.addEventListener('click', function (event) {
      var imageTrigger = event.target.closest('[data-view-image]');
      if (imageTrigger) { openImagePreview(imageTrigger); return; }
      var add = event.target.closest('[data-add-product]');
      if (add) { addToCart(add.dataset.addProduct); return; }
      var thumbnail = event.target.closest('[data-product-image]');
      if (thumbnail) {
        var mainImage = document.querySelector('[data-product-main-image]');
        if (mainImage) mainImage.src = localPath(thumbnail.dataset.productImage);
        document.querySelectorAll('[data-product-image]').forEach(function (button) { button.setAttribute('aria-pressed', String(button === thumbnail)); });
        return;
      }
      var remove = event.target.closest('[data-remove]');
      if (remove) { removeFromCart(remove.dataset.remove); notify('Package removed from your quote basket.'); return; }
      var increase = event.target.closest('[data-increase]');
      if (increase) { var more = cart.find(function (item) { return item.id === Number(increase.dataset.increase); }); if (more) setQuantity(more.id, more.quantity + 1); return; }
      var decrease = event.target.closest('[data-decrease]');
      if (decrease) { var less = cart.find(function (item) { return item.id === Number(decrease.dataset.decrease); }); if (less) setQuantity(less.id, less.quantity - 1); return; }
      var empty = event.target.closest('[data-empty-cart]');
      if (empty) { cart = []; saveCart(); notify('Your quote basket is empty.'); return; }
      var category = event.target.closest('[data-category]');
      if (category) { filterState.category = category.dataset.category; var select = document.getElementById('category-filter'); if (select) select.value = filterState.category; renderCatalogue(); return; }
      if (event.target.closest('[data-reset-filters]')) {
        filterState = { category: 'All', search: '', sort: 'featured', billing: 'All', industry: 'All' }; document.querySelectorAll('#billing-filter,#industry-filter').forEach(function(e){e.value='All';});
        var search = document.getElementById('product-search'); var categories = document.getElementById('category-filter'); var sort = document.getElementById('product-sort');
        if (search) search.value = ''; if (categories) categories.value = 'All'; if (sort) sort.value = 'featured'; renderCatalogue();
        if (search) search.focus();
        return;
      }
      var social = event.target.closest('[data-social-placeholder]');
      if (social) notify(social.dataset.socialPlaceholder + ' profile link coming soon. You can contact us by phone, email or WhatsApp.');
    });
    document.addEventListener('change', function (event) {
      if (!event.target.matches('[data-quantity]')) return;
      if (!setQuantity(event.target.dataset.quantity, event.target.value)) { notify('Please choose a whole-number quantity from 1 to 99.'); renderCart(); }
    });
    window.addEventListener('storage', function (event) { if (event.key === cartKey || event.key === null) { loadCart(); updateCartCount(); renderCart(); } });
  }

  function initialise() {
    renderShell();
    hydrateIcons();
    configureProductionMetadata();
    loadCart();
    renderFeaturedProducts();
    setupCatalogue();
    renderProductDetail();
    renderPricing();
    renderPortfolio();
    renderCart();
    updateCartCount();
    setupForms();
    setupGlobalEvents();
    setupPayments();
    setupAnalytics();
    setupDemoTabs();
    setupComparisons();
    setupReveals();
    setupFloatingControls();
    document.documentElement.classList.add('js-ready');
  }

  // Small public API for maintenance and meaningful browser checks; never contains enquiry data.
  window.NetBud = {
    formatCurrency: formatCurrency,
    validAustralianPhone: validAustralianPhone,
    sanitiseCart: sanitiseCart,
    calculateTotals: calculateTotals,
    addToCart: addToCart,
    setQuantity: setQuantity,
    removeFromCart: removeFromCart,
    getCart: function () { return cart.map(function (item) { return { id: item.id, quantity: item.quantity }; }); },
    clearCart: function () { cart = []; saveCart(); },
    whatsappUrl: whatsappUrl,
    cartSummaryText: cartSummaryText
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
