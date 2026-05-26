import { create } from "zustand";
import type { Captura, Paso, Proceso } from "@/lib/supabase/tipos";

export type PasoEditor = Paso & { capturas: Captura[] };

interface EditorState {
  proceso: Proceso | null;
  pasos: PasoEditor[];
  pasoSeleccionadoId: string | null;
  sucio: boolean;
  guardando: boolean;
  ultimoGuardado: Date | null;

  setProceso: (proceso: Proceso) => void;
  setPasos: (pasos: PasoEditor[]) => void;
  seleccionarPaso: (id: string | null) => void;
  actualizarPaso: (id: string, datos: Partial<PasoEditor>) => void;
  agregarPaso: (paso: PasoEditor) => void;
  eliminarPaso: (id: string) => void;
  reordenarPasos: (pasos: PasoEditor[]) => void;
  setSucio: (valor: boolean) => void;
  setGuardando: (valor: boolean) => void;
  setUltimoGuardado: (fecha: Date | null) => void;
  pasoSeleccionado: () => PasoEditor | null;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  proceso: null,
  pasos: [],
  pasoSeleccionadoId: null,
  sucio: false,
  guardando: false,
  ultimoGuardado: null,

  setProceso: (proceso) => set({ proceso }),
  setPasos: (pasos) => set({ pasos }),
  seleccionarPaso: (id) => set({ pasoSeleccionadoId: id }),
  actualizarPaso: (id, datos) =>
    set((s) => ({
      pasos: s.pasos.map((p) => (p.id === id ? { ...p, ...datos } : p)),
      sucio: true,
    })),
  agregarPaso: (paso) =>
    set((s) => ({
      pasos: [...s.pasos, paso],
      pasoSeleccionadoId: paso.id,
      sucio: true,
    })),
  eliminarPaso: (id) =>
    set((s) => {
      const pasos = s.pasos.filter((p) => p.id !== id);
      return {
        pasos,
        pasoSeleccionadoId:
          s.pasoSeleccionadoId === id
            ? pasos[0]?.id ?? null
            : s.pasoSeleccionadoId,
        sucio: true,
      };
    }),
  reordenarPasos: (pasos) =>
    set({
      pasos: pasos.map((p, i) => ({ ...p, orden: i })),
      sucio: true,
    }),
  setSucio: (valor) => set({ sucio: valor }),
  setGuardando: (valor) => set({ guardando: valor }),
  setUltimoGuardado: (fecha) => set({ ultimoGuardado: fecha }),
  pasoSeleccionado: () => {
    const { pasos, pasoSeleccionadoId } = get();
    return pasos.find((p) => p.id === pasoSeleccionadoId) ?? null;
  },
  reset: () =>
    set({
      proceso: null,
      pasos: [],
      pasoSeleccionadoId: null,
      sucio: false,
      guardando: false,
      ultimoGuardado: null,
    }),
}));
