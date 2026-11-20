import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sci-card flex flex-col items-center justify-center p-6 text-center min-h-[220px]">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-3" />
          <h3 className="text-sm font-semibold text-[var(--lab-text)] mb-1">
            {this.props.fallbackTitle || 'Visualization Fallback'}
          </h3>
          <p className="text-xs text-[var(--lab-muted)] max-w-md mb-4">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            className="sci-btn-secondary text-xs"
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
