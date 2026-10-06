import React from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CallVault Unhandled Render Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('callvault_onboarded');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-vault-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
          <div className="w-full max-w-lg bg-vault-900/90 border border-vault-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center animate-modal">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              CallVault encountered an unexpected error while rendering. Your recordings and database are safe.
            </p>

            {this.state.error && (
              <div className="p-3 bg-vault-950 border border-vault-850 rounded-xl text-left text-xs font-mono text-rose-300 break-words max-h-36 overflow-y-auto mb-6">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center space-x-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-sky-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-vault-800 border border-vault-800 transition"
              >
                Reset State & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
