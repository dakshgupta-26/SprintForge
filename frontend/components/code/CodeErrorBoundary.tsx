"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class CodeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[CODE_ERROR_BOUNDARY] Error in ${this.props.componentName || "Component"}:`,
      error,
      errorInfo
    );
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = "Editor failed to initialize",
        fallbackMessage = "An unexpected error occurred while rendering this workspace component. The rest of your workspace is preserved.",
        componentName,
      } = this.props;

      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-[#070a18] p-6 text-slate-300 select-none overflow-y-auto">
          <div className="w-full max-w-md bg-[#0a0e24] border border-white/[0.1] rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            {/* Warning Icon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Error Headers */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">
                {fallbackTitle}
              </h3>
              {componentName && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  {componentName}
                </span>
              )}
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm pt-1">
                {fallbackMessage}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry {componentName || "Component"}
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:text-white transition-all cursor-pointer"
              >
                Reload Workspace
              </button>
            </div>

            {/* Developer Diagnostics Dropdown */}
            {this.state.error && (
              <div className="w-full pt-2 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center justify-between w-full text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    Developer Diagnostics
                  </span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-black/50 border border-white/[0.06] text-[11px] font-mono text-rose-300 overflow-x-auto max-h-40 scrollbar-thin">
                    <p className="font-bold text-rose-400">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-1 text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed">
                        {this.state.error.stack.split("\n").slice(0, 6).join("\n")}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
