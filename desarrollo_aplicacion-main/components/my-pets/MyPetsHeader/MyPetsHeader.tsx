import Button from "@/components/ui/Button";

export interface MyPetsHeaderProps {
  /** Abre el modal de registro (el estado vive en `MyPetsView`). */
  onAddPet: () => void;
}

/**
 * Encabezado de la página Mis Mascotas: título, descripción y CTA para
 * agregar una mascota.
 *
 * En desktop la acción se alinea a la derecha; en mobile pasa a ancho
 * completo debajo del texto (docs/responsive.md, composición vertical).
 *
 * El estado del modal vive en `MyPetsView`, el límite cliente de la página,
 * para que My Pets, el estado vacío y la edición compartan una única instancia.
 */
export default function MyPetsHeader({ onAddPet }: MyPetsHeaderProps) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-h2 text-primary-500">Mis Mascotas</h1>
        <p className="text-description text-secondary">
          Gestiona la información de tus mascotas y mantén su información
          siempre actualizada.
        </p>
      </div>

      <Button
        label="Agregar Mascota"
        onClick={onAddPet}
        className="w-full shrink-0 justify-center md:w-auto"
      />
    </header>
  );
}
