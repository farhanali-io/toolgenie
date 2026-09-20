import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Tool ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="w-full p-6 sm:p-8 rounded-2xl border text-center my-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div 
            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
          >
            <AlertTriangle size={24} />
          </div>

          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {this.props.fallbackTitle || 'An Unexpected Error Occurred'}
          </h3>

          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message || 'The tool encountered an issue processing this media file in the browser memory.'}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              <RefreshCw size={16} />
              <span>Reset & Try Again</span>
            </button>

            <button
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="px-4 py-2.5 rounded-xl font-medium text-xs border transition-colors"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              {this.state.showDetails ? 'Hide Diagnostics' : 'Show Diagnostics'}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div 
              className="mt-6 text-left p-4 rounded-xl font-mono text-xs overflow-x-auto border max-h-48"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <p className="font-bold text-red-500 mb-1">{this.state.error.toString()}</p>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
