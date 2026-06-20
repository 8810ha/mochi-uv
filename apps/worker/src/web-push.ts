// 最小のWeb Push実装（Workers Runtime / Web Crypto API）。
// VAPID JWT (ES256) + Aes128Gcm メッセージ暗号化（RFC 8291）。
// 簡略: aesgcm に頼らず "aes128gcm" コンテンツコーディングを使う。

interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

interface VapidConfig {
    publicKey: string;
    privateKey: string;
    subject: string;
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < u8.byteLength; i += 1) bin += String.fromCharCode(u8[i]);
    return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Uint8Array {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const bin = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) u8[i] = bin.charCodeAt(i);
    return u8;
}

async function importEcdsaSigningKey(privateKeyB64: string, publicKeyB64: string): Promise<CryptoKey> {
    const d = b64urlDecode(privateKeyB64);
    const pubRaw = b64urlDecode(publicKeyB64);
    // pubRaw: 0x04 + X(32) + Y(32)
    const x = pubRaw.slice(1, 33);
    const y = pubRaw.slice(33, 65);
    const jwk: JsonWebKey = {
        kty: "EC",
        crv: "P-256",
        d: b64urlEncode(d),
        x: b64urlEncode(x),
        y: b64urlEncode(y),
        ext: true,
    };
    return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function importP256SubKey(p256dhB64: string): Promise<CryptoKey> {
    const raw = b64urlDecode(p256dhB64);
    const x = raw.slice(1, 33);
    const y = raw.slice(33, 65);
    return crypto.subtle.importKey(
        "jwk",
        { kty: "EC", crv: "P-256", x: b64urlEncode(x), y: b64urlEncode(y), ext: true },
        { name: "ECDH", namedCurve: "P-256" },
        true,
        [],
    );
}

async function generateEphemeralEcdh(): Promise<{
    privateKey: CryptoKey;
    publicKeyRaw: Uint8Array;
}> {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const pubJwk = (await crypto.subtle.exportKey("jwk", kp.publicKey)) as JsonWebKey;
    const x = b64urlDecode(pubJwk.x!);
    const y = b64urlDecode(pubJwk.y!);
    const pub = new Uint8Array(65);
    pub[0] = 0x04;
    pub.set(x, 1);
    pub.set(y, 33);
    return { privateKey: kp.privateKey, publicKeyRaw: pub };
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
    return new Uint8Array(bits);
}

async function vapidJwt(audience: string, cfg: VapidConfig): Promise<string> {
    const header = b64urlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
    const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
    const payload = b64urlEncode(
        new TextEncoder().encode(JSON.stringify({ aud: audience, exp, sub: cfg.subject })),
    );
    const signingInput = `${header}.${payload}`;
    const key = await importEcdsaSigningKey(cfg.privateKey, cfg.publicKey);
    const sig = await crypto.subtle.sign(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        key,
        new TextEncoder().encode(signingInput),
    );
    return `${signingInput}.${b64urlEncode(sig)}`;
}

async function encryptAes128Gcm(
    sub: PushSubscription,
    payload: Uint8Array,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; ephPub: Uint8Array }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const eph = await generateEphemeralEcdh();
    const userPub = await importP256SubKey(sub.keys.p256dh);
    const sharedBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: userPub },
        eph.privateKey,
        256,
    );
    const ecdhSecret = new Uint8Array(sharedBits);
    const authSecret = b64urlDecode(sub.keys.auth);
    const userPubRaw = b64urlDecode(sub.keys.p256dh);

    // Step 1: PRK = HKDF(authSecret, ecdhSecret, "WebPush: info\0" + ua_pub + as_pub, 32)
    const keyInfoPrefix = new TextEncoder().encode("WebPush: info\0");
    const keyInfo = new Uint8Array(keyInfoPrefix.length + userPubRaw.length + eph.publicKeyRaw.length);
    keyInfo.set(keyInfoPrefix, 0);
    keyInfo.set(userPubRaw, keyInfoPrefix.length);
    keyInfo.set(eph.publicKeyRaw, keyInfoPrefix.length + userPubRaw.length);
    const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

    // Step 2: CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
    const cek = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);

    // Step 3: NONCE = HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
    const nonce = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

    // Step 4: paddingでブロック化（aes128gcm仕様: payload + 0x02 + padding）
    const padded = new Uint8Array(payload.length + 1);
    padded.set(payload, 0);
    padded[payload.length] = 0x02; // 最終レコードマーカー

    const cekKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
    const cipher = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, padded),
    );

    // aes128gcm body: header (salt[16] + rs[4]=4096 + idlen[1] + keyid[idlen]) + ciphertext
    const idlen = eph.publicKeyRaw.length;
    const rs = 4096;
    const header = new Uint8Array(16 + 4 + 1 + idlen);
    header.set(salt, 0);
    new DataView(header.buffer).setUint32(16, rs, false);
    header[20] = idlen;
    header.set(eph.publicKeyRaw, 21);

    const body = new Uint8Array(header.length + cipher.length);
    body.set(header, 0);
    body.set(cipher, header.length);

    return { ciphertext: body, salt, ephPub: eph.publicKeyRaw };
}

export async function sendWebPush(
    sub: PushSubscription,
    payload: { title: string; body: string; url?: string; tag?: string },
    cfg: VapidConfig,
    ttlSeconds = 60 * 60 * 12,
): Promise<{ status: number; statusText: string }> {
    const endpointUrl = new URL(sub.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
    const jwt = await vapidJwt(audience, cfg);

    const data = new TextEncoder().encode(JSON.stringify(payload));
    const { ciphertext } = await encryptAes128Gcm(sub, data);

    const res = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": String(ttlSeconds),
            "Urgency": "normal",
            "Authorization": `vapid t=${jwt}, k=${cfg.publicKey}`,
        },
        body: ciphertext,
    });

    return { status: res.status, statusText: res.statusText };
}
