import type { GuideStep } from "@/lib/guia/step-by-step-types";

/** Datos de prueba (3 primeros pasos de «Devoluciones»). */
export const ejemploGuiaDevoluciones = {
  guideId: "devoluciones_001",
  title: "Devoluciones",
  totalEstimatedTime: "1h 40min",
  steps: [
    {
      title: "Acceder a la Plataforma Bravantia",
      description:
        "Ingresa a Business Central y accede al entorno de Bravantia.",
      estimatedMinutes: 2,
      helpText:
        "Si no recuerdas la contraseña, usa el gestor de claves de la empresa.",
    },
    {
      title: "Consultar Histórico de Facturas de Venta (Praylas)",
      description:
        "En Business Central, buscar la empresa 'Deportes Praylas S.L.' y acceder a su 'Histórico facturas venta'. Asegúrese de que la vista seleccionada sea 'Todo'.",
      estimatedMinutes: 5,
      helpText:
        "Si no aparece Praylas, revisa que el filtro por país esté en 'Todos'.",
      imageUrl: "https://ejemplo.com/captura_praylas.png",
    },
    {
      title: "Localizar la factura del cliente",
      description:
        "Filtra por número de factura o cliente y abre el documento original.",
      estimatedMinutes: 8,
      helpText: "Usa la búsqueda rápida (Ctrl+F) si la lista es larga.",
    },
  ] as GuideStep[],
};
