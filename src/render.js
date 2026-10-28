import fs from "node:fs";
import path from "node:path";
import { rich, resolve, renderCompareMobile, renderCompareTable, messageUrls, channelFor } from "./text.js";

const root = path.resolve(import.meta.dirname, "..");

function icon(file, size) {
  let svg = fs.readFileSync(path.join(root, "assets/icons", file), "utf8");
  svg = svg
    .replace(/<\?xml[^>]*>/g, "")
    .replace(/<rect[\s\S]*?\/>/g, "")
    .replace(/<defs>[\s\S]*?<\/defs>/g, "")
    .replace(/\sclip-path="[^"]*"/g, "")
    .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
    .replace(/fill="white"/g, 'fill="none"')
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
  return svg;
}

const I = {
  msg: icon("icon-msg-20.svg", 20),
  phone: icon("icon-phone-20.svg", 20),
  check: icon("icon-check-16.svg", 16),
  check18: icon("icon-check-18.svg", 18),
  clock: icon("icon-clock-18.svg", 18),
  card: icon("icon-card-18.svg", 18),
  pin: icon("icon-pin-16.svg", 16),
  copy: icon("icon-copy-16.svg", 16),
  chev: icon("icon-chevd-20.svg", 20)
};

function k(content, lang, key, scope) {
  const scopeAttr = scope ? ` data-scope="${scope}"` : "";
  return `<span data-k="${key}"${scopeAttr}>${rich(resolve(content, lang, key, scope))}</span>`;
}

function hrefFor(content, lang, kind, msgKey) {
  const channel = channelFor(kind, lang);
  if (channel === "copy") return "#cta";
  const message = content.messages[lang][msgKey];
  const urls = messageUrls(content.placeholders.phones, message);
  return urls[channel];
}

function cta(content, lang, { kind, msg, key, scope, className, iconName }) {
  const channel = channelFor(kind, lang);
  const href = hrefFor(content, lang, kind, msg);
  const target = channel === "zalo" || channel === "whatsapp" ? ' target="_blank" rel="noopener"' : "";
  const ico = iconName ? I[iconName] : "";
  return `<a class="${className}" data-cta="${kind}" data-msg="${msg}" href="${href.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")}"${target}>${ico}${k(content, lang, key, scope)}</a>`;
}

export function renderPage(content, lang) {
  const other = lang === "vi" ? "en" : "vi";
  const origin = content.origin;
  const canonical = lang === "en" ? `${origin}/en` : `${origin}/`;
  const title = resolve(content, lang, "title");
  const description = resolve(content, lang, "description");
  const locale = lang === "vi" ? "vi_VN" : "en_US";
  const navHrefs = ["#examples", "#packages", "#faq", "#support"];
  const nav = content.copy[lang].nav.map((label, i) => {
    return `<a href="${navHrefs[i]}">${k(content, lang, `nav.${i}`)}</a>`;
  }).join("");

  const strips = [0, 1, 2].map((i) => `<li>${I.check}${k(content, lang, `strip.${i}`)}</li>`).join("");

  const demos = content.demos.map((demo, i) => {
    const src = content.images[lang][demo.img];
    const alt = `${resolve(content, lang, "heroAlt")} — ${resolve(content, lang, `demos.${i}.0`)}`;
    return `<article class="demo-card">
      <img src="${src}" alt="${alt.replaceAll('"', "&quot;")}" width="460" height="995" loading="lazy" decoding="async" data-img="${demo.img}" data-alt="demos.${i}.0">
      <p class="badge">${k(content, lang, "demoBadge")}</p>
      <h3>${k(content, lang, "demoName")} · ${k(content, lang, `demos.${i}.0`)}</h3>
      <p class="fit">${k(content, lang, `demos.${i}.1`)}</p>
      <a class="demo-link" data-demo href="${content.placeholders.demoUrl.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}" target="_blank" rel="noopener">
        <span class="link-label">${k(content, lang, "demoLink")}</span>
        <span class="ph" data-ph="demoUrl">${content.placeholders.demoUrl.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>
      </a>
    </article>`;
  }).join("");

  const cards = content.packages.map((pkg, i) => {
    const featured = pkg.id === "booking";
    const feats = content.copy[lang].pk[i].feat.map((_, fi) => {
      return `<li>${I.check18}${k(content, lang, `pk.${i}.feat.${fi}`)}</li>`;
    }).join("");
    return `<article class="card${featured ? " is-featured" : ""}">
      ${featured ? `<p class="ribbon">${k(content, lang, "rec")}</p>` : ""}
      <p class="num">${k(content, lang, `pk.${i}.num`)}</p>
      <h3>${k(content, lang, `pk.${i}.title`)}</h3>
      <p class="desc">${k(content, lang, `pk.${i}.desc`)}</p>
      <p class="price">${k(content, lang, `pk.${i}.price`)}</p>
      <p class="once">${k(content, lang, "oneTime")}</p>
      <p class="usd" data-only="en"${lang === "vi" ? " hidden" : ""}>${k(content, lang, "usd")}</p>
      <div class="terms-box">
        <div class="term-row">${I.clock}<div><p class="k">${k(content, lang, "kTime")}</p><p class="v">${k(content, lang, "vTime", pkg.id)}</p></div></div>
        <div class="term-row">${I.card}<div><p class="k">${k(content, lang, "kPay")}</p><p class="v">${k(content, lang, "vPay")}</p></div></div>
      </div>
      <ul class="feats">${feats}</ul>
      <div class="card-cta">
        ${cta(content, lang, { kind: "primary", msg: pkg.id, key: "choose", scope: pkg.id, className: `btn ${featured ? "btn-accent" : "btn-outline"}`, iconName: "msg" })}
        ${cta(content, lang, { kind: "secondary", msg: pkg.id, key: "chooseAlt", className: "text-link" })}
        <p class="hint">${k(content, lang, "chooseHint")}</p>
      </div>
    </article>`;
  }).join("");

  const faqs = content.copy[lang].faq.map((_, i) => {
    const scope = i === 1 ? "faq" : "";
    return `<details${i === 0 ? " open" : ""}>
      <summary><span class="q">${k(content, lang, `faq.${i}.q`)}</span><span class="chev">${I.chev}</span></summary>
      <p>${k(content, lang, `faq.${i}.a`, scope)}</p>
    </details>`;
  }).join("");

  const terms = content.copy[lang].termsItems.map((_, i) => {
    return `<div class="term"><h3 class="term-title">${k(content, lang, `termsItems.${i}.title`)}</h3><p class="term-body">${k(content, lang, `termsItems.${i}.body`)}</p></div>`;
  }).join("");

  const support = [0, 1].map((i) => {
    const feats = content.copy[lang].sup[i].feat.map((_, fi) => `<li>${I.check18}${k(content, lang, `sup.${i}.feat.${fi}`)}</li>`).join("");
    return `<article class="support-card">
      <p class="for-line">${k(content, lang, `sup.${i}.for`)}</p>
      <h3>${k(content, lang, `sup.${i}.name`)}</h3>
      <p class="price">${k(content, lang, `sup.${i}.price`)} ${k(content, lang, `sup.${i}.per`)}</p>
      <p class="year">${k(content, lang, `sup.${i}.year`)}</p>
      <ul class="feats">${feats}</ul>
    </article>`;
  }).join("");

  const desktop = content.images[lang].desktop;
  const phone = content.images[lang].home;
  const heroAlt = resolve(content, lang, "heroAlt").replaceAll('"', "&quot;");
  const json = JSON.stringify(content).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${title.replaceAll("<", "&lt;")}</title>
<meta name="description" content="${description.replaceAll('"', "&quot;")}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="vi" href="${origin}/">
<link rel="alternate" hreflang="en" href="${origin}/en">
<link rel="alternate" hreflang="x-default" href="${origin}/">
<meta property="og:type" content="website">
<meta property="og:locale" content="${locale}">
<meta property="og:locale:alternate" content="${lang === "vi" ? "en_US" : "vi_VN"}">
<meta property="og:site_name" content="studio/digital">
<meta property="og:title" content="${title.replaceAll('"', "&quot;")}">
<meta property="og:description" content="${description.replaceAll('"', "&quot;")}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${origin}/og-vi.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${heroAlt}">
<meta name="theme-color" content="#173D35">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/manrope-vietnamese.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/bevietnampro-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/bevietnampro-400-vietnamese.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip" href="#main">${k(content, lang, "skip")}</a>
<header class="header" id="top">
  <div class="wrap header-inner">
    <a class="brand" href="#top">${k(content, lang, "brand")}</a>
    <nav class="nav-desktop" aria-label="${resolve(content, lang, "navLabel").replaceAll('"', "&quot;")}">${nav}</nav>
    <a class="nav-prices" href="#packages">${k(content, lang, "hdrPrices")}</a>
    <div class="header-actions">
      <a class="lang" id="lang-switch" href="${other === "en" ? "/en" : "/"}" hreflang="${other}">${k(content, lang, "langBtn")}</a>
      ${cta(content, lang, { kind: "primary", msg: "general", key: "hdrCta", className: "btn btn-accent header-cta", iconName: "msg" })}
    </div>
  </div>
</header>
<main id="main">
  <section class="hero on-dark">
    <div class="wrap hero-grid">
      <div>
        <p class="overline">${k(content, lang, "eyebrow")}</p>
        <h1>${k(content, lang, "h1")}</h1>
        <p class="sub">${k(content, lang, "sub")}</p>
        <p class="price-chip">${k(content, lang, "priceLine")}</p>
        <div class="hero-actions">
          ${cta(content, lang, { kind: "primary", msg: "general", key: "heroCta", className: "btn btn-gold", iconName: "msg" })}
          <a class="btn btn-ghost" href="#packages">${k(content, lang, "heroCta2")}</a>
        </div>
        <ul class="strip">${strips}</ul>
      </div>
      <div class="hero-art">
        <picture>
          <source media="(min-width: 1200px)" srcset="${desktop}" type="image/webp" data-img="desktop">
          <img class="browser" alt="${heroAlt}" width="1000" height="625" decoding="async" data-hero="1" data-img="desktop" data-alt="hero" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
        </picture>
        <picture>
          <source media="(min-width: 1200px)" srcset="${phone}" type="image/webp" data-img="home">
          <img class="phone" alt="${heroAlt}" width="460" height="995" decoding="async" data-hero="1" data-img="home" data-alt="hero" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
        </picture>
      </div>
    </div>
  </section>
  <section class="section" id="examples">
    <div class="wrap">
      <div class="head">
        <p class="overline">${k(content, lang, "demoOver")}</p>
        <h2>${k(content, lang, "demoTitle")}</h2>
        <p class="lead">${k(content, lang, "demoLead")}</p>
      </div>
      <div class="scroller">${demos}</div>
      <p class="swipe">${k(content, lang, "swipe")}</p>
      <p class="note">${k(content, lang, "demoNote")}</p>
    </div>
  </section>
  <section class="section" id="packages">
    <div class="wrap">
      <div class="head">
        <p class="overline">${k(content, lang, "pkOver")}</p>
        <h2>${k(content, lang, "pkTitle")}</h2>
        <p class="lead">${k(content, lang, "pkLead")}</p>
      </div>
      <div class="cards">${cards}</div>
    </div>
  </section>
  <section class="section" id="compare">
    <div class="wrap">
      <div class="head">
        <p class="overline">${k(content, lang, "cmpOver")}</p>
        <h2>${k(content, lang, "cmpTitle")}</h2>
      </div>
      <div class="cmp-mobile">
        <div class="seg" role="tablist" aria-label="${resolve(content, lang, "cmpTitle").replaceAll('"', "&quot;")}">
          <button type="button" role="tab" id="tab-start" aria-selected="false" tabindex="-1" aria-controls="cmp-panel">Start</button>
          <button type="button" role="tab" id="tab-booking" aria-selected="true" tabindex="0" aria-controls="cmp-panel">Booking</button>
          <button type="button" role="tab" id="tab-premium" aria-selected="false" tabindex="-1" aria-controls="cmp-panel">Premium</button>
        </div>
        <div id="cmp-panel" role="tabpanel" aria-labelledby="tab-booking">${renderCompareMobile(content, lang, 1)}</div>
        <p class="note">${k(content, lang, "cmpHint")}</p>
      </div>
      <div class="cmp-table" id="cmp-table">${renderCompareTable(content, lang)}</div>
      <p class="note">${k(content, lang, "cmpNote")}</p>
    </div>
  </section>
  <section class="section" id="person">
    <div class="wrap">
      <p class="overline">${k(content, lang, "meOver")}</p>
      <article class="person">
        <div class="person-top">
          <div class="mono" aria-hidden="true">A</div>
          <div>
            <h2>${k(content, lang, "meName")}</h2>
            <p class="role">${k(content, lang, "meRole")}</p>
            <p class="city">${I.pin}${k(content, lang, "meCity")}</p>
          </div>
        </div>
        <p class="me-text">${k(content, lang, "meText")}</p>
        ${cta(content, lang, { kind: "primary", msg: "general", key: "meBtn", className: "btn btn-accent", iconName: "msg" })}
        <p class="me-num">${k(content, lang, "meNum")}</p>
      </article>
    </div>
  </section>
  <section class="section" id="faq">
    <div class="wrap">
      <p class="overline">${k(content, lang, "faqOver")}</p>
      <h2>${k(content, lang, "faqTitle")}</h2>
      <div class="faq-list">${faqs}</div>
      <details class="terms">
        <summary>
          <span><span class="q">${k(content, lang, "terms")}</span><span class="terms-sub">${k(content, lang, "termsSub")}</span></span>
          <span class="chev">${I.chev}</span>
        </summary>
        ${terms}
      </details>
    </div>
  </section>
  <section class="cta on-dark" id="cta">
    <div class="wrap">
      <div>
        <p class="overline">${k(content, lang, "ctaOver")}</p>
        <h2>${k(content, lang, "ctaTitle")}</h2>
        <p class="cta-text">${k(content, lang, "ctaText")}</p>
      </div>
      <div class="cta-actions">
        ${cta(content, lang, { kind: "primary", msg: "general", key: "ctaMsg", className: "btn btn-gold", iconName: "msg" })}
        ${cta(content, lang, { kind: "secondary", msg: "general", key: "ctaMsg2", className: "btn btn-ghost", iconName: "msg" })}
        ${cta(content, lang, { kind: "tel", msg: "general", key: "ctaCall", className: "btn btn-ghost", iconName: "phone" })}
        ${cta(content, lang, { kind: "copy", msg: "general", key: "ctaCopy", className: "copy-link", iconName: "copy" })}
      </div>
    </div>
  </section>
  <section class="section" id="support">
    <div class="wrap">
      <div class="head">
        <p class="overline">${k(content, lang, "supOver")}</p>
        <h2>${k(content, lang, "supTitle")}</h2>
        <p class="lead">${k(content, lang, "supLead")}</p>
      </div>
      <div class="support-grid">${support}</div>
      <p class="note">${k(content, lang, "supNote")}</p>
      <div class="extra">
        <div><strong>${k(content, lang, "extra")}</strong><p>${k(content, lang, "extraNote")}</p></div>
        <p class="price">${k(content, lang, "extraPrice")}</p>
      </div>
    </div>
  </section>
</main>
<footer class="footer on-dark">
  <div class="wrap">
    <a class="brand" href="#top">${k(content, lang, "brand")}</a>
    <p>${k(content, lang, "ftLine")}</p>
    <p>${k(content, lang, "ftTag")}</p>
    <p>${k(content, lang, "ftCopy")}</p>
  </div>
</footer>
<div class="bar" role="region" aria-label="${resolve(content, lang, "barLabel").replaceAll('"', "&quot;")}">
  ${cta(content, lang, { kind: "primary", msg: "general", key: "barMsg", className: "btn btn-accent", iconName: "msg" })}
  ${cta(content, lang, { kind: "tel", msg: "general", key: "barCall", className: "btn btn-outline", iconName: "phone" })}
</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<dialog id="copy-dialog" class="modal">
  <h2>${k(content, lang, "modalTitle")}</h2>
  <p>${k(content, lang, "modalHint")}</p>
  <textarea id="copy-text" readonly></textarea>
  <div class="modal-actions">
    <button type="button" id="copy-close" class="btn btn-outline">${k(content, lang, "modalClose")}</button>
    <a id="copy-open" class="btn btn-accent" target="_blank" rel="noopener" hidden>${k(content, lang, "modalOpen")}</a>
  </div>
</dialog>
<script id="site-content" type="application/json">${json}</script>
<script type="module" src="/main.js"></script>
</body>
</html>
`;
}
