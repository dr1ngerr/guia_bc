import type { ReactNode } from "react";

export interface GuideStep {
  title: string;
  description: string;
  estimatedMinutes?: number;
  helpText?: string;
  imageUrl?: string;
}

export interface GuideProgressState {
  currentStep: number;
  completedSteps: number[];
  isFullscreenMode: boolean;
  timerStartedAt: number | null;
  elapsedSeconds: number;
  feedback: Record<string, "up" | "down">;
  finished: boolean;
}

export interface StepByStepGuideProps {
  guideId: string;
  title: string;
  steps: GuideStep[];
  totalEstimatedTime: string;
  /** Avanza al siguiente paso al marcar el checkbox (por defecto: true). */
  autoAdvanceOnCheck?: boolean;
  /** Muestra confirmación antes de marcar como completado. */
  confirmOnCheck?: boolean;
  /** Acciones extra en la barra superior (imprimir, editar…). */
  headerActions?: ReactNode;
  onStepChange?: (currentStep: number, completedSteps: number[]) => void;
  onFinish?: () => void;
}
