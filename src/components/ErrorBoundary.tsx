/**
 * ErrorBoundary.tsx
 *
 * Global React error boundary. Catches unhandled render/lifecycle errors
 * anywhere in the tree and renders a friendly Hebrew fallback screen
 * instead of a blank white page.
 *
 * Usage (main.tsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorId: null };

  static getDerivedStateFromError(): State {
    // Generate a short incident ID so users can report it
    const errorId = Math.random().toString(36).slice(2, 8).toUpperCase();
    return { hasError: true, errorId };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log in all environments so we can diagnose production crashes
    console.error("[ErrorBoundary] Uncaught render error:", error.message, error.stack, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-background p-6"
          dir="rtl"
        >
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                משהו השתבש
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                אירעה שגיאה בלתי צפויה. ניתן לנסות לרענן את הדף, ואם הבעיה
                ממשיכה — פנו לתמיכה עם קוד השגיאה.
              </p>
            </div>

            {/* Error ID */}
            {this.state.errorId && (
              <div className="inline-block bg-muted rounded-lg px-4 py-2">
                <span className="text-xs text-muted-foreground">קוד שגיאה: </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {this.state.errorId}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw size={16} />
                חזרה לעמוד הבית
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                רענן דף
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
