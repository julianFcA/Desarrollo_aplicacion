import type { Metadata } from "next";
import MyPetsView from "@/components/my-pets/MyPetsView/MyPetsView";

export const metadata: Metadata = {
  title: "Mis Mascotas · PetCare",
};

/**
 * Página de gestión de mascotas (`/my-pets`).
 *
 * Solo composición: `MyPetsView` es el límite cliente que lee la colección
 * persistida en `localStorage` y decide el estado con mascotas o el estado
 * vacío. El shell (Aside + Navbar + main) lo aporta `AppLayout`
 * (`app/(app)/layout.tsx`).
 */
export default function MyPetsPage() {
  return <MyPetsView />;
}
