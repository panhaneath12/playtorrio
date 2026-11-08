import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PlayTorrio ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('PlayTorrio_LiveTV_DB');
      }
    } catch (_) {}
    window.location.reload();
  };

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#08090D] text-white select-none overflow-y-auto"
          data-tv-scope="error-boundary"
        >
          <div className="max-w-2xl w-full p-8 rounded-2xl bg-[#12131A] border border-red-500/30 shadow-2xl space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wide text-white">
                  PlayTorrio V3 <span className="text-red-500">Recovery Shield</span>
                </h1>
                <p className="text-sm text-gray-400">
                  A rendering error was safely intercepted to protect your TV session.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-red-400 overflow-x-auto space-y-2">
              <div className="font-bold text-red-300">
                {this.state.error ? this.state.error.toString() : 'Unknown JavaScript Exception'}
              </div>
              {this.state.errorInfo && (
                <div className="text-gray-400 text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                autoFocus
                data-tv-nav="true"
                onClick={this.handleDismiss}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 focus:bg-[#E50914] focus:text-white font-bold text-sm text-white transition-all text-center border border-white/10 focus:border-white focus:outline-none focus:scale-105"
              >
                Continue / Retry
              </button>
              <button
                type="button"
                data-tv-nav="true"
                onClick={this.handleReload}
                className="px-5 py-3 rounded-xl bg-[#E50914] hover:bg-red-700 focus:bg-white focus:text-black font-bold text-sm text-white transition-all text-center focus:outline-none focus:scale-105"
              >
                Reload App
              </button>
              <button
                type="button"
                data-tv-nav="true"
                onClick={this.handleClearAndReload}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-yellow-500 focus:text-black font-semibold text-xs text-gray-300 transition-all text-center border border-white/10 focus:outline-none focus:scale-105"
              >
                Clear Cache & Reset
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 font-medium">
              PlayTorrio V3 Web Platform &bull; React 19 Engine
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
