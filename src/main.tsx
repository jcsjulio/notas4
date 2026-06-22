import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public state: State;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React runtime error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      alert("Não foi possível limpar o armazenamento local.");
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-neutral-800 dark:text-neutral-200 font-sans">
          <div className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold uppercase tracking-wider">
                Ops! Detectamos um erro
              </div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Algo deu errado na inicialização</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                A aplicação encontrou um erro inesperado. Isso pode ocorrer por incompatibilidade de dados salvos ou na sincronização remota.
              </p>
            </div>

            <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl font-mono text-xs overflow-auto max-h-48 whitespace-pre-wrap text-rose-600 dark:text-rose-400 border border-neutral-200/50 dark:border-neutral-800">
              {this.state.error?.stack || this.state.error?.message || "Erro desconhecido"}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-sm rounded-xl hover:opacity-90 active:scale-98 transition duration-200"
              >
                Tentar Novamente
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium text-sm rounded-xl hover:bg-rose-500/20 active:scale-98 transition duration-200"
              >
                Limpar Cache Local
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

