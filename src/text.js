export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

export function rich(value) {
  return escapeHtml(value)
    .replace(/\n/g, "<br>")
    .replace(/&lt;[^&]*?&gt;/g, (token) => `<span class="ph">${token}</span>`);
}

export function lookup(obj, path) {
  return path.split(".").reduce((node, key) => (node == null ? node : node[key]), obj);
}

export function tokenMap(content, lang, scope) {
  const ph = content.placeholders;
  const names = content.packageNames;
  return {
    days: ph.days,
    payment: ph.payment[lang],
    usd: ph.usd,
    response: ph.response[lang],
    city: ph.city[lang],
    phone: ph.phoneShown[lang],
    timeline: (scope && ph.timeline[scope]) || ph.timeline.faq,
    demoUrl: ph.demoUrl,
    name: (scope && names[scope]) || ""
  };
}

export function interpolate(template, map) {
  return String(template)
    .replaceAll("{gói}", map.name || "")
    .replaceAll("{package}", map.name || "")
    .replace(/\{(\w+)\}/g, (_, key) => (Object.prototype.hasOwnProperty.call(map, key) ? map[key] : `{${key}}`));
}

export function resolve(content, lang, path, scope) {
  const raw = lookup(content.copy[lang], path);
  if (typeof raw !== "string") return "";
  return interpolate(raw, tokenMap(content, lang, scope));
}

export function messageUrls(phones, message) {
  return {
    zalo: `https://zalo.me/${phones.zalo}`,
    whatsapp: `https://wa.me/${phones.whatsapp}?text=${encodeURIComponent(message)}`,
    tel: `tel:${phones.phone}`
  };
}

export function channelFor(kind, lang) {
  if (kind === "primary") return lang === "en" ? "whatsapp" : "zalo";
  if (kind === "secondary") return lang === "en" ? "zalo" : "whatsapp";
  return kind;
}

const ICONS = {
  check: `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false"><path d="M15 4.5L6.75 12.75L3 9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  minus: `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false"><path d="M3.75 9H14.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
};

function cell(content, lang, value) {
  const copy = content.copy[lang];
  if (value === "1") return `<span class="mark yes">${ICONS.check}<span>${escapeHtml(copy.yes)}</span></span>`;
  if (value === "0") return `<span class="mark no">${ICONS.minus}<span>${escapeHtml(copy.no)}</span></span>`;
  return `<span class="mark num">${escapeHtml(value)}</span>`;
}

export function renderCompareMobile(content, lang, active) {
  const copy = content.copy[lang];
  const pkg = content.packages[active];
  const rows = copy.compare.map((row) => {
    return `<div class="cmp-row"><span>${escapeHtml(row.label)}</span>${cell(content, lang, row.values[active])}</div>`;
  }).join("");
  return `<div class="cmp-summary"><strong>${escapeHtml(pkg.name)}</strong><span>${escapeHtml(pkg.price[lang])}</span></div><div class="cmp-sheet">${rows}</div>`;
}

export function renderCompareTable(content, lang) {
  const copy = content.copy[lang];
  const heads = content.packages.map((pkg, index) => {
    const cls = index === 1 ? "is-booking" : "";
    return `<th scope="col" class="${cls}">${escapeHtml(pkg.name)}<span class="th-price">${escapeHtml(pkg.price[lang])}</span></th>`;
  }).join("");
  const body = copy.compare.map((row) => {
    const cells = row.values.map((value, index) => {
      const cls = index === 1 ? "is-booking" : "";
      return `<td class="${cls}">${cell(content, lang, value)}</td>`;
    }).join("");
    return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
  }).join("");
  return `<table><thead><tr><th scope="col">${escapeHtml(copy.cmpFeature)}</th>${heads}</tr></thead><tbody>${body}</tbody></table>`;
}
