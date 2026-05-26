"use client";

import { useCallback, useRef, useState } from "react";
import { Stage, Layer, Rect, Arrow, Circle, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import type { Anotacion, TipoAnotacion } from "@/lib/supabase/tipos";
import { cn } from "@/lib/utils";

const COLORES = {
  rojo: "#dc2626",
  amarillo: "#eab308",
  verde: "#16a34a",
};

type Herramienta = TipoAnotacion | "seleccionar";

function ImagenFondo({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(src, "anonymous");
  return image ? (
    <KonvaImage image={image} width={width} height={height} />
  ) : null;
}

export function LienzoAnotacion({
  imagenUrl,
  anotacionesIniciales = [],
  onGuardar,
  onCancelar,
}: {
  imagenUrl: string;
  anotacionesIniciales?: Anotacion[];
  onGuardar: (anotaciones: Anotacion[], imagenExportada: Blob) => void;
  onCancelar: () => void;
}) {
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>(anotacionesIniciales);
  const [herramienta, setHerramienta] = useState<Herramienta>("flecha");
  const [color, setColor] = useState<"rojo" | "amarillo" | "verde">("rojo");
  const [dibujando, setDibujando] = useState(false);
  const [inicio, setInicio] = useState({ x: 0, y: 0 });
  const [temp, setTemp] = useState<Partial<Anotacion> | null>(null);
  const contadorCirculo = useRef(
    anotacionesIniciales.filter((a) => a.tipo === "circulo").length + 1
  );
  const stageRef = useRef<import("konva").default.Stage>(null);

  const ancho = 800;
  const alto = 500;

  const agregarAnotacion = useCallback((a: Anotacion) => {
    setAnotaciones((prev) => [...prev, a]);
  }, []);

  const handleMouseDown = (e: import("konva").default.KonvaEventObject<MouseEvent>) => {
    if (herramienta === "seleccionar") return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setDibujando(true);
    setInicio({ x: pos.x, y: pos.y });

    if (herramienta === "texto") {
      const texto = window.prompt("Texto de la etiqueta:");
      if (texto) {
        agregarAnotacion({
          id: crypto.randomUUID(),
          tipo: "texto",
          x: pos.x,
          y: pos.y,
          texto,
          color,
        });
      }
      setDibujando(false);
      return;
    }

    if (herramienta === "circulo") {
      const num = contadorCirculo.current++;
      agregarAnotacion({
        id: crypto.randomUUID(),
        tipo: "circulo",
        x: pos.x - 16,
        y: pos.y - 16,
        width: 32,
        height: 32,
        numero: num,
        color,
      });
      setDibujando(false);
      return;
    }

    setTemp({
      id: crypto.randomUUID(),
      tipo: herramienta,
      x: pos.x,
      y: pos.y,
      color,
    });
  };

  const handleMouseMove = (e: import("konva").default.KonvaEventObject<MouseEvent>) => {
    if (!dibujando || !temp) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setTemp({
      ...temp,
      width: pos.x - inicio.x,
      height: pos.y - inicio.y,
      points:
        temp.tipo === "flecha"
          ? [inicio.x, inicio.y, pos.x, pos.y]
          : undefined,
    });
  };

  const handleMouseUp = () => {
    if (!dibujando || !temp || !temp.tipo) {
      setDibujando(false);
      setTemp(null);
      return;
    }
    if (temp.tipo !== "texto" && temp.tipo !== "circulo") {
      agregarAnotacion(temp as Anotacion);
    }
    setDibujando(false);
    setTemp(null);
  };

  const exportar = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    onGuardar(anotaciones, blob);
  };

  const herramientas: { id: Herramienta; label: string }[] = [
    { id: "flecha", label: "Flecha" },
    { id: "rectangulo", label: "Resaltado" },
    { id: "circulo", label: "Círculo #" },
    { id: "texto", label: "Texto" },
    { id: "difuminado", label: "Ocultar" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {herramientas.map((h) => (
          <Button
            key={h.id}
            type="button"
            size="sm"
            variant={herramienta === h.id ? "default" : "outline"}
            onClick={() => setHerramienta(h.id)}
          >
            {h.label}
          </Button>
        ))}
        <span className="text-sm text-muted-foreground mx-2">Color:</span>
        {(["rojo", "amarillo", "verde"] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              "w-6 h-6 rounded-full border-2",
              color === c && "ring-2 ring-offset-2 ring-primary"
            )}
            style={{ backgroundColor: COLORES[c] }}
            onClick={() => setColor(c)}
            aria-label={c}
          />
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden bg-muted inline-block">
        <Stage
          ref={stageRef}
          width={ancho}
          height={alto}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Layer>
            <ImagenFondo src={imagenUrl} width={ancho} height={alto} />
            {anotaciones.map((a) => (
              <AnotacionShape key={a.id} a={a} />
            ))}
            {temp && temp.tipo && <AnotacionShape a={temp as Anotacion} />}
          </Layer>
        </Stage>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={exportar}>
          Guardar anotaciones
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setAnotaciones((a) => a.slice(0, -1))}
          disabled={anotaciones.length === 0}
        >
          Deshacer
        </Button>
      </div>
    </div>
  );
}

function AnotacionShape({ a }: { a: Anotacion }) {
  const stroke = COLORES[a.color];

  if (a.tipo === "flecha" && a.points) {
    return (
      <Arrow
        points={a.points}
        stroke={stroke}
        fill={stroke}
        strokeWidth={3}
        pointerLength={10}
        pointerWidth={10}
      />
    );
  }

  if (a.tipo === "rectangulo" || a.tipo === "difuminado") {
    return (
      <Rect
        x={a.x}
        y={a.y}
        width={a.width ?? 0}
        height={a.height ?? 0}
        stroke={a.tipo === "rectangulo" ? stroke : undefined}
        strokeWidth={a.tipo === "rectangulo" ? 3 : 0}
        fill={
          a.tipo === "difuminado"
            ? "rgba(0,0,0,0.7)"
            : `${stroke}33`
        }
      />
    );
  }

  if (a.tipo === "circulo") {
    return (
      <>
        <Circle
          x={(a.x ?? 0) + 16}
          y={(a.y ?? 0) + 16}
          radius={16}
          stroke={stroke}
          strokeWidth={3}
        />
        <Text
          x={(a.x ?? 0) + 10}
          y={(a.y ?? 0) + 8}
          text={String(a.numero ?? "")}
          fontSize={14}
          fontStyle="bold"
          fill={stroke}
        />
      </>
    );
  }

  if (a.tipo === "texto") {
    return (
      <Text
        x={a.x}
        y={a.y}
        text={a.texto ?? ""}
        fontSize={16}
        fontStyle="bold"
        fill={stroke}
      />
    );
  }

  return null;
}
