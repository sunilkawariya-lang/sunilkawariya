import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if ((window as any).setActiveTab) {
      (window as any).setActiveTab('dashboard');
    }
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. We're working on fixing it.";
      let isRateLimit = false;

      try {
        if (this.state.error?.message) {
          const errorData = JSON.parse(this.state.error.message);
          if (errorData.error?.includes('Quota exceeded') || errorData.error?.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = "We've hit a temporary limit with our data provider. Please try again in a few minutes.";
            isRateLimit = true;
          }
        }
      } catch (e) {
        // Not a JSON error, use default or specific message
        if (this.state.error?.message?.includes('Quota exceeded') || this.state.error?.message?.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = "We've hit a temporary limit with our data provider. Please try again in a few minutes.";
          isRateLimit = true;
        }
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-rose-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              {isRateLimit ? 'Temporary Limit Reached' : 'Oops! Something went wrong'}
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
