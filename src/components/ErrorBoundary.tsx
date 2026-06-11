import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LEGACY SYSTEM FAILURE DETECTED:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 border-2 border-red-200 rounded-2xl text-center">
          <div className="bg-red-100 p-4 rounded-full mb-6">
            <AlertCircle className="text-red-600 w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">
            {this.props.fallbackTitle || 'Critical System Fault'}
          </h2>
          <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
            A foundation-level architectural error has occurred. This is likely due to legacy utility conflicts within the global environment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl"
          >
            <RefreshCw size={14} />
            RE-INITIATE CORE
          </button>
          
          <div className="mt-8 text-left max-h-40 overflow-y-auto w-full max-w-lg mx-auto bg-white p-4 rounded-lg border border-red-100 shadow-inner">
            <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 px-1">Error Trace</div>
            <pre className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all leading-tight">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
