"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store/useEditorStore";
import { cn } from "@/lib/utils";

function ItemPasoSortable({
  id,
  titulo,
  orden,
  seleccionado,
  onSeleccionar,
  onEliminar,
}: {
  id: string;
  titulo: string;
  orden: number;
  seleccionado: boolean;
  onSeleccionar: () => void;
  onEliminar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-md border px-2 py-2 mb-1",
        seleccionado && "border-primary bg-primary/5"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Arrastrar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex-1 text-left text-sm truncate"
        onClick={onSeleccionar}
      >
        <span className="font-mono text-xs text-muted-foreground mr-1">
          {orden + 1}.
        </span>
        {titulo || "Sin título"}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onEliminar}
        aria-label="Eliminar paso"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function ListaPasos({
  onAgregar,
  onReordenar,
}: {
  onAgregar: () => void;
  onReordenar?: () => void;
}) {
  const pasos = useEditorStore((s) => s.pasos);
  const pasoSeleccionadoId = useEditorStore((s) => s.pasoSeleccionadoId);
  const seleccionarPaso = useEditorStore((s) => s.seleccionarPaso);
  const reordenarPasos = useEditorStore((s) => s.reordenarPasos);
  const eliminarPaso = useEditorStore((s) => s.eliminarPaso);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pasos.findIndex((p) => p.id === active.id);
    const newIndex = pasos.findIndex((p) => p.id === over.id);
    reordenarPasos(arrayMove(pasos, oldIndex, newIndex));
    // Guardamos el nuevo orden al soltar para que no se pierda si el usuario sale rápido.
    onReordenar?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Pasos</h3>
        <Button type="button" size="sm" variant="outline" onClick={onAgregar}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={pasos.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto">
            {pasos.map((p) => (
              <ItemPasoSortable
                key={p.id}
                id={p.id}
                titulo={p.titulo}
                orden={p.orden}
                seleccionado={p.id === pasoSeleccionadoId}
                onSeleccionar={() => seleccionarPaso(p.id)}
                onEliminar={() => eliminarPaso(p.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
