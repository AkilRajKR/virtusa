import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white p-8 font-mono">
                    <div className="max-w-4xl mx-auto bg-slate-800 border border-red-500/50 rounded-lg p-6 shadow-2xl">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Application Error</h1>
                        <div className="bg-black/50 p-4 rounded border border-white/10 overflow-auto">
                            <p className="text-red-300 font-bold mb-2">
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <pre className="text-slate-400 text-sm whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
