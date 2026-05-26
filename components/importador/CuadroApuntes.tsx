"use client";

import { memo, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

function CuadroApuntesInner({
  textoRef,
  onSuficienteChange,
  disabled,
}: {
  textoRef: React.RefObject<HTMLTextAreaElement>;
  onSuficienteChange: (suficiente: boolean) => void;
  disabled?: boolean;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revisarLongitud = () => {
    const len = textoRef.current?.value.trim().length ?? 0;
    onSuficienteChange(len >= 15);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Textarea
      ref={textoRef}
      defaultValue=""
      placeholder="Ej: Este proceso es mensual. Contacto dudas: María ext. 234"
      className="min-h-[100px] text-sm"
      disabled={disabled}
      onChange={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(revisarLongitud, 200);
      }}
    />
  );
}

export const CuadroApuntes = memo(CuadroApuntesInner);
