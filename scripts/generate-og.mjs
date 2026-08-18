import { readFile } from "node:fs/promises";
import sharp from "sharp";

const width = 1200;
const height = 630;

const [photo, crest, wordmark] = await Promise.all([
  sharp("public/images/instagram-team.jpg")
    .resize(540, height, { fit: "cover", position: "centre" })
    .modulate({ saturation: 0.86 })
    .toBuffer(),
  sharp("public/brand/phoenix-crest.svg")
    .resize({ height: 66 })
    .png()
    .toBuffer(),
  sharp("public/brand/phoenix-united-wordmark.svg")
    .resize({ width: 164 })
    .png()
    .toBuffer(),
]);

const overlay = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" width="660" height="${height}" fill="#0D0D0D"/>
    <rect x="660" width="4" height="${height}" fill="#C9A84C"/>
    <rect x="0" y="505" width="660" height="125" fill="#0D1B2A"/>
    <rect x="38" y="22" width="3" height="68" fill="#C9A84C"/>
    <text x="54" y="138" fill="#C9A84C" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3">PHOENIX UNITED FC · DUBAI</text>
    <text x="52" y="226" fill="#E8DFC8" font-family="Arial Black, Arial, sans-serif" font-size="68" font-weight="900" letter-spacing="-1">A FOOTBALL</text>
    <text x="52" y="302" fill="#E8DFC8" font-family="Arial Black, Arial, sans-serif" font-size="68" font-weight="900" letter-spacing="-1">CLUB IN DUBAI.</text>
    <text x="52" y="378" fill="#C9A84C" font-family="Arial Black, Arial, sans-serif" font-size="68" font-weight="900" letter-spacing="-1">BUILT TO RISE.</text>
    <text x="54" y="475" fill="#E8DFC8" fill-opacity="0.72" font-family="Arial, sans-serif" font-size="17" font-weight="600">REAL CLUB · REAL ENVIRONMENT · INTERNATIONAL NETWORK</text>
    <text x="54" y="550" fill="#C9A84C" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">DXB 01</text>
    <line x1="136" y1="545" x2="286" y2="545" stroke="#E8DFC8" stroke-opacity="0.25" stroke-width="2"/>
    <text x="335" y="550" fill="#E8DFC8" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">MAN 02</text>
    <line x1="424" y1="545" x2="550" y2="545" stroke="#E8DFC8" stroke-opacity="0.25" stroke-width="2"/>
    <text x="568" y="550" fill="#E8DFC8" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">ALG 03</text>
    <text x="54" y="595" fill="#E8DFC8" fill-opacity="0.72" font-family="Arial, sans-serif" font-size="16">Phoenix United · Strive to Rise</text>
  </svg>
`);

await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: "#0D0D0D",
  },
})
  .composite([
    { input: photo, left: 660, top: 0 },
    { input: overlay, left: 0, top: 0 },
    { input: crest, left: 48, top: 25 },
    { input: wordmark, left: 126, top: 28 },
  ])
  .png({ compressionLevel: 9 })
  .toFile("public/og-share.png");

const output = await readFile("public/og-share.png");
console.log(`Generated public/og-share.png (${output.byteLength} bytes) from real Phoenix assets.`);
