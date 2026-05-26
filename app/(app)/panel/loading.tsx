import { EsqueletoPanel } from "@/components/compartido/EsqueletoPanel";

export default function PanelLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      </div>
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="h-10 flex-1 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-full md:w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-full md:w-48 rounded-md bg-muted animate-pulse" />
      </div>
      <EsqueletoPanel />
    </div>
  );
}
