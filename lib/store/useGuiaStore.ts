import { create } from "zustand";
import type { Paso, ProcesoConPasos } from "@/lib/supabase/tipos";

interface GuiaState {
  proceso: ProcesoConPasos | null;
  pasoActual: number;
  pasosCompletados: number[];
  verificacionesMarcadas: string[];
  verificacionPasoActual: boolean;
  completado: boolean;
  cargando: boolean;

  setProceso: (proceso: ProcesoConPasos) => void;
  setPasoActual: (indice: number) => void;
  marcarPasoCompletado: (indice: number) => void;
  marcarVerificacion: (pasoId: string) => void;
  setVerificacionPasoActual: (marcada: boolean) => void;
  setCompletado: (valor: boolean) => void;
  setCargando: (valor: boolean) => void;
  sincronizarProgreso: (data: {
    paso_actual: number;
    pasos_completados: number[];
    verificaciones_marcadas: string[];
    completado_en?: string | null;
  }) => void;
  reset: () => void;
  pasoActivo: () => (Paso & { capturas: import("@/lib/supabase/tipos").Captura[] }) | null;
  puedeAvanzar: () => boolean;
}

export const useGuiaStore = create<GuiaState>((set, get) => ({
  proceso: null,
  pasoActual: 0,
  pasosCompletados: [],
  verificacionesMarcadas: [],
  verificacionPasoActual: false,
  completado: false,
  cargando: false,

  setProceso: (proceso) => set({ proceso }),
  setPasoActual: (indice) => {
    const { proceso, verificacionesMarcadas } = get();
    const paso = proceso?.pasos[indice];
    const verificada =
      !paso?.texto_verificacion ||
      verificacionesMarcadas.includes(paso.id);
    set({ pasoActual: indice, verificacionPasoActual: verificada });
  },
  marcarPasoCompletado: (indice) =>
    set((s) => ({
      pasosCompletados: s.pasosCompletados.includes(indice)
        ? s.pasosCompletados
        : [...s.pasosCompletados, indice],
    })),
  marcarVerificacion: (pasoId) =>
    set((s) => ({
      verificacionesMarcadas: s.verificacionesMarcadas.includes(pasoId)
        ? s.verificacionesMarcadas
        : [...s.verificacionesMarcadas, pasoId],
      verificacionPasoActual: true,
    })),
  setVerificacionPasoActual: (marcada) =>
    set({ verificacionPasoActual: marcada }),
  setCompletado: (valor) => set({ completado: valor }),
  setCargando: (valor) => set({ cargando: valor }),
  sincronizarProgreso: (data) =>
    set({
      pasoActual: data.paso_actual,
      pasosCompletados: data.pasos_completados,
      verificacionesMarcadas: data.verificaciones_marcadas,
      completado: !!data.completado_en,
    }),
  reset: () =>
    set({
      proceso: null,
      pasoActual: 0,
      pasosCompletados: [],
      verificacionesMarcadas: [],
      verificacionPasoActual: false,
      completado: false,
      cargando: false,
    }),
  pasoActivo: () => {
    const { proceso, pasoActual } = get();
    return proceso?.pasos[pasoActual] ?? null;
  },
  puedeAvanzar: () => {
    const paso = get().pasoActivo();
    if (!paso) return false;
    if (paso.texto_verificacion && !get().verificacionPasoActual) {
      return false;
    }
    return true;
  },
}));
