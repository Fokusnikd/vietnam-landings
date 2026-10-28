import { rich, resolve, renderCompareMobile, renderCompareTable, messageUrls, channelFor } from "./text.js";

const content = JSON.parse(document.getElementById("site-content").textContent);
let lang = document.documentElement.lang === "en" ? "en" : "vi";
let compareIndex = 1;
let toastTimer = 0;

function text(key, scope) {
  return resolve(content, lang, key, scope);
}

function apply(next) {
  lang = next === "en" ? "en" : "vi";
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-k]").forEach((el) => {
    el.innerHTML = rich(text(el.dataset.k, el.dataset.scope || ""));
  });
  document.querySelectorAll("[data-only]").forEach((el) => {
    el.hidden = el.dataset.only !== lang;
  });
  document.querySelectorAll("[data-ph]").forEach((el) => {
    const value = content.placeholders[el.dataset.ph] || "";
    el.textContent = value;
  });
  document.querySelectorAll("[data-demo]").forEach((el) => {
    el.setAttribute("href", content.placeholders.demoUrl);
  });
  document.querySelectorAll("img[data-img]").forEach((img) => {
    if (img.dataset.hero && !window.matchMedia("(min-width: 1200px)").matches) return;
    const src = content.images[lang][img.dataset.img];
    if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
  });
  document.querySelectorAll("source[data-img]").forEach((source) => {
    source.srcset = content.images[lang][source.dataset.img];
  });
  document.querySelectorAll("[data-alt]").forEach((img) => {
    const heroAlt = text("heroAlt");
    img.alt = img.dataset.alt === "hero" ? heroAlt : `${heroAlt} — ${text(img.dataset.alt)}`;
  });
  document.querySelectorAll("[data-cta]").forEach((el) => {
    const kind = el.dataset.cta;
    const msgKey = el.dataset.msg || "general";
    const channel = channelFor(kind, lang);
    const message = content.messages[lang][msgKey];
    const urls = messageUrls(content.placeholders.phones, message);
    el.dataset.channel = channel;
    el.dataset.message = message;
    if (channel === "zalo" || channel === "whatsapp") {
      el.target = "_blank";
      el.rel = "noopener";
      el.setAttribute("href", urls[channel]);
    } else if (channel === "tel") {
      el.removeAttribute("target");
      el.setAttribute("href", urls.tel);
    } else {
      el.removeAttribute("target");
      el.setAttribute("href", "#cta");
    }
  });
  const title = text("title");
  document.title = title;
  const description = text("description");
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:locale", lang === "vi" ? "vi_VN" : "en_US");
  const canonical = `${content.origin}${lang === "en" ? "/en" : "/"}`;
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) canonicalLink.href = canonical;
  setMeta("property", "og:url", canonical);
  const switcher = document.getElementById("lang-switch");
  switcher.href = lang === "en" ? "/" : "/en";
  switcher.hreflang = lang === "en" ? "vi" : "en";
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) tablist.setAttribute("aria-label", text("cmpTitle"));
  const bar = document.querySelector(".bar");
  if (bar) bar.setAttribute("aria-label", text("barLabel"));
  const nav = document.querySelector(".nav-desktop");
  if (nav) nav.setAttribute("aria-label", text("navLabel"));
  paintCompare();
}

function setMeta(attr, name, value) {
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.setAttribute("content", value);
}

function paintCompare() {
  const panel = document.getElementById("cmp-panel");
  if (panel) panel.innerHTML = renderCompareMobile(content, lang, compareIndex);
  const table = document.getElementById("cmp-table");
  if (table) table.innerHTML = renderCompareTable(content, lang);
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    const on = index === compareIndex;
    tab.setAttribute("aria-selected", on ? "true" : "false");
    tab.tabIndex = on ? 0 : -1;
  });
  const current = tabs[compareIndex];
  if (current && panel) panel.setAttribute("aria-labelledby", current.id);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function showModal(message, url) {
  const dialog = document.getElementById("copy-dialog");
  const area = document.getElementById("copy-text");
  const open = document.getElementById("copy-open");
  area.value = message;
  if (url) {
    open.hidden = false;
    open.setAttribute("href", url);
  } else {
    open.hidden = true;
    open.removeAttribute("href");
  }
  if (!dialog.open) dialog.showModal();
  area.focus();
  area.select();
}

function track(detail) {
  window.dispatchEvent(new CustomEvent("cta_click", { detail }));
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: "cta_click", ...detail });
}

async function copyText(message) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("clipboard-unavailable");
  await navigator.clipboard.writeText(message);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-cta]");
  if (!link) return;
  const channel = link.dataset.channel;
  const message = link.dataset.message || "";
  const detail = {
    channel,
    package: link.dataset.msg && link.dataset.msg !== "general" ? content.packageNames[link.dataset.msg] : "",
    lang,
    place: link.closest("header") ? "header"
      : link.closest(".hero") ? "hero"
      : link.closest(".bar") ? "bar"
      : link.closest(".card") ? "packages"
      : link.closest(".person") ? "person"
      : link.closest(".cta") ? "cta"
      : "page"
  };
  track(detail);
  if (channel === "whatsapp" || channel === "tel") return;
  event.preventDefault();
  if (channel === "copy") {
    copyText(message).then(() => showToast(text("toastCopy"))).catch(() => showModal(message, null));
    return;
  }
  if (channel === "zalo") {
    const url = link.getAttribute("href");
    copyText(message).then(() => {
      showToast(text("toastZalo"));
      const opened = window.open(url, "_blank", "noopener");
      if (!opened) showModal(message, url);
    }).catch(() => showModal(message, url));
  }
});

document.getElementById("lang-switch").addEventListener("click", (event) => {
  event.preventDefault();
  const next = lang === "vi" ? "en" : "vi";
  try { localStorage.setItem("lang", next); } catch { /* storage may be blocked */ }
  apply(next);
  const path = next === "en" ? "/en" : "/";
  if (location.pathname !== path) history.pushState({ lang: next }, "", path);
});

document.querySelectorAll('[role="tab"]').forEach((tab, index) => {
  tab.addEventListener("click", () => {
    compareIndex = index;
    paintCompare();
    tab.focus();
  });
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const last = 2;
    if (event.key === "Home") compareIndex = 0;
    else if (event.key === "End") compareIndex = last;
    else compareIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
    paintCompare();
    document.querySelectorAll('[role="tab"]')[compareIndex].focus();
  });
});

document.getElementById("copy-close").addEventListener("click", () => {
  document.getElementById("copy-dialog").close();
});

window.addEventListener("popstate", () => {
  const next = location.pathname === "/en" || location.pathname.startsWith("/en/") ? "en" : "vi";
  try { localStorage.setItem("lang", next); } catch { /* ignore */ }
  apply(next);
});

function detect() {
  const query = new URLSearchParams(location.search).get("lang");
  if (query === "vi" || query === "en") return { lang: query, persist: true };
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "vi" || saved === "en") return { lang: saved, persist: false };
  } catch { /* ignore */ }
  if (location.pathname === "/en" || location.pathname.startsWith("/en/")) return { lang: "en", persist: false };
  if (/^en/i.test(navigator.language || "")) return { lang: "en", persist: false };
  return { lang: "vi", persist: false };
}

const choice = detect();
if (choice.persist) {
  try { localStorage.setItem("lang", choice.lang); } catch { /* ignore */ }
}
apply(choice.lang);
if (choice.lang === "en" && location.pathname !== "/en" && !location.pathname.startsWith("/en/")) {
  history.replaceState({ lang: "en" }, "", "/en");
}
if (choice.lang === "vi" && (location.pathname === "/en" || location.pathname.startsWith("/en/"))) {
  history.replaceState({ lang: "vi" }, "", "/");
}
