import Button from "@/components/ui/Button";

/**
 * Estado de Solicitar Servicio cuando la colección local no tiene mascotas.
 *
 * Reutiliza la ilustración del estado vacío de My Pets y el `Button` del kit.
 * Orienta al usuario a registrar una mascota; no crea una mascota ficticia ni
 * implementa un flujo nuevo.
 */
export default function RequestServiceEmpty() {
  return (
    <section
      aria-labelledby="request-no-pets-title"
      className="flex flex-col items-center gap-6 rounded-card-lg border border-border bg-surface px-6 py-10 text-center shadow-card md:py-12 xl:py-16"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dog_cat.svg"
        alt=""
        width={310}
        height={220}
        aria-hidden="true"
        className="h-auto max-w-full"
      />

      <div className="flex max-w-md flex-col items-center gap-2">
        <h2
          id="request-no-pets-title"
          className="text-form-title font-bold text-primary-500"
        >
          Aún no tienes mascotas registradas.
        </h2>
        <p className="text-description text-secondary">
          Para solicitar un servicio, primero agrega a tu mascota y ten toda su
          información en un solo lugar.
        </p>
      </div>

      <Button href="/my-pets" label="Agregar mascota" />
    </section>
  );
}
