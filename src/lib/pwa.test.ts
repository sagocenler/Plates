import { isIos, isSafari, needsIosInstallHint } from './pwa'

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1'
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'

describe('pwa helpers', () => {
  it('detects iOS Safari', () => {
    expect(isIos(IPHONE_SAFARI)).toBe(true)
    expect(isSafari(IPHONE_SAFARI)).toBe(true)
    expect(isSafari(IPHONE_CHROME)).toBe(false)
    expect(isIos(ANDROID_CHROME)).toBe(false)
  })
  it('shows the iOS hint only in Safari when not already installed', () => {
    expect(needsIosInstallHint(IPHONE_SAFARI, false)).toBe(true)
    expect(needsIosInstallHint(IPHONE_SAFARI, true)).toBe(false)
    expect(needsIosInstallHint(ANDROID_CHROME, false)).toBe(false)
  })
})
