#!/usr/bin/env node
// VAPID鍵ペア生成（P-256 / ECDSA）。
// 出力:
//   - apps/web/.vapid-public-key.txt  : フロントが触る公開鍵 (base64url)
//   - apps/worker/.vapid.json         : 秘密鍵保管（コミット禁止）
//
// 鍵設置後の手順:
//   1) apps/web/.env.local に VITE_VAPID_PUBLIC_KEY=<公開鍵>
//   2) wrangler secret put VAPID_PRIVATE_KEY  (apps/worker/) → .vapid.json から貼り付け
//   3) wrangler secret put VAPID_PUBLIC_KEY  (同上)
//   4) wrangler secret put VAPID_SUBJECT     値: mailto:8810hhayato@gmail.com
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROJECT = path.resolve(__dirname, "..");

function b64url(buf) {
    return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

// 公開鍵 (uncompressed 65 bytes = 0x04 + X(32) + Y(32))
const pubRaw = publicKey.export({ format: "jwk" });
const x = Buffer.from(pubRaw.x, "base64");
const y = Buffer.from(pubRaw.y, "base64");
const pubUncompressed = Buffer.concat([Buffer.from([0x04]), x, y]);
const publicKeyB64 = b64url(pubUncompressed);

// 秘密鍵 (raw 32 bytes)
const privRaw = privateKey.export({ format: "jwk" });
const d = Buffer.from(privRaw.d, "base64");
const privateKeyB64 = b64url(d);

const webDir = path.join(PROJECT, "apps/web");
const workerDir = path.join(PROJECT, "apps/worker");
fs.writeFileSync(path.join(webDir, ".vapid-public-key.txt"), publicKeyB64 + "\n");
fs.writeFileSync(
    path.join(workerDir, ".vapid.json"),
    JSON.stringify({ publicKey: publicKeyB64, privateKey: privateKeyB64, subject: "mailto:8810hhayato@gmail.com" }, null, 2) + "\n",
);

console.log("✔ VAPID鍵生成完了");
console.log(`  公開鍵 (apps/web/.vapid-public-key.txt): ${publicKeyB64.slice(0, 24)}...`);
console.log(`  秘密鍵 (apps/worker/.vapid.json): [hidden]`);
console.log("");
console.log("次にやる:");
console.log("  1) echo 'VITE_VAPID_PUBLIC_KEY=" + publicKeyB64 + "' > apps/web/.env.local");
console.log("  2) cd apps/worker && wrangler secret put VAPID_PRIVATE_KEY    # apps/worker/.vapid.json から");
console.log("  3) cd apps/worker && wrangler secret put VAPID_PUBLIC_KEY");
console.log("  4) cd apps/worker && wrangler secret put VAPID_SUBJECT        # mailto:8810hhayato@gmail.com");
