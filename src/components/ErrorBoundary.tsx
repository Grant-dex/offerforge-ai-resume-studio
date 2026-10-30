import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-red-100 bg-red-50 p-8">
          <AlertTriangle size={32} className="text-red-400" />
          <div className="text-center">
            <p className="text-sm font-bold text-red-700">页面渲染出错</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-red-500">
              {this.state.error.message || "发生了未知错误"}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            onClick={() => this.setState({ error: null })}
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
