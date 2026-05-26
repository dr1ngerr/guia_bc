export type RolUsuario = "empleado" | "administrador";

export type EstadoProceso = "borrador" | "publicado";

export type Herramienta =
  | "Business Central"
  | "Google Sheets"
  | "Excel"
  | "Web"
  | "Email"
  | "Otra";

export type TipoAlerta = "peligro" | "advertencia" | "consejo";

export type TipoAnotacion =
  | "flecha"
  | "rectangulo"
  | "circulo"
  | "texto"
  | "difuminado";

export interface Anotacion {
  id: string;
  tipo: TipoAnotacion;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  texto?: string;
  numero?: number;
  color: "rojo" | "amarillo" | "verde";
  rotation?: number;
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      empresa: {
        Row: {
          id: string;
          nombre: string;
          logo_url: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["empresa"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["empresa"]["Row"]>;
      };
      perfiles: {
        Row: {
          id: string;
          email: string;
          nombre: string | null;
          rol: RolUsuario;
          empresa_id: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["perfiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Row"]>;
      };
      categorias: {
        Row: {
          id: string;
          nombre: string;
          orden: number;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categorias"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categorias"]["Row"]>;
      };
      procesos: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          herramienta: Herramienta;
          icono: string;
          categoria: string | null;
          duracion_minutos: number | null;
          estado: EstadoProceso;
          creado_por: string | null;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["procesos"]["Row"]> & {
          nombre: string;
          herramienta: Herramienta;
        };
        Update: Partial<Database["public"]["Tables"]["procesos"]["Row"]>;
      };
      pasos: {
        Row: {
          id: string;
          id_proceso: string;
          orden: number;
          titulo: string;
          descripcion: string | null;
          tipo_alerta: TipoAlerta | null;
          texto_alerta: string | null;
          texto_verificacion: string | null;
          consejo: string | null;
          url_video: string | null;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pasos"]["Row"]> & {
          id_proceso: string;
          orden: number;
          titulo: string;
        };
        Update: Partial<Database["public"]["Tables"]["pasos"]["Row"]>;
      };
      capturas: {
        Row: {
          id: string;
          id_paso: string;
          url: string;
          pie_imagen: string | null;
          orden: number;
          anotaciones: Anotacion[];
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["capturas"]["Row"]> & {
          id_paso: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["capturas"]["Row"]>;
      };
      progreso_usuario: {
        Row: {
          id: string;
          id_usuario: string;
          id_proceso: string;
          paso_actual: number;
          pasos_completados: number[];
          verificaciones_marcadas: string[];
          iniciado_en: string;
          completado_en: string | null;
        };
        Insert: Partial<
          Database["public"]["Tables"]["progreso_usuario"]["Row"]
        > & {
          id_usuario: string;
          id_proceso: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["progreso_usuario"]["Row"]
        >;
      };
      invitaciones: {
        Row: {
          id: string;
          email: string;
          rol: RolUsuario;
          invitado_por: string | null;
          aceptada: boolean;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invitaciones"]["Row"]> & {
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitaciones"]["Row"]>;
      };
    };
  };
}

export type Proceso = Database["public"]["Tables"]["procesos"]["Row"];
export type Paso = Database["public"]["Tables"]["pasos"]["Row"];
export type Captura = Database["public"]["Tables"]["capturas"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
export type ProgresoUsuario =
  Database["public"]["Tables"]["progreso_usuario"]["Row"];

export type ProcesoConPasos = Proceso & {
  pasos: (Paso & { capturas: Captura[] })[];
};

export const HERRAMIENTAS: Herramienta[] = [
  "Business Central",
  "Google Sheets",
  "Excel",
  "Web",
  "Email",
  "Otra",
];

export const ICONOS_PROCESO = [
  "📋",
  "🧾",
  "📊",
  "📧",
  "🌐",
  "💼",
  "📦",
  "👤",
  "💰",
  "⚙️",
];
