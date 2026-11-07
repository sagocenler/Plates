import { Component, type ErrorInfo, type ReactNode } from 'react'

/** Last line of defence: a render crash shows a calm screen instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main role="alert" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted">Your logs are saved on this device. Reloading usually fixes it.</p>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="mx-auto mt-6 min-h-11 rounded-xl bg-accent px-6 font-medium text-accent-ink"
        >
          Reload Plates
        </button>
      </main>
    )
  }
}
