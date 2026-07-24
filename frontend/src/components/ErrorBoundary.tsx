import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4 bg-[var(--surface-card)] p-6 rounded-[var(--radius-xl)] border border-[var(--border-primary)] shadow-md">
            <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              An unexpected application error occurred. You can retry loading this page or return home.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-left overflow-x-auto text-[11px] font-mono text-red-600 dark:text-red-400 max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white rounded-[var(--radius-lg)] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <a
                href="/home"
                className="px-4 py-2 text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-[var(--radius-lg)] transition-all flex items-center gap-2"
              >
                <Home size={14} />
                <span>Go Home</span>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
