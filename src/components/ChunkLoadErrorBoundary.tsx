import React from "react";
import { Button } from "@/components/ui/button";

const isChunkLoadError = (message?: string) => {
  if (!message) return false;
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("ChunkLoadError")
  );
};

const clearServiceWorkersAndCaches = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));

    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort only
  }
};

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class ChunkLoadErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    const message = error?.message;

    // Attempt auto-recovery a couple times; otherwise show UI instead of blank screen.
    if (isChunkLoadError(message)) {
      const key = "__chunk_reload_count__";
      const count = Number(sessionStorage.getItem(key) || "0");
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        clearServiceWorkersAndCaches().finally(() => window.location.reload());
      }
    }
  }

  private handleReload = () => {
    clearServiceWorkersAndCaches().finally(() => window.location.reload());
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error?.message || "Unknown error";
    const isChunk = isChunkLoadError(message);

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm space-y-3">
          <h1 className="text-lg font-semibold">Something didn’t load</h1>
          <p className="text-sm text-muted-foreground">
            {isChunk
              ? "A cached file prevented this page from loading. Reload to recover."
              : "An unexpected error occurred. Reload to try again."}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={this.handleReload}>Reload</Button>
          </div>
          <details className="pt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{message}</pre>
          </details>
        </div>
      </div>
    );
  }
}
