import { LayoutApp } from "@/components/compartido/Layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutApp>{children}</LayoutApp>;
}
