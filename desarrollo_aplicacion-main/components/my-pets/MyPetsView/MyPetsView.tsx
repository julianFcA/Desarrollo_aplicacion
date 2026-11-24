"use client";

import { useState } from "react";
import AddPetModal from "@/components/my-pets/AddPetModal/AddPetModal";
import MyPetsHeader from "@/components/my-pets/MyPetsHeader/MyPetsHeader";
import MyPetsStats from "@/components/my-pets/MyPetsStats/MyPetsStats";
import PetList from "@/components/my-pets/PetList/PetList";
import PetWellbeingCard from "@/components/my-pets/PetWellbeingCard/PetWellbeingCard";
import UpcomingRequest from "@/components/my-pets/UpcomingRequest/UpcomingRequest";
import type { Pet } from "@/lib/pets";
import { deletePet } from "@/lib/storage/pets";
import { usePets } from "@/lib/use-pets";

/**
 * Composición cliente de Mis Mascotas.
 *
 * Mantiene una única instancia de `AddPetModal` para crear y editar, lee la
 * colección compartida de `localStorage` mediante `usePets` y decide la
 * visibilidad de las estadísticas y del bloque inferior a partir de
 * `pets.length`. La página sigue siendo un Server Component con `metadata`.
 */
export default function MyPetsView() {
  const { pets } = usePets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const hasPets = pets.length > 0;

  const openCreate = () => {
    setEditingPet(null);
    setModalOpen(true);
  };

  const openEdit = (pet: Pet) => {
    setEditingPet(pet);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPet(null);
  };

  const handleDelete = (pet: Pet) => {
    deletePet(pet.id);
  };

  return (
    <>
      <div className="flex flex-col gap-6 xl:gap-8">
        <MyPetsHeader onAddPet={openCreate} />

        {hasPets ? <MyPetsStats petCount={pets.length} /> : null}

        <PetList
          pets={pets}
          onAddPet={openCreate}
          onEditPet={openEdit}
          onDeletePet={handleDelete}
        />

        {hasPets ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-5">
            <UpcomingRequest />
            <PetWellbeingCard />
          </div>
        ) : null}
      </div>

      <AddPetModal
        key={editingPet?.id ?? "new"}
        open={modalOpen}
        pet={editingPet}
        onClose={closeModal}
      />
    </>
  );
}
