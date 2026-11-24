"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import Camera from "@/components/icons/camera";
import X from "@/components/icons/x";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal/Modal";
import Select from "@/components/ui/Select";
import type { Pet } from "@/lib/pets";
import { createPet, updatePet } from "@/lib/storage/pets";

const SPECIES = ["Felino", "Canino", "Ave", "Roedor"] as const;
type Species = (typeof SPECIES)[number];

/** Razas de ejemplo por especie (sin backend en esta fase). */
const BREEDS: Record<Species, readonly string[]> = {
  Felino: ["Europeo común", "Siamés", "Persa"],
  Canino: ["Golden Retriever", "Labrador", "Dachshund"],
  Ave: ["Periquito", "Canario", "Cotorra"],
  Roedor: ["Hámster", "Cobaya", "Conejo"],
};

const INITIAL_SPECIES: Species = "Felino";

interface AddPetForm {
  name: string;
  species: Species;
  breed: string;
  age: string;
  weight: string;
}

const INITIAL_FORM: AddPetForm = {
  name: "",
  species: INITIAL_SPECIES,
  breed: BREEDS[INITIAL_SPECIES][0],
  age: "",
  weight: "",
};

function formFromPet(pet: Pet): AddPetForm {
  const species = SPECIES.includes(pet.species as Species)
    ? (pet.species as Species)
    : INITIAL_SPECIES;

  return {
    name: pet.name,
    species,
    breed: pet.breed,
    age: String(pet.age),
    weight: String(pet.weight),
  };
}

interface FormErrors {
  name?: string;
  age?: string;
  weight?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

/** Lado máximo y calidad al recomprimir fotos grandes antes de guardarlas. */
const MAX_STORED_IMAGE_SIDE = 1000;
const MAX_INLINE_DATA_URL_LENGTH = 600_000;
const JPEG_QUALITY = 0.82;

/* El Input y el Select del kit fijan fondo blanco en el control; el formulario
   del Modal usa el fondo #f1f3f5 definido para esta pieza. Se aplica desde el
   wrapper para no alterar los componentes compartidos. */
const INPUT_CLASSES = "[&_input]:bg-form-input [&_input]:border-form-border";
const SELECT_CLASSES = "[&>button]:bg-form-input";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer la imagen."));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer la imagen."));

    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = src;
  });
}

/**
 * Convierte la fotografía a un data URL base64 listo para `localStorage`.
 *
 * Las imágenes pequeñas se guardan tal cual; las grandes se reducen y
 * recomprimen en JPEG para no agotar la cuota del navegador. El resultado
 * siempre es una cadena `data:image/...;base64,...`.
 */
async function fileToPetPhoto(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);
  if (original.length <= MAX_INLINE_DATA_URL_LENGTH) return original;

  try {
    const image = await loadImage(original);
    const scale = Math.min(
      1,
      MAX_STORED_IMAGE_SIDE / Math.max(image.width, image.height)
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return original;

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    /* Si el navegador no puede recomprimir, se conserva el original. */
    return original;
  }
}

export interface AddPetModalProps {
  /** Estado de apertura controlado por `MyPetsView`. */
  open: boolean;
  /** Cierra el modal (X, Cancelar o Escape). */
  onClose: () => void;
  /** Mascota a editar; sin valor, el modal registra una nueva. */
  pet?: Pet | null;
}

/**
 * Modal "Registrar Nueva Mascota" / "Editar Mascota" (`/my-pets`).
 *
 * Reutiliza el `Modal` (overlay + blur), `Input`, `Select` y `Button` del UI
 * Kit. Mantiene estado local del formulario, validación en cliente y la
 * dependencia Especie → Raza. Al guardar crea o actualiza la mascota en la
 * colección local (`localStorage`) mediante `lib/storage/pets.ts`; no hay API
 * real, backend ni peticiones HTTP.
 *
 * Escape cierra el modal (y limpia el formulario). Si el dropdown de un
 * `Select` está abierto, su propio `preventDefault` evita que Escape cierre
 * también el modal. El `focus trap` queda fuera de esta fase porque `Modal`
 * todavía no lo implementa (docs/design-system.md §5.13).
 */
export default function AddPetModal({
  open,
  onClose,
  pet = null,
}: AddPetModalProps) {
  const isEditing = pet !== null;

  const [form, setForm] = useState<AddPetForm>(() =>
    pet ? formFromPet(pet) : { ...INITIAL_FORM },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [photo, setPhoto] = useState<string | null>(pet?.photo ?? null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoReadId = useRef(0);
  const titleId = useId();

  const resetForm = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    photoReadId.current += 1;
    setForm({ ...INITIAL_FORM });
    setErrors({});
    setPhoto(null);
    setPhotoName(null);
    setPhotoError(null);
    setReadingPhoto(false);
    setSaveError(null);
    setDragging(false);
    setSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Escape → cerrar. Un `Select` abierto ya hace preventDefault en su Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  // Cancelar el guardado simulado si el modal se desmonta antes de tiempo.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const breedOptions = useMemo(() => {
    const options = BREEDS[form.species];
    return form.breed && !options.includes(form.breed)
      ? [form.breed, ...options]
      : options;
  }, [form.breed, form.species]);

  const handleSpeciesChange = (value: string) => {
    const species = SPECIES.includes(value as Species)
      ? (value as Species)
      : INITIAL_SPECIES;
    setForm((current) => ({
      ...current,
      species,
      breed: BREEDS[species][0],
    }));
  };

  const handlePhoto = async (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;

    /* Invalida cualquier lectura anterior que aún esté en curso. */
    const readId = photoReadId.current + 1;
    photoReadId.current = readId;

    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();
    const hasValidType =
      ACCEPTED_MIME_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.includes(extension);

    if (!hasValidType) {
      setReadingPhoto(false);
      setPhoto(null);
      setPhotoName(null);
      setPhotoError("El archivo debe ser JPG o PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setReadingPhoto(false);
      setPhoto(null);
      setPhotoName(null);
      setPhotoError("La imagen no puede superar los 5 MB.");
      return;
    }

    setReadingPhoto(true);
    try {
      /* Se convierte en el momento de elegirla: la mascota siempre se guarda
         en `localStorage` con un data URL base64, nunca con un objeto File. */
      const dataUrl = await fileToPetPhoto(file);
      if (photoReadId.current !== readId) return;
      setPhoto(dataUrl);
      setPhotoName(file.name);
    } catch {
      if (photoReadId.current !== readId) return;
      setPhoto(null);
      setPhotoName(null);
      setPhotoError("No pudimos procesar la imagen. Inténtalo de nuevo.");
    } finally {
      if (photoReadId.current === readId) setReadingPhoto(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handlePhoto(event.dataTransfer.files?.[0]);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const name = form.name.trim();

    if (!name) {
      next.name = "El nombre es obligatorio.";
    } else if (name.length < 2) {
      next.name = "El nombre debe tener al menos 2 caracteres.";
    } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/.test(name)) {
      next.name = "El nombre solo puede contener letras.";
    }

    const age = Number(form.age);
    if (!form.age) {
      next.age = "La edad es obligatoria.";
    } else if (!Number.isFinite(age) || age <= 0) {
      next.age = "Introduce una edad válida.";
    }

    const weight = Number(form.weight);
    if (!form.weight) {
      next.weight = "El peso es obligatorio.";
    } else if (!Number.isFinite(weight) || weight <= 0) {
      next.weight = "Introduce un peso válido.";
    }

    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || readingPhoto) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaveError(null);
    setSaving(true);

    try {
      /* Pequeña pausa para conservar el estado Loading del botón del kit. */
      await new Promise<void>((resolve) => {
        saveTimer.current = setTimeout(() => {
          saveTimer.current = null;
          resolve();
        }, 600);
      });

      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed,
        age: Number(form.age),
        ageUnit: "años" as const,
        weight: Number(form.weight),
        weightUnit: "kg" as const,
        photo,
      };

      if (pet) {
        const updated = updatePet(pet.id, payload);
        if (!updated) {
          throw new Error("La mascota ya no existe.");
        }
      } else {
        createPet(payload);
      }

      resetForm();
      onClose();
    } catch {
      setSaveError(
        "No pudimos guardar la mascota. Revisa el espacio disponible en tu navegador e inténtalo de nuevo.",
      );
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal labelledBy={titleId}>
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-card bg-surface shadow-float">
        <header className="flex items-start justify-between gap-4 border-b border-form-border p-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id={titleId}
              className="text-form-title font-bold text-primary-500"
            >
              {isEditing ? "Editar Mascota" : "Registrar Nueva Mascota"}
            </h2>
            <p className="text-control-sm text-secondary">
              {isEditing
                ? "Actualiza los datos de tu mascota."
                : "Qué bueno tenerte de vuelta. Tu mascota te espera."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-full p-1.5 text-primary-600 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4 p-6">
            <Input
              label="Nombre"
              placeholder="Milo"
              value={form.name}
              onChange={(value) => {
                setForm((current) => ({ ...current, name: value }));
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              error={errors.name}
              required
              className={INPUT_CLASSES}
            />

            <Select
              label="Especie"
              options={SPECIES}
              value={form.species}
              onChange={handleSpeciesChange}
              required
              className={SELECT_CLASSES}
            />

            <Select
              label="Raza"
              options={breedOptions}
              value={form.breed}
              onChange={(value) =>
                setForm((current) => ({ ...current, breed: value }))
              }
              required
              className={SELECT_CLASSES}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Edad"
                placeholder="9 años"
                value={form.age}
                onChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    age: value.replace(/\D/g, ""),
                  }));
                  if (errors.age) {
                    setErrors((current) => ({ ...current, age: undefined }));
                  }
                }}
                error={errors.age}
                required
                className={INPUT_CLASSES}
              />

              <Input
                label="Peso"
                placeholder="10 Kg"
                value={form.weight}
                onChange={(value) => {
                  const normalized = value
                    .replace(/,/g, ".")
                    .replace(/[^\d.]/g, "");
                  const [integer, ...decimals] = normalized.split(".");
                  const clean = decimals.length
                    ? `${integer}.${decimals.join("")}`
                    : integer;

                  setForm((current) => ({ ...current, weight: clean }));
                  if (errors.weight) {
                    setErrors((current) => ({
                      ...current,
                      weight: undefined,
                    }));
                  }
                }}
                error={errors.weight}
                required
                className={INPUT_CLASSES}
              />
            </div>

            <p className="text-note text-secondary">
              * Campos obligatorios. Puedes editar estos datos más adelante.
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={[
                "flex flex-col items-center gap-4 rounded-card border-[1.5px] border-dashed p-6 text-center",
                "md:flex-row md:text-left",
                dragging
                  ? "border-primary-500 bg-chip"
                  : photoError
                    ? "border-accent bg-form-surface"
                    : "border-form-border-dashed bg-form-surface",
              ].join(" ")}
            >
              <span className="flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-chip text-primary-500">
                {photo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Camera className="size-7" aria-hidden="true" />
                )}
              </span>

              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:items-start">
                <p className="text-control font-bold text-ink">
                  Subir fotografía de la mascota
                </p>
                <p className="text-support text-secondary">
                  Arrastra aquí tu foto · JPG o PNG, hasta 5 MB
                </p>

                <Button
                  type="secondary"
                  label={readingPhoto ? "Procesando…" : "Seleccionar archivo"}
                  state={readingPhoto ? "loading" : "default"}
                  onClick={() => fileInputRef.current?.click()}
                  className="justify-center"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    void handlePhoto(event.target.files?.[0])
                  }
                />

                {photoName ? (
                  <p className="max-w-full truncate text-note text-primary-600">
                    Archivo seleccionado: {photoName}
                  </p>
                ) : photo ? (
                  <p className="max-w-full truncate text-note text-primary-600">
                    Fotografía actual cargada
                  </p>
                ) : null}

                {photoError ? (
                  <p role="alert" className="text-note text-accent">
                    {photoError}
                  </p>
                ) : null}
              </div>
            </div>

            {saveError ? (
              <p role="alert" className="text-note text-accent">
                {saveError}
              </p>
            ) : null}
          </div>

          <footer className="grid grid-cols-1 gap-4 border-t border-form-border p-6 md:grid-cols-2">
            <Button
              type="secondary"
              label="Cancelar"
              onClick={handleClose}
              className="w-full justify-center text-form-cancel"
            />
            <Button
              submit
              label={isEditing ? "Guardar cambios" : "Guardar"}
              state={saving || readingPhoto ? "loading" : "default"}
              className="w-full justify-center"
            />
          </footer>
        </form>
      </div>
    </Modal>
  );
}
