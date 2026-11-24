import Badge from "@/components/ui/Badge";
import EmptyPetsState from "@/components/my-pets/EmptyPetsState/EmptyPetsState";
import PetCard from "@/components/my-pets/PetCard/PetCard";
import type { Pet } from "@/lib/pets";

export interface PetListProps {
  pets: readonly Pet[];
  onAddPet: () => void;
  onEditPet: (pet: Pet) => void;
  onDeletePet: (pet: Pet) => void;
}

/**
 * Sección de mascotas: encabezado con contador, estado vacío o cuadrícula de
 * tarjetas según la colección local.
 *
 * El contador refleja las mascotas persistidas. El estado vacío vive en
 * `EmptyPetsState` y las tarjetas reutilizan `PetCard`, que ya aporta el
 * diseño de foto, estado, datos y acciones.
 */
export default function PetList({
  pets,
  onAddPet,
  onEditPet,
  onDeletePet,
}: PetListProps) {
  return (
    <section aria-labelledby="pets-list-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="pets-list-title" className="text-form-title text-primary-500">
          Tu familia, siempre cerca
        </h2>
        <Badge type="success">
          {pets.length} {pets.length === 1 ? "Mascota" : "Mascotas"}
        </Badge>
      </div>

      {pets.length === 0 ? (
        <EmptyPetsState onAddPet={onAddPet} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {pets.map((pet) => (
            <li key={pet.id} className="min-w-0">
              <PetCard
                pet={pet}
                onEdit={onEditPet}
                onDelete={onDeletePet}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
