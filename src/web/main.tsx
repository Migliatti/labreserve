import { useEffect, useState, type FormEvent } from "react";
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
const toIso = (value: string) => new Date(value).toISOString();
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

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      const [nextResources, nextReservations, nextEvents] = await Promise.all([
        api.resources(toIso(startAt), toIso(endAt)),
        api.reservations({ resourceId: filterResourceId, status }),
        api.history(),
      ]);
      setResources(nextResources);
      setReservations(nextReservations);
      setEvents(nextEvents);
      if (!createResourceId && nextResources[0])
        setCreateResourceId(nextResources[0].id);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados.",
      );
    } finally {
      setLoading(false);
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
        startAt: toIso(startAt),
        endAt: toIso(endAt),
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
              onChange={(event) => setStartAt(event.target.value)}
              required
            />
          </label>
          <label>
            Término
            <input
              aria-label="Término"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              required
            />
          </label>
          <button type="submit">Criar reserva</button>
        </form>
      </section>
      <section aria-labelledby="availability-title" className="card">
        <div className="section-heading">
          <h2 id="availability-title">Disponibilidade</h2>
          <button type="button" onClick={() => void refresh()}>
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
              onChange={(event) => setFilterResourceId(event.target.value)}
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
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </label>
          <button type="button" onClick={() => void refresh()}>
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
