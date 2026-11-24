/** Estado de salud mostrado en las tarjetas de mascota. */
export type PetHealth = "healthy" | "follow-up";

/** Unidad con la que se guarda la edad de la mascota. */
export type PetAgeUnit = "años" | "meses";

/** Unidad con la que se guarda el peso de la mascota. */
export type PetWeightUnit = "kg";

/**
 * Mascota persistida en `localStorage` (clave `petcare.pets.v1`).
 *
 * El modelo reutiliza los campos del formulario "Registrar Nueva Mascota"
 * (nombre, especie, raza, edad y peso) y conserva los datos que ya consumía la
 * tarjeta de mascota (`health`, `registeredAt`). `photo` es una ruta local o un
 * data URL; `null` cuando no se cargó fotografía.
 */
export interface Pet {
  id: string;
  name: string;
  /** Tipo de mascota (Felino, Canino, Ave, Roedor…). */
  species: string;
  breed: string;
  age: number;
  ageUnit: PetAgeUnit;
  weight: number;
  weightUnit: PetWeightUnit;
  photo: string | null;
  health: PetHealth;
  /** Fecha de registro en formato ISO corto (`YYYY-MM-DD`). */
  registeredAt: string;
}

/** `3 años` a partir de los campos numéricos de la mascota. */
export function formatPetAge(pet: Pet): string {
  return `${pet.age} ${pet.ageUnit}`;
}

/** `"Golden Retriever · 3 años"` (resumen de una línea). */
export function describePet(pet: Pet): string {
  return [pet.breed, formatPetAge(pet)].join(" · ");
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/**
 * `2026-11-12` → `12 nov 2026` (formato determinista, sin depender del
 * ICU/locale del runtime).
 */
export function formatRegisteredAt(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;

  const [year, month, day] = parts.map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return isoDate;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return isoDate;

  return `${day} ${MONTHS[month - 1]} ${year}`;
}
