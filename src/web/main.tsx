import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  api,
  type Reservation,
  type ReservationEvent,
  type Resource,
} from "./api.js";
import "./styles.css";

const displayDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const toIso = (value: string, label: string) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()))
    throw new Error(`Informe uma data e hora válidas para ${label}.`);
  return date.toISOString();
};
const initialStart = "2030-01-15T09:00";
const initialEnd = "2030-01-15T10:00";

function App() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [createResourceId, setCreateResourceId] = useState("");
  const [filterResourceId, setFilterResourceId] = useState("");
  const [startAt, setStartAt] = useState(initialStart);
  const [endAt, setEndAt] = useState(initialEnd);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const refreshVersion = useRef(0);
  const refreshInputs = useRef({ startAt: initialStart, endAt: initialEnd, filterResourceId: "", status: "" });

  async function refresh(): Promise<void> {
    const version = ++refreshVersion.current;
    const inputs = { ...refreshInputs.current };
    setLoading(true);
    try {
      const interval = { startAt: toIso(inputs.startAt, "o início"), endAt: toIso(inputs.endAt, "o término") };
      const filters = { resourceId: inputs.filterResourceId, status: inputs.status };
      const [nextResources, nextReservations, nextEvents] = await Promise.all([
        api.resources(interval.startAt, interval.endAt),
        api.reservations(filters),
        api.history(),
      ]);
      if (version !== refreshVersion.current) return;
      setResources(nextResources);
      setReservations(nextReservations);
      setEvents(nextEvents);
      if (!createResourceId && nextResources[0])
        setCreateResourceId(nextResources[0].id);
    } catch (error) {
      if (version === refreshVersion.current) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados.",
        );
      }
    } finally {
      if (version === refreshVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice("");
    try {
      const reservation = await api.createReservation({
        resourceId: createResourceId,
        startAt: toIso(startAt, "o início"),
        endAt: toIso(endAt, "o término"),
      });
      setNotice(`Reserva ${reservation.id} criada com sucesso.`);
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a reserva.",
      );
    }
  }

  async function cancel(id: string): Promise<void> {
    setNotice("");
    try {
      await api.cancelReservation(id);
      setNotice("Reserva cancelada com sucesso.");
      await refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a reserva.",
      );
    }
  }

  return (
    <main className="page">
      <header>
        <p className="eyebrow">Gestão local de recursos</p>
        <h1>LabReserve</h1>
        <p>
          Consulte disponibilidade e confirme reservas de laboratórios e
          equipamentos.
        </p>
      </header>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <section aria-labelledby="create-title" className="card">
        <h2 id="create-title">Nova reserva</h2>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Recurso
            <select
              aria-label="Recurso"
              value={createResourceId}
              onChange={(event) => setCreateResourceId(event.target.value)}
              required
            >
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início
            <input
              aria-label="Início"
              type="datetime-local"
              value={startAt}
              onChange={(event) => {
                refreshInputs.current.startAt = event.target.value;
                setStartAt(event.target.value);
              }}
              required
            />
          </label>
          <label>
            Término
            <input
              aria-label="Término"
              type="datetime-local"
              value={endAt}
              onChange={(event) => {
                refreshInputs.current.endAt = event.target.value;
                setEndAt(event.target.value);
              }}
              required
            />
          </label>
          <button type="submit">Criar reserva</button>
        </form>
      </section>
      <section aria-labelledby="availability-title" className="card">
        <div className="section-heading">
          <h2 id="availability-title">Disponibilidade</h2>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              void refresh();
            }}
          >
            Consultar período
          </button>
        </div>
        {loading ? (
          <p>Carregando…</p>
        ) : (
          <ul className="resource-list">
            {resources.map((resource) => (
              <li key={resource.id}>
                <strong>{resource.name}</strong>{" "}
                <span>
                  {resource.category === "LABORATORY"
                    ? "Laboratório"
                    : "Equipamento"}
                </span>
                <b className={resource.available ? "available" : "unavailable"}>
                  {resource.available ? "Disponível" : "Indisponível"}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="reservations-title" className="card">
        <h2 id="reservations-title">Reservas</h2>
        <div className="filters">
          <label>
            Filtrar por recurso
            <select
              aria-label="Filtrar por recurso"
              value={filterResourceId}
              onChange={(event) => {
                refreshInputs.current.filterResourceId = event.target.value;
                setFilterResourceId(event.target.value);
              }}
            >
              <option value="">Todos os recursos</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              aria-label="Estado"
              value={status}
              onChange={(event) => {
                refreshInputs.current.status = event.target.value;
                setStatus(event.target.value);
              }}
            >
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setNotice("");
              void refresh();
            }}
          >
            Aplicar filtros
          </button>
        </div>
        <ul className="reservation-list">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <span>
                <strong>
                  {reservation.status === "CONFIRMED"
                    ? "Confirmada"
                    : "Cancelada"}
                </strong>{" "}
                — {reservation.resourceId} — {displayDate(reservation.startAt)}{" "}
                a {displayDate(reservation.endAt)}
              </span>
              {reservation.status === "CONFIRMED" && (
                <button
                  type="button"
                  onClick={() => void cancel(reservation.id)}
                >
                  Cancelar reserva
                </button>
              )}
            </li>
          ))}
          {!loading && reservations.length === 0 && (
            <li>Nenhuma reserva encontrada.</li>
          )}
        </ul>
      </section>
      <section aria-labelledby="history-title" className="card">
        <h2 id="history-title">Histórico global</h2>
        <ol>
          {events.map((item) => (
            <li key={item.id}>
              {displayDate(item.occurredAt)} —{" "}
              {item.type === "RESERVATION_CREATED"
                ? "Reserva criada"
                : "Reserva cancelada"}{" "}
              ({item.reservationId})
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
