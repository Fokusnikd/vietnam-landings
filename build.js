import fs from "node:fs";
import path from "node:path";
import { renderPage } from "./src/render.js";

const root = import.meta.dirname;
const dist = path.join(root, "dist");
const content = JSON.parse(fs.readFileSync(path.join(root, "content.json"), "utf8"));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.mkdirSync(path.join(dist, "en"), { recursive: true });

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

for (const name of ["styles.css", "main.js", "text.js"]) {
  copyFile(path.join(root, "src", name), path.join(dist, name));
}
for (const name of fs.readdirSync(path.join(root, "fonts"))) {
  copyFile(path.join(root, "fonts", name), path.join(dist, "fonts", name));
}
for (const name of ["og-vi.jpg", "og-vi.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png", "icon.svg"]) {
  copyFile(path.join(root, "assets", name), path.join(dist, name));
}
copyFile(path.join(root, "assets/favicon-32.png"), path.join(dist, "favicon.ico"));
for (const name of fs.readdirSync(path.join(root, "assets/renders"))) {
  if (name.includes("nophoto")) continue;
  copyFile(path.join(root, "assets/renders", name), path.join(dist, "renders", name));
}

const vi = renderPage(content, "vi");
const en = renderPage(content, "en");
fs.writeFileSync(path.join(dist, "index.html"), vi);
fs.writeFileSync(path.join(dist, "en/index.html"), en);
fs.writeFileSync(path.join(dist, "site.webmanifest"), JSON.stringify({
  name: "studio/digital",
  short_name: "studio/digital",
  icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  display: "standalone",
  background_color: "#173D35",
  theme_color: "#173D35",
  lang: "vi",
  start_url: "/"
}, null, 2));

const required = [
  "noindex",
  'hreflang="vi"',
  'hreflang="en"',
  'rel="canonical"',
  "&lt;N&gt;",
  "&lt;X–Y&gt;",
  "&lt;ZALO_PHONE&gt;",
  "&lt;WA_PHONE&gt;",
  "&lt;PHONE&gt;",
  "&lt;URL demo&gt;"
];
const viOnly = ["&lt;điều khoản thanh toán&gt;", "&lt;thời gian phản hồi&gt;", "&lt;Thành phố làm việc&gt;", "&lt;số điện thoại&gt;", "Gói: Start (4.000.000 ₫)", "Gói: Booking (6.500.000 ₫)", "Gói: Premium (12.000.000 ₫)"];
const enOnly = ["&lt;payment terms&gt;", "&lt;response time&gt;", "&lt;City&gt;", "&lt;phone number&gt;", "&lt;…&gt;", "Package: Start (4,000,000 VND)", "Package: Booking (6,500,000 VND)", "Package: Premium (12,000,000 VND)"];

function assertIncludes(html, needles, label) {
  for (const needle of needles) {
    if (!html.includes(needle)) throw new Error(`${label} is missing ${needle}`);
  }
}
assertIncludes(vi, required.concat(viOnly), "VI");
assertIncludes(en, required.concat(enOnly), "EN");
const visible = (html) => html.replace(/<script id="site-content"[\s\S]*$/, "");
if (visible(vi).includes("≈ US$")) throw new Error("VI page shows a US$ line");
if (!visible(en).includes("≈ US$")) throw new Error("EN page is missing the US$ placeholder");
if (/zalo\.me\/\d|wa\.me\/\d|tel:\+?\d/.test(vi + en)) {
  throw new Error("A real phone number leaked into a CTA href");
}
console.log("Built dist/index.html and dist/en/index.html");
