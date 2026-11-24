import type { Pet, PetAgeUnit, PetWeightUnit } from "@/lib/pets";

/** Clave única de la colección de mascotas en `localStorage`. */
export const PETS_STORAGE_KEY = "petcare.pets.v1";

/** Evento interno que notifica a la capa React que la colección cambió. */
export const PETS_CHANGED_EVENT = "petcare:pets-changed";

/** Datos que acepta el formulario al registrar una mascota. */
export interface NewPetInput {
  name: string;
  species: string;
  breed: string;
  age: number;
  ageUnit: PetAgeUnit;
  weight: number;
  weightUnit: PetWeightUnit;
  photo?: string | null;
}

/** Campos editables de una mascota (el `id` y el registro no cambian). */
export type PetUpdate = Partial<Omit<Pet, "id" | "registeredAt">>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isPet(value: unknown): value is Pet {
  if (typeof value !== "object" || value === null) return false;

  const pet = value as Partial<Pet>;
  return (
    typeof pet.id === "string" &&
    typeof pet.name === "string" &&
    typeof pet.species === "string" &&
    typeof pet.breed === "string" &&
    typeof pet.age === "number" &&
    (pet.ageUnit === "años" || pet.ageUnit === "meses") &&
    typeof pet.weight === "number" &&
    pet.weightUnit === "kg" &&
    (pet.photo === null || typeof pet.photo === "string") &&
    (pet.health === "healthy" || pet.health === "follow-up") &&
    typeof pet.registeredAt === "string"
  );
}

function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function createPetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pet-${crypto.randomUUID()}`;
  }
  return `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Colección de mascotas persistida en el navegador.
 *
 * Sin clave (primer uso) devuelve `[]`: la aplicación muestra el estado vacío y
 * nunca inserta mascotas de ejemplo. En el servidor siempre devuelve `[]`
 * porque `localStorage` no existe.
 */
export function getPets(): Pet[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(PETS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPet) : [];
  } catch {
    return [];
  }
}

/** Persiste la colección completa y notifica a las vistas suscritas. */
export function savePets(pets: readonly Pet[]): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(pets));
  window.dispatchEvent(new Event(PETS_CHANGED_EVENT));
}

/** Crea una mascota con `id` único y la guarda en la colección actual. */
export function createPet(input: NewPetInput): Pet {
  const pet: Pet = {
    id: createPetId(),
    name: input.name.trim(),
    species: input.species,
    breed: input.breed,
    age: input.age,
    ageUnit: input.ageUnit,
    weight: input.weight,
    weightUnit: input.weightUnit,
    photo: input.photo ?? null,
    health: "healthy",
    registeredAt: todayISO(),
  };

  savePets([...getPets(), pet]);
  return pet;
}

/** Localiza una mascota por `id` y actualiza solo los campos recibidos. */
export function updatePet(id: string, patch: PetUpdate): Pet | null {
  const current = getPets();
  const existing = current.find((pet) => pet.id === id);
  if (!existing) return null;

  const updated: Pet = {
    ...existing,
    ...patch,
    id: existing.id,
    registeredAt: existing.registeredAt,
  };

  savePets(current.map((pet) => (pet.id === id ? updated : pet)));
  return updated;
}

/** Elimina una mascota por `id` y persiste la colección resultante. */
export function deletePet(id: string): void {
  savePets(getPets().filter((pet) => pet.id !== id));
}
