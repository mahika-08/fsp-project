export type Interest =
  | "Culture"
  | "Food"
  | "Nature"
  | "Adventure"
  | "Shopping"
  | "Relaxation"
  | "History"
  | "Photography";

export type Activity = {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  cost: number;
  duration: string;
};

export type ItineraryDay = {
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
};

export type Trip = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  travelers: number;
  pace: "Relaxed" | "Balanced" | "Packed";
  interests: Interest[];
  accommodation: string;
  createdAt: string;
  itinerary: ItineraryDay[];
};
