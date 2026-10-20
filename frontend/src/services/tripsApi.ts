import { apiRequest } from "./api";
import type { Trip } from "../types";

export type CreateTripInput = Omit<Trip, "id" | "createdAt" | "itinerary">;
export type UpdateTripInput = Partial<Pick<Trip,
  | "destination" | "startDate" | "endDate" | "budget" | "currency"
  | "travelers" | "pace" | "interests" | "accommodation" | "itinerary"
>>;

export const tripsApi = {
  health: () => apiRequest<{ status: string }>("/health"),
  list: () => apiRequest<Trip[]>("/trips"),
  get: (tripId: string) => apiRequest<Trip>(`/trips/${encodeURIComponent(tripId)}`),
  create: (trip: CreateTripInput) => apiRequest<Trip>("/trips", {
    method: "POST", body: JSON.stringify(trip),
  }),
  update: (tripId: string, changes: UpdateTripInput) => apiRequest<Trip>(`/trips/${encodeURIComponent(tripId)}`, {
    method: "PATCH", body: JSON.stringify(changes),
  }),
  remove: (tripId: string) => apiRequest<void>(`/trips/${encodeURIComponent(tripId)}`, {
    method: "DELETE",
  }),
  regenerateDay: (tripId: string, dayNumber: number) => apiRequest<Trip>(
    `/trips/${encodeURIComponent(tripId)}/regenerate-day`, {
      method: "POST", body: JSON.stringify({ day_number: dayNumber }),
    },
  ),
};
