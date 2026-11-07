import { useState } from 'react'
import { dismissInstall, installDismissed, isStandalone, needsIosInstallHint, useInstallPrompt, useOnline } from '@/lib/pwa'

/** Calm, non-blocking notices at the top of the app: offline state and install hint. */
export default function StatusBanners() {
  const online = useOnline()
  const { canInstall, install } = useInstallPrompt()
  const [hidden, setHidden] = useState(installDismissed)
  const iosHint = needsIosInstallHint(navigator.userAgent, isStandalone())
  const showInstall = !hidden && !isStandalone() && (canInstall || iosHint)

  return (
    <>
      {!online && (
        <div role="status" className="bg-line px-5 py-2 text-center text-sm">
          You're offline. Everything you log is saved on this device.
        </div>
      )}
      {showInstall && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-card px-5 py-3 text-sm">
          <span>
            {canInstall ? 'Install Plates for quick logging from your home screen.' : 'To install: tap Share, then "Add to Home Screen".'}
          </span>
          <span className="flex shrink-0 gap-3">
            {canInstall && (
              <button type="button" onClick={() => void install()} className="font-medium text-accent">Install</button>
            )}
            <button
              type="button"
              aria-label="Dismiss install hint"
              onClick={() => {
                dismissInstall()
                setHidden(true)
              }}
              className="text-muted"
            >
              ✕
            </button>
          </span>
        </div>
      )}
    </>
  )
}
