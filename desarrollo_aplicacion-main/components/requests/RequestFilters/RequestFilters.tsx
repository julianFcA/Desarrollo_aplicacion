"use client";

import { useId } from "react";
import SearchBar from "@/components/ui/SearchBar/SearchBar";
import Select from "@/components/ui/Select";
import Search from "@/components/icons/search";
import {
  DATE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type DateFilter,
  type RequestFilterState,
  type StatusFilter,
} from "@/components/requests/data";

export interface RequestFiltersProps {
  filters: RequestFilterState;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onDateChange: (value: DateFilter) => void;
}

/**
 * Fila de filtros del historial: búsqueda + estado + fecha.
 *
 * Componente controlado: el estado y el filtrado real viven en
 * `RequestHistoryCard`, que delega aquí solo la captura de cambios.
 */
export default function RequestFilters({
  filters,
  onSearchChange,
  onStatusChange,
  onDateChange,
}: RequestFiltersProps) {
  const searchId = useId();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
      {/* Búsqueda por mascota, servicio, proveedor o id. */}
      <div className="flex min-w-0 flex-col gap-2">
        <label htmlFor={searchId} className="text-label font-bold text-body">
          Buscar solicitud
        </label>
        <SearchBar
          id={searchId}
          icon={Search}
          name="request-search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar mascota o servicio..."
          className="h-12 rounded-input border border-border bg-surface px-3.5"
        />
      </div>

      <Select
        label="Estado"
        options={STATUS_FILTER_OPTIONS}
        value={filters.status}
        onChange={(value) => onStatusChange(value as StatusFilter)}
      />

      <Select
        label="Fecha"
        options={DATE_FILTER_OPTIONS}
        value={filters.date}
        onChange={(value) => onDateChange(value as DateFilter)}
      />
    </div>
  );
}
