import Button from "@/components/ui/Button";
import ChevronRight from "@/components/icons/chevron-right";

export interface RequestPaginationProps {
  /** Total de solicitudes visibles tras aplicar los filtros. */
  total: number;
}

/**
 * Paginación del historial. El historial filtrado cabe en una sola página;
 * el resumen se recalcula con el total recibido y los controles quedan
 * preparados para conectar paginación real más adelante.
 */
export default function RequestPagination({ total }: RequestPaginationProps) {
  const summary =
    total === 0
      ? "Sin solicitudes para mostrar"
      : `Mostrando 1–${total} de ${total} solicitudes`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-support text-secondary" aria-live="polite">
        {summary}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="secondary"
          label="Página anterior"
          showText={false}
          state="disabled"
          leftIcon={<ChevronRight aria-hidden="true" className="size-4 rotate-180" />}
          className="size-9 min-h-9 px-0"
        />
        <Button
          type="default"
          label="1"
          state={total === 0 ? "disabled" : "default"}
          className="size-9 min-h-9 px-0"
        />
        <Button
          type="secondary"
          label="Página siguiente"
          showText={false}
          state="disabled"
          rightIcon={<ChevronRight aria-hidden="true" className="size-4" />}
          className="size-9 min-h-9 px-0"
        />
      </div>
    </div>
  );
}
