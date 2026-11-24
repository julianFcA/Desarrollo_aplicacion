/** Estado de una solicitud de servicio (mismas variantes del Badge). */
export type ServiceRequestStatus = "pending" | "approved" | "canceled";

/**
 * Solicitud persistida en `localStorage` (clave `petcare.serviceRequests.v1`).
 *
 * La estructura queda preparada para que el Historial de Solicitudes pueda
 * leerla más adelante. `date` y `time` se guardan en bruto (`YYYY-MM-DD` y
 * `HH:MM`) para poder formatearlos según la vista.
 */
export interface ServiceRequestRecord {
  id: string;
  petId: string;
  petName: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  date: string;
  time: string;
  notes: string;
  status: ServiceRequestStatus;
  /** Fecha y hora de creación en formato ISO completo. */
  createdAt: string;
}

/** Clave única de la colección de solicitudes en `localStorage`. */
export const SERVICE_REQUESTS_STORAGE_KEY = "petcare.serviceRequests.v1";

/** Evento interno para futuras vistas reactivas del historial. */
export const SERVICE_REQUESTS_CHANGED_EVENT = "petcare:service-requests-changed";

/** Datos que produce el formulario de Solicitar Servicio. */
export interface NewServiceRequestInput {
  petId: string;
  petName: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  date: string;
  time: string;
  notes?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isServiceRequest(value: unknown): value is ServiceRequestRecord {
  if (typeof value !== "object" || value === null) return false;

  const request = value as Partial<ServiceRequestRecord>;
  return (
    typeof request.id === "string" &&
    typeof request.petId === "string" &&
    typeof request.petName === "string" &&
    typeof request.serviceId === "string" &&
    typeof request.serviceTitle === "string" &&
    typeof request.providerName === "string" &&
    typeof request.date === "string" &&
    typeof request.time === "string" &&
    typeof request.notes === "string" &&
    (request.status === "pending" ||
      request.status === "approved" ||
      request.status === "canceled") &&
    typeof request.createdAt === "string"
  );
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `REQ-${crypto.randomUUID()}`;
  }
  return `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Colección de solicitudes (vacía en el servidor y en el primer uso). */
export function getServiceRequests(): ServiceRequestRecord[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(SERVICE_REQUESTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isServiceRequest) : [];
  } catch {
    return [];
  }
}

/** Persiste la colección completa de solicitudes y notifica el cambio. */
export function saveServiceRequests(
  requests: readonly ServiceRequestRecord[]
): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    SERVICE_REQUESTS_STORAGE_KEY,
    JSON.stringify(requests)
  );
  window.dispatchEvent(new Event(SERVICE_REQUESTS_CHANGED_EVENT));
}

/** Añade una solicitud nueva en estado `pending`. */
export function addServiceRequest(
  input: NewServiceRequestInput
): ServiceRequestRecord {
  const request: ServiceRequestRecord = {
    id: createRequestId(),
    petId: input.petId,
    petName: input.petName,
    serviceId: input.serviceId,
    serviceTitle: input.serviceTitle,
    providerName: input.providerName,
    date: input.date,
    time: input.time,
    notes: input.notes ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  saveServiceRequests([...getServiceRequests(), request]);
  return request;
}

/** Actualiza únicamente el estado de una solicitud, localizada por `id`. */
export function updateServiceRequestStatus(
  id: string,
  status: ServiceRequestStatus
): ServiceRequestRecord | null {
  const current = getServiceRequests();
  const existing = current.find((request) => request.id === id);
  if (!existing) return null;

  const updated: ServiceRequestRecord = { ...existing, status };
  saveServiceRequests(
    current.map((request) => (request.id === id ? updated : request))
  );
  return updated;
}

/** Elimina una solicitud por `id`. */
export function deleteServiceRequest(id: string): void {
  saveServiceRequests(
    getServiceRequests().filter((request) => request.id !== id)
  );
}
