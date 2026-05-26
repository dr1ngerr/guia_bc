import { LayoutApp } from "@/components/compartido/Layout";
import { PerfilProvider } from "@/components/compartido/PerfilProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PerfilProvider>
      <LayoutApp>{children}</LayoutApp>
    </PerfilProvider>
  );
}
