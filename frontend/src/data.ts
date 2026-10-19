import type { Activity, Interest, ItineraryDay, Trip } from "./types";

const makeActivity = (
  id: string, time: string, title: string, description: string,
  category: string, cost: number, duration: string,
): Activity => ({ id, time, title, description, category, cost, duration });

export function buildDemoItinerary(
  destination: string,
  startDate: string,
  days: number,
  interests: Interest[],
): ItineraryDay[] {
  const place = destination.trim() || "your destination";
  const focus = interests.length ? interests[0].toLowerCase() : "local culture";
  const templates = [
    [
      makeActivity("a1", "09:00", "A gentle start", `Enjoy breakfast at a neighborhood café and get oriented in ${place}.`, "Food", 18, "1 hr"),
      makeActivity("a2", "11:00", "Explore the old town", `Walk the historic streets, browse local shops, and discover the character of ${place}.`, "Culture", 0, "2 hrs"),
      makeActivity("a3", "13:30", "Lunch like a local", "Choose a well-reviewed local spot and try a regional specialty.", "Food", 25, "1 hr"),
      makeActivity("a4", "16:00", "A scenic afternoon", `Spend a few unhurried hours focused on ${focus}, with time for photos and breaks.`, "Explore", 20, "2 hrs"),
    ],
    [
      makeActivity("b1", "08:30", "Morning viewpoint", "Start early for cooler weather, softer light, and fewer crowds.", "Nature", 12, "1.5 hrs"),
      makeActivity("b2", "10:30", "A local highlight", `Visit one of ${place}'s signature attractions. Check current opening hours before you go.`, "Culture", 22, "2 hrs"),
      makeActivity("b3", "13:00", "Lunch break", "Take a relaxed lunch break near your next stop.", "Food", 24, "1 hr"),
      makeActivity("b4", "15:00", "Free time to wander", "Leave room for a market, a small gallery, or an unexpected discovery.", "Leisure", 15, "2 hrs"),
    ],
    [
      makeActivity("c1", "09:00", "Slow morning", "Enjoy a leisurely breakfast and choose a nearby walk.", "Leisure", 16, "1 hr"),
      makeActivity("c2", "10:30", "A deeper local experience", `Explore a museum, workshop, park, or neighborhood that suits your interest in ${focus}.`, "Experience", 20, "2 hrs"),
      makeActivity("c3", "13:00", "Regional flavors", "Make lunch part of the experience with a local dish or food market.", "Food", 26, "1 hr"),
      makeActivity("c4", "16:00", "Golden-hour stroll", "Finish with an easy walk and a flexible evening plan.", "Leisure", 0, "1.5 hrs"),
    ],
  ];
  const start = startDate ? new Date(`${startDate}T12:00:00`) : new Date();
  return Array.from({ length: Math.max(1, Math.min(days, 14)) }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      dayNumber: index + 1,
      date: date.toISOString().slice(0, 10),
      title: ["Arrive & explore", "Discover the highlights", "Find your own rhythm"][index % 3],
      activities: templates[index % templates.length].map((activity) => ({
        ...activity,
        id: `${index + 1}-${activity.id}`,
      })),
    };
  });
}

export const seedTrips: Trip[] = [
  {
    id: "sample-kyoto",
    destination: "Kyoto, Japan",
    startDate: "2027-04-12",
    endDate: "2027-04-16",
    budget: 1600,
    currency: "USD",
    travelers: 2,
    pace: "Balanced",
    interests: ["Culture", "Food", "Photography"],
    accommodation: "Boutique hotel",
    createdAt: new Date().toISOString(),
    itinerary: buildDemoItinerary("Kyoto, Japan", "2027-04-12", 5, ["Culture", "Food"]),
  },
  {
    id: "sample-lisbon",
    destination: "Lisbon, Portugal",
    startDate: "2027-06-03",
    endDate: "2027-06-06",
    budget: 1100,
    currency: "USD",
    travelers: 2,
    pace: "Relaxed",
    interests: ["Food", "Culture", "History"],
    accommodation: "Guesthouse",
    createdAt: new Date().toISOString(),
    itinerary: buildDemoItinerary("Lisbon, Portugal", "2027-06-03", 4, ["Food", "Culture"]),
  },
];
