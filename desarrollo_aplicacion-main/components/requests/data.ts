/** Estado de una solicitud de servicio (variantes semánticas del Badge). */
export type RequestStatusValue = "pending" | "approved" | "canceled";

/** Fila del historial de solicitudes. */
export interface PetServiceRequest {
  id: string;
  service: string;
  pet: string;
  /** Fecha ya formateada para la interfaz (p. ej. "10 nov 2026"). */
  date: string;
  /** Fecha ISO (`YYYY-MM-DD`) para filtrar por mes. */
  isoDate: string;
  /** Hora ya formateada para la interfaz (p. ej. "11:30"). */
  time: string;
  provider: string;
  status: RequestStatusValue;
}

/** Opciones visibles del filtro de estado. */
export const STATUS_FILTER_OPTIONS = [
  "Todos los estados",
  "Pendiente",
  "Aprobada",
  "Cancelada",
] as const;

/** Opciones visibles del filtro de fecha. */
export const DATE_FILTER_OPTIONS = [
  "Todas las fechas",
  "Este mes",
  "Mes anterior",
] as const;

export type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];
export type DateFilter = (typeof DATE_FILTER_OPTIONS)[number];

export interface RequestFilterState {
  search: string;
  status: StatusFilter;
  date: DateFilter;
}

export const INITIAL_REQUEST_FILTERS: RequestFilterState = {
  search: "",
  status: STATUS_FILTER_OPTIONS[0],
  date: DATE_FILTER_OPTIONS[0],
};

const STATUS_BY_LABEL: Partial<Record<StatusFilter, RequestStatusValue>> = {
  Pendiente: "pending",
  Aprobada: "approved",
  Cancelada: "canceled",
};

function matchesDate(isoDate: string, filter: DateFilter, reference: Date): boolean {
  if (filter === DATE_FILTER_OPTIONS[0]) return true;

  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return false;

  const requestMonth = year * 12 + (month - 1);
  const referenceMonth = reference.getFullYear() * 12 + reference.getMonth();
  const targetMonth =
    filter === DATE_FILTER_OPTIONS[2] ? referenceMonth - 1 : referenceMonth;

  return requestMonth === targetMonth;
}

/**
 * Aplica búsqueda + estado + fecha sobre el historial.
 *
 * La búsqueda no distingue mayúsculas y compara servicio, mascota, proveedor
 * e id. El filtro de fecha se calcula sobre el mes actual (o el anterior) de
 * la fecha de referencia, de modo que "Este mes" sigue siendo correcto al
 * cambiar de mes.
 */
export function filterRequests(
  list: readonly PetServiceRequest[],
  filters: RequestFilterState,
  reference: Date = new Date()
): PetServiceRequest[] {
  const query = filters.search.trim().toLowerCase();
  const status = STATUS_BY_LABEL[filters.status];

  return list.filter((request) => {
    if (status && request.status !== status) return false;
    if (!matchesDate(request.isoDate, filters.date, reference)) return false;
    if (!query) return true;

    return [request.id, request.service, request.pet, request.provider].some(
      (value) => value.toLowerCase().includes(query)
    );
  });
}

/**
 * Datos estáticos de referencia de esta fase (sin backend, fetch ni
 * persistencia). Reemplazar esta constante por la fuente real cuando exista.
 */
export const requests: readonly PetServiceRequest[] = [
  {
    id: "REQ-001",
    service: "Baño y peluquería",
    pet: "Luna",
    date: "10 nov 2026",
    isoDate: "2026-11-10",
    time: "11:30",
    provider: "Happy Paws",
    status: "pending",
  },
  {
    id: "REQ-002",
    service: "Consulta veterinaria",
    pet: "Milo",
    date: "09 nov 2026",
    isoDate: "2026-11-09",
    time: "16:00",
    provider: "Clínica VetVida",
    status: "pending",
  },
  {
    id: "REQ-003",
    service: "Vacunación anual",
    pet: "Luna",
    date: "04 nov 2026",
    isoDate: "2026-11-04",
    time: "09:00",
    provider: "Clínica VetVida",
    status: "approved",
  },
  {
    id: "REQ-004",
    service: "Paseo de mascotas",
    pet: "Luna",
    date: "02 nov 2026",
    isoDate: "2026-11-02",
    time: "08:00",
    provider: "Paws and Care",
    status: "approved",
  },
  {
    id: "REQ-005",
    service: "Baño y peluquería",
    pet: "Milo",
    date: "28 oct 2026",
    isoDate: "2026-10-28",
    time: "14:00",
    provider: "Happy Paws",
    status: "canceled",
  },
  {
    id: "REQ-006",
    service: "Consulta veterinaria",
    pet: "Luna",
    date: "22 oct 2026",
    isoDate: "2026-10-22",
    time: "12:00",
    provider: "Clínica VetVida",
    status: "approved",
  },
];
