import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EsqueletoPanel({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cantidad }).map((_, i) => (
        <Card key={i} className="h-full animate-pulse">
          <CardHeader className="pb-2 space-y-3">
            <div className="flex justify-between">
              <div className="h-9 w-9 rounded-md bg-muted" />
              <div className="h-5 w-24 rounded-full bg-muted" />
            </div>
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
