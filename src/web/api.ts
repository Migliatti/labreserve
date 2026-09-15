export type Resource = { id: string; name: string; category: 'LABORATORY' | 'EQUIPMENT'; status: 'OPERATIONAL' | 'UNAVAILABLE'; available?: boolean };
export type Reservation = { id: string; resourceId: string; startAt: string; endAt: string; status: 'CONFIRMED' | 'CANCELLED'; createdAt: string; cancelledAt: string | null };
export type ReservationEvent = { id: string; reservationId: string; type: 'RESERVATION_CREATED' | 'RESERVATION_CANCELLED'; occurredAt: string };

type ApiError = { code: string; message: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.json() as { data?: T } & ApiError;
  if (!response.ok) throw new Error(body.message ?? 'Não foi possível concluir a operação.');
  return body.data as T;
}

export const api = {
  resources: (startAt?: string, endAt?: string) => {
    const search = startAt && endAt ? `?${new URLSearchParams({ startAt, endAt })}` : '';
    return request<Resource[]>(`/api/resources${search}`);
  },
  reservations: (filters: { resourceId?: string; status?: string } = {}) => {
    const search = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return request<Reservation[]>(`/api/reservations${search.size ? `?${search}` : ''}`);
  },
  createReservation: (input: { resourceId: string; startAt: string; endAt: string }) => request<Reservation>('/api/reservations', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input),
  }),
  cancelReservation: (id: string) => request<Reservation>(`/api/reservations/${id}/cancel`, { method: 'POST' }),
  history: () => request<ReservationEvent[]>('/api/history'),
};
