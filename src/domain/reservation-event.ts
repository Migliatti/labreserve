export type ReservationEventType = 'RESERVATION_CREATED' | 'RESERVATION_CANCELLED';

export interface ReservationEvent {
  id: string;
  reservationId: string;
  type: ReservationEventType;
  occurredAt: string;
}
