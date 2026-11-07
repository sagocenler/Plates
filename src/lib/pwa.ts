import { useEffect, useState, useSyncExternalStore } from 'react'

export const isIos = (ua: string) => /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
export const isSafari = (ua: string) => /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/.test(ua)

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** iOS has no install prompt event: users add to the Home Screen from the Share menu. */
export const needsIosInstallHint = (ua: string, standalone: boolean) => isIos(ua) && isSafari(ua) && !standalone

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}
export const useOnline = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine, () => true)

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Chrome/Android: captures the install prompt so we can show our own button. */
export function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setEvt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return {
    canInstall: evt !== null,
    install: async () => {
      if (!evt) return
      await evt.prompt()
      await evt.userChoice
      setEvt(null)
    },
  }
}

const DISMISS_KEY = 'plates-install-dismissed'
export const installDismissed = (): boolean => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}
export const dismissInstall = () => {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* private mode: banner simply returns next visit */
  }
}
