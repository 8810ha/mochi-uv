#!/usr/bin/env node
// PWAアイコン・OGP画像を生成する。
// sharpは /tmp/mochi-uv-build/node_modules/.pnpm/sharp@VERSION/node_modules/sharp に存在する想定。
// 生成物（apps/web/public/ 配下）:
//   - icon-192.png       192x192 通常アイコン
//   - icon-512.png       512x512 通常アイコン
//   - icon-192-mask.png  192x192 maskable（セーフゾーン80%）
//   - icon-512-mask.png  512x512 maskable
//   - apple-touch-icon.png 180x180 iOS
//   - og-image.png       1200x630 OGP
//   - favicon-32.png     32x32 ファビコン
const path = require("path");
const fs = require("fs");

const sharpPath = path.join(
    "/tmp/mochi-uv-build/node_modules/.pnpm/sharp@0.33.5/node_modules/sharp",
);
const sharp = require(sharpPath);

const PROJECT = path.resolve(__dirname, "..");
const PUBLIC = path.join(PROJECT, "apps/web/public");
fs.mkdirSync(PUBLIC, { recursive: true });

const COLORS = {
    bgFrom: "#FFD2DC",
    bgTo: "#E8C28A",
    bodyLight: "#FFFFFF",
    bodyShadow: "#FFE9EE",
    bodyEdge: "#FFD2DC",
    hat: "#FFB6C1",
    hatDeep: "#FF95A6",
    accent: "#E8C28A",
    cheek: "#FFB6C1",
    ink: "#4A3540",
};

/** もちうび本体のSVG（顔は happy=塗りたて状態） */
function mochiSvg({ width, height, padding = 0.12, withBg = true, ogText = null }) {
    const cx = width / 2;
    const cy = height / 2;
    const scale = (Math.min(width, height) * (1 - padding * 2)) / 120;
    const tx = cx - 60 * scale;
    const ty = cy - 60 * scale;
    const bg = withBg
        ? `<rect width="${width}" height="${height}" fill="url(#bg)"/>`
        : "";
    const og = ogText
        ? `<g font-family="Hiragino Maru Gothic ProN, system-ui, sans-serif">
              <text x="${cx}" y="${height - 80}" font-size="56" font-weight="700"
                    text-anchor="middle" fill="${COLORS.ink}">${ogText.title}</text>
              <text x="${cx}" y="${height - 32}" font-size="24"
                    text-anchor="middle" fill="${COLORS.ink}" opacity="0.7">${ogText.sub}</text>
           </g>`
        : "";

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.bgFrom}"/>
      <stop offset="100%" stop-color="${COLORS.bgTo}"/>
    </linearGradient>
    <radialGradient id="body" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${COLORS.bodyLight}"/>
      <stop offset="70%" stop-color="#FFF5EC"/>
      <stop offset="100%" stop-color="${COLORS.bodyShadow}"/>
    </radialGradient>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${COLORS.cheek}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${COLORS.cheek}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.hat}"/>
      <stop offset="100%" stop-color="${COLORS.hatDeep}"/>
    </linearGradient>
  </defs>
  ${bg}
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <ellipse cx="60" cy="108" rx="28" ry="4" fill="#000" opacity="0.08"/>
    <path d="M60 22 C 92 22, 102 50, 102 72 C 102 96, 84 108, 60 108
             C 36 108, 18 96, 18 72 C 18 50, 28 22, 60 22 Z"
          fill="url(#body)" stroke="${COLORS.bodyEdge}" stroke-width="1.5"/>
    <ellipse cx="60" cy="30" rx="36" ry="8" fill="url(#hat)"/>
    <path d="M30 30 Q60 6, 90 30 L90 32 Q60 12, 30 32 Z" fill="url(#hat)"/>
    <circle cx="60" cy="14" r="4" fill="${COLORS.accent}"/>
    <ellipse cx="40" cy="68" rx="9" ry="6" fill="url(#cheek)"/>
    <ellipse cx="80" cy="68" rx="9" ry="6" fill="url(#cheek)"/>
    <path d="M44 62 Q48 58, 52 62" stroke="${COLORS.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M68 62 Q72 58, 76 62" stroke="${COLORS.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M52 78 Q60 86, 68 78" stroke="${COLORS.ink}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
  ${og}
</svg>`;
}

async function render(name, opts) {
    const svg = mochiSvg(opts);
    const buf = Buffer.from(svg);
    const out = path.join(PUBLIC, name);
    await sharp(buf).png().toFile(out);
    const s = fs.statSync(out);
    console.log(`✔ ${name} (${(s.size / 1024).toFixed(1)}KB, ${opts.width}x${opts.height})`);
}

(async () => {
    await render("icon-192.png", { width: 192, height: 192, padding: 0.08 });
    await render("icon-512.png", { width: 512, height: 512, padding: 0.08 });
    // maskable: safe zoneを大きく取る（80%）
    await render("icon-192-mask.png", { width: 192, height: 192, padding: 0.18 });
    await render("icon-512-mask.png", { width: 512, height: 512, padding: 0.18 });
    await render("apple-touch-icon.png", { width: 180, height: 180, padding: 0.06 });
    await render("favicon-32.png", { width: 32, height: 32, padding: 0.04 });
    await render("og-image.png", {
        width: 1200,
        height: 630,
        padding: 0.32,
        ogText: { title: "mochi UV", sub: "もちもち肌を守る、日焼け止めリマインダー" },
    });
    console.log("\n✨ all icons generated in apps/web/public/");
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
