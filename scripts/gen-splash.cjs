#!/usr/bin/env node
// iOS Safari「ホーム画面に追加」用のapple-touch-startup-imageを生成する。
// 主要4世代をカバー（iPhone SE/13/13 Pro/15 Pro Max）。
// 生成物: apps/web/public/splash/*.png
const path = require("path");
const fs = require("fs");

const sharpPath = path.join(
    "/tmp/mochi-uv-build/node_modules/.pnpm/sharp@0.33.5/node_modules/sharp",
);
const sharp = require(sharpPath);

const PROJECT = path.resolve(__dirname, "..");
const OUT = path.join(PROJECT, "apps/web/public/splash");
fs.mkdirSync(OUT, { recursive: true });

// CSSポイント基準 × devicePixelRatio
const DEVICES = [
    { name: "iphone-se",          w: 750,  h: 1334, cssW: 375, cssH: 667,  dpr: 2 },
    { name: "iphone-13-mini",     w: 1125, h: 2436, cssW: 375, cssH: 812,  dpr: 3 },
    { name: "iphone-13",          w: 1170, h: 2532, cssW: 390, cssH: 844,  dpr: 3 },
    { name: "iphone-13-pro-max",  w: 1284, h: 2778, cssW: 428, cssH: 926,  dpr: 3 },
    { name: "iphone-15-pro-max",  w: 1290, h: 2796, cssW: 430, cssH: 932,  dpr: 3 },
    { name: "ipad",               w: 1536, h: 2048, cssW: 768, cssH: 1024, dpr: 2 },
];

function splashSvg(w, h) {
    const cx = w / 2;
    const cy = h / 2 - h * 0.04;
    const charSize = Math.min(w, h) * 0.32;
    const scale = charSize / 120;
    const tx = cx - 60 * scale;
    const ty = cy - 60 * scale;
    const titleY = cy + charSize / 2 + h * 0.05;
    const titleSize = w * 0.07;
    const subSize = w * 0.034;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%">
      <stop offset="0%" stop-color="#FFE9EE"/>
      <stop offset="60%" stop-color="#FFF5EC"/>
      <stop offset="100%" stop-color="#FFF7F9"/>
    </radialGradient>
    <radialGradient id="body" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#FFF5EC"/>
      <stop offset="100%" stop-color="#FFE9EE"/>
    </radialGradient>
    <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFB6C1" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFB6C1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFB6C1"/>
      <stop offset="100%" stop-color="#FF95A6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <ellipse cx="60" cy="108" rx="28" ry="4" fill="#000" opacity="0.08"/>
    <path d="M60 22 C 92 22, 102 50, 102 72 C 102 96, 84 108, 60 108
             C 36 108, 18 96, 18 72 C 18 50, 28 22, 60 22 Z"
          fill="url(#body)" stroke="#FFD2DC" stroke-width="1.5"/>
    <ellipse cx="60" cy="30" rx="36" ry="8" fill="url(#hat)"/>
    <path d="M30 30 Q60 6, 90 30 L90 32 Q60 12, 30 32 Z" fill="url(#hat)"/>
    <circle cx="60" cy="14" r="4" fill="#E8C28A"/>
    <ellipse cx="40" cy="68" rx="9" ry="6" fill="url(#cheek)"/>
    <ellipse cx="80" cy="68" rx="9" ry="6" fill="url(#cheek)"/>
    <path d="M44 62 Q48 58, 52 62" stroke="#4A3540" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M68 62 Q72 58, 76 62" stroke="#4A3540" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M52 78 Q60 86, 68 78" stroke="#4A3540" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
  <text x="${cx}" y="${titleY}" font-size="${titleSize}" font-weight="700" text-anchor="middle"
        fill="#4A3540" font-family="Hiragino Maru Gothic ProN, system-ui, sans-serif">mochi UV</text>
  <text x="${cx}" y="${titleY + titleSize * 0.95}" font-size="${subSize}" text-anchor="middle"
        fill="#4A3540" opacity="0.55" font-family="Hiragino Maru Gothic ProN, system-ui, sans-serif">もちもち肌を守る</text>
</svg>`;
}

(async () => {
    const links = [];
    for (const d of DEVICES) {
        const portrait = splashSvg(d.w, d.h);
        const portraitPath = path.join(OUT, `${d.name}-portrait.png`);
        await sharp(Buffer.from(portrait)).png().toFile(portraitPath);
        const sz = fs.statSync(portraitPath).size;
        console.log(`✔ ${d.name}-portrait.png ${d.w}x${d.h} (${(sz / 1024).toFixed(1)}KB)`);
        links.push(
            `<link rel="apple-touch-startup-image" href="/splash/${d.name}-portrait.png" media="(device-width: ${d.cssW}px) and (device-height: ${d.cssH}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)" />`,
        );
    }
    fs.writeFileSync(path.join(OUT, "_links.html"), links.join("\n"));
    console.log("\n✨ splash images & _links.html generated");
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
