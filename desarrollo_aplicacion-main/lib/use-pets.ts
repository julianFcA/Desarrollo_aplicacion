"use client";

import { useSyncExternalStore } from "react";
import type { Pet } from "@/lib/pets";
import {
  getPets,
  PETS_CHANGED_EVENT,
  PETS_STORAGE_KEY,
} from "@/lib/storage/pets";

interface PetsSnapshot {
  pets: Pet[];
  /** `true` cuando la colección ya se leyó de `localStorage`. */
  hydrated: boolean;
}

const EMPTY_PETS: Pet[] = [];
const SERVER_SNAPSHOT: PetsSnapshot = { pets: EMPTY_PETS, hydrated: false };

const listeners = new Set<() => void>();

let snapshot: PetsSnapshot = SERVER_SNAPSHOT;
let initialized = false;
let listening = false;

function refresh(): void {
  snapshot = { pets: getPets(), hydrated: true };
  initialized = true;
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent): void {
  if (event.key === PETS_STORAGE_KEY || event.key === null) {
    refresh();
  }
}

function ensureListeners(): void {
  if (listening || typeof window === "undefined") return;

  listening = true;
  window.addEventListener(PETS_CHANGED_EVENT, refresh);
  window.addEventListener("storage", handleStorage);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    snapshot = { pets: getPets(), hydrated: true };
    /* `useSyncExternalStore` ya está suscrito: hay que avisarle de que la
       lectura inicial de `localStorage` cambió el snapshot. */
    listener();
  }

  ensureListeners();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): PetsSnapshot {
  return snapshot;
}

function getServerSnapshot(): PetsSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Fuente única de mascotas para las vistas cliente.
 *
 * Lee la colección de `localStorage` al suscribirse (el servidor siempre ve
 * `[]`), se sincroniza con los cambios realizados desde cualquier acción
 * (`createPet`, `updatePet`, `deletePet`) y con otras pestañas mediante el
 * evento `storage`. `hydrated` permite distinguir "todavía no se leyó" de
 * "se leyó y no hay mascotas".
 */
export function usePets(): PetsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
