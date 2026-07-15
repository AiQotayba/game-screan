import { fontTjwal } from "@/lib/font-tjwal";

export default function DisplayRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${fontTjwal.className} ${fontTjwal.variable}`}>
      {children}
    </div>
  );
}
