/* Marketing package cards share the catalogue's pricing and billing type. */
(function () {
  "use strict";

  function renderMarketingPackages() {
    var config = window.NETBUD_CONFIG || {};
    var products = window.NETBUD_PRODUCTS || [];
    var base = document.body.dataset.base || "";
    var money;
    try { money = new Intl.NumberFormat(config.locale || "en-AU", { style: "currency", currency: config.currency || "AUD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
    catch (error) { money = { format: function (amount) { return "A$" + amount; } }; }
    function amountLabel(amount) {
      return money.format(amount).replace(config.currency === "AUD" ? /^\$/ : /$^/, "A$");
    }
    function node(tag, className, text) {
      var element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }

    document.querySelectorAll("[data-social-starting-price]").forEach(function (element) {
      element.textContent = config.publicPricing && typeof config.starterSocialPrice === "number"
        ? "starting at " + amountLabel(config.starterSocialPrice) + " / month" : "request monthly pricing";
    });
    document.querySelectorAll("[data-social-video-count]").forEach(function (element) {
      element.textContent = String(config.socialContent && config.socialContent.videosPerMonth || 10);
    });

    document.querySelectorAll("[data-marketing-pricing-grid]").forEach(function (grid) {
      if (grid.dataset.marketingBound === "true") return;
      grid.dataset.marketingBound = "true";
      grid.replaceChildren();
      (config.marketingPlans || []).forEach(function (plan) {
        var product = products.find(function (item) { return item.id === plan.productId; });
        if (!product || product.available === false) return;
        var card = node("article", "price-card marketing-price-card" + (plan.featured ? " marketing-price-card-featured" : ""));
        card.appendChild(node("p", "eyebrow", plan.label));
        card.appendChild(node("h3", "marketing-plan-title", plan.title));
        card.appendChild(node("p", "", plan.description));
        var price = node("div", "plan-price");
        var priced = config.publicPricing && typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0;
        if (priced) {
          price.appendChild(node("span", "price-prefix", product.startingAt ? "Starting at" : "Monthly service"));
          price.appendChild(node("span", "price-value", amountLabel(product.price)));
          price.appendChild(node("span", "price-detail", (config.currency || "AUD") + " / month"));
        } else {
          price.appendChild(node("span", "price-value", "Let’s talk"));
          price.appendChild(node("span", "price-detail", "A tailored monthly quote"));
        }
        card.appendChild(price);
        var list = node("ul", "check-list");
        (plan.features || []).forEach(function (feature) {
          var item = node("li");
          item.appendChild(node("span", "", feature));
          list.appendChild(item);
        });
        card.appendChild(list);
        var link = node("a", "button " + (plan.featured ? "button-primary" : "button-outline"), "Explore package ↗");
        link.href = base + "product.html?id=" + product.id;
        card.appendChild(link);
        card.appendChild(node("p", "small muted", plan.note));
        grid.appendChild(card);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderMarketingPackages, { once: true });
  else renderMarketingPackages();
}());
