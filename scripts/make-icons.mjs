// Renders the app icons from SVG using Playwright's Chromium. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const svg = (size, { maskable = false } = {}) => {
  const r = maskable ? 0 : size * 0.22 // maskable icons are full-bleed; the OS applies the mask
  const c = size / 2
  const plate = size * (maskable ? 0.27 : 0.33) // keep artwork inside the maskable safe zone
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#b4452c"/>
  <circle cx="${c}" cy="${c}" r="${plate}" fill="#faf7f2"/>
  <circle cx="${c}" cy="${c}" r="${plate * 0.68}" fill="none" stroke="#b4452c" stroke-width="${size * 0.018}"/>
  <circle cx="${c}" cy="${c}" r="${plate * 0.18}" fill="#b4452c"/>
</svg>`
}

const jobs = [
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-maskable-512.png', 512, true],
  ['public/apple-touch-icon.png', 180, true],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, size, maskable] of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<body style="margin:0;background:transparent">${svg(size, { maskable })}</body>`)
  writeFileSync(file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }))
  console.log('wrote', file)
}
writeFileSync('public/favicon.svg', svg(64))
await browser.close()
