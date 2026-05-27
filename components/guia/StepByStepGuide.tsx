"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, Circle, Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisorImagenAmpliada } from "@/components/guia/VisorImagenAmpliada";
import { cn } from "@/lib/utils";
import type { StepByStepGuideProps } from "@/lib/guia/step-by-step-types";
import {
  cargarProgresoGuia,
  formatearMinutosRestantes,
  formatearTiempoTranscurrido,
  guardarProgresoGuia,
  minutosRestantes,
  reiniciarProgresoGuia,
  estadoInicialProgreso,
} from "@/lib/guia/step-by-step-storage";

function esHtml(texto: string): boolean {
  return /<[a-z][\s\S]*>/i.test(texto);
}

export function StepByStepGuide({
  guideId,
  title,
  steps,
  totalEstimatedTime,
  autoAdvanceOnCheck = true,
  confirmOnCheck = false,
  headerActions,
  onStepChange,
  onFinish,
}: StepByStepGuideProps) {
  const total = steps.length;
  const [hidratado, setHidratado] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [finished, setFinished] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [confirmarPaso, setConfirmarPaso] = useState(false);
  const [graciasFeedback, setGraciasFeedback] = useState(false);
  const [animarPaso, setAnimarPaso] = useState(false);

  const baseElapsedRef = useRef(0);

  // Hidratar desde localStorage
  useEffect(() => {
    const guardado = cargarProgresoGuia(guideId);
    const paso = Math.min(guardado.currentStep, Math.max(0, total - 1));
    setCurrentStep(paso);
    setCompletedSteps(guardado.completedSteps.filter((i) => i < total));
    setIsFullscreenMode(guardado.isFullscreenMode);
    baseElapsedRef.current = guardado.elapsedSeconds;
    if (guardado.timerStartedAt) {
      const extra = Math.floor(
        (Date.now() - guardado.timerStartedAt) / 1000
      );
      setElapsedSeconds(guardado.elapsedSeconds + extra);
      setTimerStartedAt(guardado.timerStartedAt);
    } else {
      setElapsedSeconds(guardado.elapsedSeconds);
      setTimerStartedAt(null);
    }
    setFeedback(guardado.feedback);
    setFinished(guardado.finished && guardado.completedSteps.length >= total);
    setHidratado(true);
  }, [guideId, total]);

  // Persistir en localStorage
  useEffect(() => {
    if (!hidratado) return;
    guardarProgresoGuia(guideId, {
      currentStep,
      completedSteps,
      isFullscreenMode,
      timerStartedAt,
      elapsedSeconds,
      feedback,
      finished,
    });
    onStepChange?.(currentStep, completedSteps);
  }, [
    guideId,
    hidratado,
    currentStep,
    completedSteps,
    isFullscreenMode,
    timerStartedAt,
    elapsedSeconds,
    feedback,
    finished,
    onStepChange,
  ]);

  useEffect(() => {
    if (!timerStartedAt) return;
    const id = setInterval(() => {
      setElapsedSeconds(
        baseElapsedRef.current +
          Math.floor((Date.now() - timerStartedAt) / 1000)
      );
    }, 1000);
    return () => clearInterval(id);
  }, [timerStartedAt]);

  const paso = steps[currentStep];
  const completadosCount = completedSteps.length;
  const porcentaje =
    total > 0 ? Math.round((completadosCount / total) * 100) : 0;
  const esUltimo = currentStep >= total - 1;
  const pasoCompletado = completedSteps.includes(currentStep);
  const restanteMin = useMemo(
    () => minutosRestantes(steps, currentStep, completedSteps),
    [steps, currentStep, completedSteps]
  );

  const irAPaso = useCallback(
    (indice: number) => {
      const nuevo = Math.max(0, Math.min(indice, total - 1));
      setAnimarPaso(true);
      setCurrentStep(nuevo);
      setTimeout(() => setAnimarPaso(false), 300);
    },
    [total]
  );

  const marcarCompletado = useCallback(
    (indice: number, avanzar = true) => {
      setCompletedSteps((prev) =>
        prev.includes(indice) ? prev : [...prev, indice].sort((a, b) => a - b)
      );
      if (avanzar && autoAdvanceOnCheck && indice < total - 1) {
        irAPaso(indice + 1);
      }
      if (indice === total - 1 && avanzar) {
        setFinished(true);
        onFinish?.();
      }
    },
    [autoAdvanceOnCheck, total, irAPaso, onFinish]
  );

  const togglePasoCompletado = useCallback(
    (indice: number, marcado: boolean) => {
      if (marcado) {
        if (confirmOnCheck && indice === currentStep) {
          setConfirmarPaso(true);
          return;
        }
        marcarCompletado(indice);
      } else {
        setCompletedSteps((prev) => prev.filter((i) => i !== indice));
        if (finished) setFinished(false);
      }
    },
    [confirmOnCheck, currentStep, marcarCompletado, finished]
  );

  const confirmarCompletadoActual = () => {
    setConfirmarPaso(false);
    marcarCompletado(currentStep);
  };

  const iniciarTemporizador = () => {
    if (timerStartedAt) return;
    baseElapsedRef.current = elapsedSeconds;
    setTimerStartedAt(Date.now());
  };

  const enviarFeedback = (tipo: "up" | "down") => {
    setFeedback((prev) => ({ ...prev, [String(currentStep)]: tipo }));
    setGraciasFeedback(true);
    console.log("[StepByStepGuide] feedback", {
      guideId,
      step: currentStep,
      tipo,
    });
    setTimeout(() => setGraciasFeedback(false), 2500);
  };

  const finalizarGuia = () => {
    if (!completedSteps.includes(currentStep)) {
      marcarCompletado(currentStep, false);
    }
    setFinished(true);
    onFinish?.();
  };

  const reiniciarGuia = () => {
    reiniciarProgresoGuia(guideId);
    const inicial = estadoInicialProgreso();
    setCurrentStep(inicial.currentStep);
    setCompletedSteps([]);
    setIsFullscreenMode(false);
    setTimerStartedAt(null);
    setElapsedSeconds(0);
    setFeedback({});
    setFinished(false);
  };

  if (!hidratado || total === 0) {
    return (
      <p className="p-8 text-muted-foreground" aria-live="polite">
        Cargando guía…
      </p>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
        <span className="text-6xl" aria-hidden>
          🎉
        </span>
        <h1 className="text-2xl font-bold">¡Guía completada!</h1>
        <p className="text-muted-foreground">
          Has terminado <strong>{title}</strong>. Buen trabajo.
        </p>
        {elapsedSeconds > 0 && (
          <p className="text-sm text-muted-foreground">
            Tiempo dedicado: {formatearTiempoTranscurrido(elapsedSeconds)}
          </p>
        )}
        <Button type="button" onClick={reiniciarGuia} aria-label="Reiniciar guía">
          Empezar de nuevo
        </Button>
      </div>
    );
  }

  const contenidoPaso = (
    <article
      className={cn(
        "rounded-xl border border-blue-200 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-800",
        "border-l-4 border-l-blue-500 p-5 md:p-6 space-y-4 transition-opacity duration-300",
        animarPaso && "opacity-70"
      )}
      aria-current="step"
    >
      <div className="flex flex-wrap items-start gap-2">
        <span className="text-lg" aria-hidden>
          👀
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-blue-950 dark:text-blue-50">
              {paso.title}
            </h2>
            {paso.helpText && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setAyudaAbierta(true)}
                aria-label="Ver ayuda de este paso"
              >
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="sr-only">Ayuda</span>
              </Button>
            )}
          </div>
          <p className="text-sm font-mono text-blue-700/80 dark:text-blue-300 mt-1">
            Paso {currentStep + 1} de {total}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-background/50 p-3 border">
        <Checkbox
          id={`paso-check-${currentStep}`}
          checked={pasoCompletado}
          onCheckedChange={(v) => togglePasoCompletado(currentStep, v === true)}
          aria-label={`Marcar paso ${currentStep + 1} como completado`}
        />
        <label
          htmlFor={`paso-check-${currentStep}`}
          className="text-sm font-medium cursor-pointer select-none"
        >
          He completado este paso
        </label>
      </div>

      {paso.description &&
        (esHtml(paso.description) ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
            dangerouslySetInnerHTML={{ __html: paso.description }}
          />
        ) : (
          <p className="text-foreground/90 whitespace-pre-wrap">{paso.description}</p>
        ))}

      {(() => {
        const imagenes =
          paso.images && paso.images.length > 0
            ? paso.images
            : paso.imageUrl
              ? [{ url: paso.imageUrl }]
              : [];
        if (imagenes.length === 0) return null;
        return (
          <div className="space-y-3">
            {imagenes.map((img, idx) => (
              <figure key={`${img.url}-${idx}`} className="space-y-1">
                <button
                  type="button"
                  className="group relative block w-full rounded-lg overflow-hidden border bg-muted/30 focus:ring-2 focus:ring-primary cursor-zoom-in"
                  onClick={() => setImagenAmpliada(img.url)}
                  aria-label={
                    img.caption
                      ? `Ampliar captura: ${img.caption}`
                      : `Ampliar captura ${idx + 1}`
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption ?? `Captura ${idx + 1}`}
                    className="w-full h-auto object-contain max-h-[70vh]"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Click para ampliar
                  </span>
                </button>
                {img.caption && (
                  <figcaption className="text-xs text-muted-foreground text-center">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        );
      })()}
    </article>
  );

  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 flex-col lg:flex-row",
        isFullscreenMode &&
          "fixed inset-0 z-50 bg-background flex flex-col lg:flex-row min-h-screen"
      )}
    >
      {/* Barra lateral: lista de pasos */}
      <aside
        className={cn(
          "no-imprimir shrink-0 border-r bg-card overflow-y-auto",
          isFullscreenMode ? "hidden" : "w-full lg:w-72 max-h-[40vh] lg:max-h-none"
        )}
        aria-label="Lista de pasos"
      >
        <div className="p-4 border-b">
          <h1 className="font-semibold text-lg leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Duración total: {totalEstimatedTime}
          </p>
        </div>
        <ol className="p-2 space-y-0.5">
          {steps.map((s, i) => {
            const hecho = completedSteps.includes(i);
            const activo = i === currentStep;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => irAPaso(i)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                    activo && "bg-primary text-primary-foreground",
                    !activo && hecho && "text-muted-foreground",
                    !activo && !hecho && "hover:bg-muted"
                  )}
                  aria-current={activo ? "step" : undefined}
                >
                  <span className="shrink-0">
                    {hecho ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="truncate">
                    <span className="font-mono text-xs opacity-70">{i + 1}.</span>{" "}
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Progreso superior */}
        <div className="no-imprimir border-b p-4 space-y-3 sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreenMode((v) => !v)}
                aria-pressed={isFullscreenMode}
                aria-label={
                  isFullscreenMode
                    ? "Salir del modo sin distracciones"
                    : "Modo sin distracciones"
                }
              >
                🖥️{" "}
                {isFullscreenMode ? "Salir pantalla completa" : "Sin distracciones"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={iniciarTemporizador}
                disabled={!!timerStartedAt}
                aria-label="Iniciar temporizador"
              >
                ⏱️ {timerStartedAt ? "Temporizador activo" : "Iniciar temporizador"}
              </Button>
            </div>
            {headerActions}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Completados: {completadosCount} de {total} pasos ({porcentaje}%)
              </span>
              <span className="text-muted-foreground text-xs">
                Te quedan {formatearMinutosRestantes(restanteMin)}
              </span>
            </div>
            <Progress value={porcentaje} className="h-2 transition-all duration-500" />
          </div>

          {timerStartedAt && (
            <p className="text-xs text-muted-foreground font-mono">
              Tiempo dedicado: {formatearTiempoTranscurrido(elapsedSeconds)}
            </p>
          )}
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">{contenidoPaso}</div>

          {/* Checklist compacta */}
          <div className="max-w-3xl mx-auto mt-8 rounded-lg border p-4 no-imprimir">
            <h3 className="text-sm font-semibold mb-3">Checklist de la guía</h3>
            <ul className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id={`checklist-${i}`}
                    checked={completedSteps.includes(i)}
                    onCheckedChange={(v) => togglePasoCompletado(i, v === true)}
                    aria-label={`Paso ${i + 1}: ${s.title}`}
                  />
                  <label
                    htmlFor={`checklist-${i}`}
                    className={cn(
                      "cursor-pointer flex-1",
                      i === currentStep && "font-medium text-primary"
                    )}
                  >
                    {i + 1}. {s.title}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Navegación */}
        <footer className="no-imprimir border-t p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => irAPaso(currentStep - 1)}
              disabled={currentStep === 0}
              aria-label="Paso anterior"
            >
              🔁 Paso anterior
            </Button>
            {esUltimo ? (
              <Button
                type="button"
                className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={finalizarGuia}
                aria-label="Finalizar guía"
              >
                🎉 Finalizar guía
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  if (!pasoCompletado) marcarCompletado(currentStep);
                  else irAPaso(currentStep + 1);
                }}
                aria-label="Siguiente paso"
              >
                ✔️ Siguiente paso
              </Button>
            )}
          </div>

          {/* Feedback */}
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <p className="text-sm text-muted-foreground">¿Este paso está claro?</p>
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => enviarFeedback("up")}
                aria-label="Sí, el paso está claro"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Sí
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => enviarFeedback("down")}
                aria-label="No, el paso no está claro"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                No
              </Button>
            </div>
            {graciasFeedback && (
              <p className="text-sm text-green-600" role="status">
                ¡Gracias por tu feedback!
              </p>
            )}
          </div>
        </footer>
      </div>

      {/* Diálogo confirmación */}
      <Dialog open={confirmarPaso} onOpenChange={setConfirmarPaso}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Completaste este paso?</DialogTitle>
            <p className="text-sm text-muted-foreground text-left pt-2">
              Confirma que has realizado todas las acciones de «{paso.title}» antes
              de continuar.
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmarPaso(false)}>
              Aún no
            </Button>
            <Button onClick={confirmarCompletadoActual}>Sí, completado</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ayuda */}
      <Dialog open={ayudaAbierta} onOpenChange={setAyudaAbierta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Ayuda
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-left pt-2 whitespace-pre-wrap">
              {paso.helpText}
            </p>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Imagen ampliada */}
      <VisorImagenAmpliada
        url={imagenAmpliada}
        alt={paso.title}
        onClose={() => setImagenAmpliada(null)}
      />
    </div>
  );
}
