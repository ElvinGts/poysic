import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PoySic Crash Boundary Caught Error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#F5F3EE] flex items-center justify-center p-6 font-mono selection:bg-[#FF4D2E] selection:text-[#0A0A0A]">
          <div className="max-w-md w-full bg-[#111111] border border-[#FF4D2E] p-8 text-left shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF4D2E] mb-4">
              <AlertTriangle className="w-6 h-6" />
              <span className="text-xs uppercase tracking-widest font-bold">SIGNAL INTERRUPTED • DSP HALT</span>
            </div>
            <h2 className="font-editorial text-2xl text-[#F5F3EE] mb-2 font-normal">Session Interrupted</h2>
            <p className="text-xs text-[#8E8E8A] leading-relaxed mb-6 font-mono">
              The audio synchronization pipeline or interface encountered an unexpected state. Your saved identity and room credentials remain intact.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              aria-label="Re-initialize audio deck"
              className="min-h-[44px] w-full flex items-center justify-center gap-2 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-INITIALIZE DECK</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
