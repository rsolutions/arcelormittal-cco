import { TrainFront } from "lucide-react";

/**
 * Server-rendered shell. The live panel depends on real-time clocks and
 * simulated telemetry, so it mounts after hydration to keep SSR output stable.
 */
export function BootScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center">
        <TrainFront className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-4 font-mono text-lg font-bold tracking-[0.18em] uppercase">{title}</h1>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{subtitle}</p>
        <p className="mt-6 tech-label">Estabelecendo comunicação com o servidor de dados...</p>
      </div>
    </div>
  );
}
