import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown,
  Compass, CreditCard, Globe2, Heart, LayoutDashboard, MapPin, Menu,
  Plus, Search, Settings2, Sparkles, Trash2, Users, Wallet,
} from "lucide-react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { buildDemoItinerary } from "./data";
import { tripsApi } from "./services/tripsApi";
import type { Interest, Trip } from "./types";

const INTERESTS: Interest[] = ["Culture", "Food", "Nature", "Adventure", "Shopping", "Relaxation", "History", "Photography"];

function formatDate(date: string) {
  if (!date) return "Date not set";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function tripDays(trip: Trip) {
  return Math.max(1, Math.round((new Date(`${trip.endDate}T12:00:00`).getTime() - new Date(`${trip.startDate}T12:00:00`).getTime()) / 86400000) + 1);
}
function money(value: number, currency = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${Math.round(value)}`; }
}

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  async function loadTrips() {
    setLoading(true);
    setApiError("");
    try {
      const result = await tripsApi.list();
      setTrips(result);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not load trips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTrips(); }, []);

  const addTrip = async (trip: Trip): Promise<Trip> => {
    setApiError("");
    try {
      const created = await tripsApi.create({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        currency: trip.currency,
        travelers: trip.travelers,
        pace: trip.pace,
        interests: trip.interests,
        accommodation: trip.accommodation,
      });
      setTrips((current) => [created, ...current]);
      return created;
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not create trip.");
      throw error;
    }
  };

  const updateTrip = async (updatedTrip: Trip): Promise<Trip> => {
    setApiError("");
    try {
      const saved = await tripsApi.update(updatedTrip.id, {
        destination: updatedTrip.destination,
        startDate: updatedTrip.startDate,
        endDate: updatedTrip.endDate,
        budget: updatedTrip.budget,
        currency: updatedTrip.currency,
        travelers: updatedTrip.travelers,
        pace: updatedTrip.pace,
        interests: updatedTrip.interests,
        accommodation: updatedTrip.accommodation,
        itinerary: updatedTrip.itinerary,
      });
      setTrips((current) => current.map((trip) => trip.id === saved.id ? saved : trip));
      return saved;
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not update trip.");
      throw error;
    }
  };

  const deleteTrip = async (id: string): Promise<void> => {
    setApiError("");
    try {
      await tripsApi.remove(id);
      setTrips((current) => current.filter((trip) => trip.id !== id));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not delete trip.");
      throw error;
    }
  };
  const filteredTrips = useMemo(
    () => trips.filter((trip) => trip.destination.toLowerCase().includes(search.toLowerCase())),
    [trips, search],
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setMobileMenu(false)}>
          <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
          <span>wayfarer<span className="brand-dot">.</span><small>YOUR JOURNEY, YOUR WAY</small></span>
        </Link>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <NavLink to="/" end onClick={() => setMobileMenu(false)}><LayoutDashboard size={18} /> Overview</NavLink>
          <NavLink to="/create" onClick={() => setMobileMenu(false)}><Plus size={18} /> Plan a trip <span className="nav-plus">+</span></NavLink>
        </nav>
        <div className="side-label side-label-spaced">YOUR SPACE</div>
        <nav className="side-nav">
          <a href="#saved-trips" onClick={() => setMobileMenu(false)}><Heart size={18} /> Saved trips</a>
          <a href="#travel-tips" onClick={() => setMobileMenu(false)}><Globe2 size={18} /> Travel inspiration</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <div className="tip-icon"><Sparkles size={17} /></div>
            <strong>Travel with intention</strong>
            <p>The best journeys leave room for the unexpected.</p>
            <Link to="/create">Plan something new <ArrowRight size={14} /></Link>
          </div>
          <div className="profile-row">
            <div className="avatar">W</div>
            <div className="profile-copy"><strong>Wanderer</strong><span>Personal planner</span></div>
            <Settings2 size={17} className="muted-icon" />
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>My travels</strong></div>
          <div className="topbar-right">
            <span className="status-dot" /> <span className="saved-label">{loading ? "Connecting to trip database…" : "Trips synced with backend"}</span>
            <div className="top-avatar">W</div>
          </div>
        </header>
        <div className="page-content">
          {apiError && <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
            <strong>Backend request failed:</strong> {apiError} <button type="button" className="outline-button" onClick={() => void loadTrips()}>Retry connection</button>
          </div>}
          {loading ? <div className="empty-state"><div className="empty-icon"><Compass size={28} /></div><h3>Loading your journeys…</h3><p>Connecting to your trip database.</p></div> : <Routes>
            <Route path="/" element={<Dashboard trips={filteredTrips} totalTrips={trips.length} search={search} setSearch={setSearch} onDelete={deleteTrip} />} />
            <Route path="/create" element={<CreateTrip onCreate={addTrip} />} />
            <Route path="/trips/:tripId/edit" element={<EditTrip trips={trips} onUpdate={updateTrip} />} />
            <Route path="/trips/:tripId" element={<TripDetail trips={trips} onDelete={deleteTrip} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>}
        </div>
        <footer className="footer"><span>© 2026 Wayfarer Studio</span><span>Made for the journey <span className="footer-heart">♥</span></span></footer>
      </main>
    </div>
  );
}

function Dashboard({ trips, totalTrips, search, setSearch, onDelete }: {
  trips: Trip[]; totalTrips: number; search: string; setSearch: (value: string) => void; onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const upcoming = trips.filter((trip) => trip.startDate >= new Date().toISOString().slice(0, 10));
  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div><h1>Make room for <em>wonder.</em></h1><p className="page-subtitle">Every great trip begins with a little curiosity. Where will yours take you?</p></div>
        <button className="primary-button" onClick={() => navigate("/create")}><Plus size={17} /> Plan a new trip</button>
      </section>

      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-pill"><Sparkles size={13} /> YOUR PERSONAL TRAVEL COMPANION</div>
          <h2>Less planning stress.<br /><em>More living in the moment.</em></h2>
          <p>Thoughtful itineraries, meaningful discoveries, and a journey that feels like you.</p>
          <button className="hero-button" onClick={() => navigate("/create")}>Start planning <ArrowRight size={16} /></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" /><div className="mountain mountain-back" /><div className="mountain mountain-front" />
          <div className="river" /><div className="art-stamp">GO<br />SOMEWHERE<br /><span>beautiful.</span></div>
          <div className="art-coordinates">35°00' N &nbsp; 135°46' E</div>
        </div>
        <div className="hero-number">01 <span>/ THE OPEN ROAD</span></div>
      </section>

      <section className="stats-grid">
        <StatCard icon={<MapPin size={17} />} label="Trips planned" value={String(totalTrips).padStart(2, "0")} detail="Your personal collection" />
        <StatCard icon={<CalendarDays size={17} />} label="Days of discovery" value={String(trips.reduce((sum, trip) => sum + tripDays(trip), 0)).padStart(2, "0")} detail="Across all your itineraries" />
        <StatCard icon={<Wallet size={17} />} label="Trips upcoming" value={String(upcoming.length).padStart(2, "0")} detail="Adventure on the horizon" />
      </section>

      <section className="trips-section" id="saved-trips">
        <div className="section-heading">
          <div><div className="eyebrow">THE TRAVEL JOURNAL</div><h2>Your journeys <span>in the making</span></h2></div>
          <div className="trip-tools"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a destination..." /></label><button className="filter-button" onClick={() => setSearch("")} title="Clear search"><Settings2 size={17} /></button></div>
        </div>
        {trips.length === 0 ? <EmptyState /> : (
          <div className="trip-grid">
            {trips.map((trip, index) => <TripCard key={trip.id} trip={trip} index={index} onDelete={onDelete} />)}
          </div>
        )}
      </section>

      <section className="inspiration-strip" id="travel-tips">
        <div className="inspiration-icon"><Globe2 size={20} /></div>
        <div><strong>A little inspiration goes a long way.</strong><p>Try a new cuisine, take the scenic route, or leave an afternoon completely unscheduled.</p></div>
        <ArrowDownRight size={21} className="inspiration-arrow" />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><ArrowDownRight size={15} className="stat-arrow" /></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}

function TripCard({ trip, index, onDelete }: { trip: Trip; index: number; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const themes = ["trip-image-terracotta", "trip-image-blue", "trip-image-green", "trip-image-gold"];
  return (
    <article className="trip-card">
      <Link to={`/trips/${trip.id}`} className={`trip-image ${themes[index % themes.length]}`}>
        <div className="trip-image-overlay" />
        <span className="trip-image-tag"><MapPin size={12} /> {tripDays(trip)} DAYS</span>
        <span className="trip-image-word">{trip.destination.split(",")[0]}</span>
        <span className="trip-image-caption">A JOURNEY TO REMEMBER</span>
      </Link>
      <div className="trip-card-body">
        <div className="trip-card-title-row"><Link to={`/trips/${trip.id}`} className="trip-card-title">{trip.destination}</Link><button className="tiny-icon-button" title="Delete trip" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /></button></div>
        <div className="trip-card-date"><CalendarDays size={14} /> {formatDate(trip.startDate)} <span>—</span> {formatDate(trip.endDate)}</div>
        <div className="trip-card-bottom"><div className="trip-tags">{trip.interests.slice(0, 2).map((interest) => <span key={interest}>{interest}</span>)}</div><span className="trip-budget"><CreditCard size={14} /> {money(trip.budget, trip.currency)}</span></div>
        {confirmDelete && <div className="confirm-delete"><span>Delete this trip?</span><button onClick={() => { void onDelete(trip.id).catch(() => undefined); }}>Yes</button><button onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
      </div>
    </article>
  );
}

function EmptyState() {
  return <div className="empty-state"><div className="empty-icon"><Compass size={28} /></div><h3>Your next adventure starts here.</h3><p>No trips match your search. Try another destination or plan a new journey.</p><Link className="primary-button" to="/create"><Plus size={16} /> Create your first trip</Link></div>;
}

function CreateTrip({ onCreate, initialTrip, onUpdate }: { onCreate: (trip: Trip) => Promise<Trip>; initialTrip?: Trip; onUpdate?: (trip: Trip) => Promise<Trip> }) {
  const navigate = useNavigate();
  const [destination, setDestination] = useState(() => initialTrip?.destination ?? "");
  const [startDate, setStartDate] = useState(() => initialTrip?.startDate ?? "");
  const [endDate, setEndDate] = useState(() => initialTrip?.endDate ?? "");
  const [budget, setBudget] = useState(() => String(initialTrip?.budget ?? 1500));
  const [currency, setCurrency] = useState(() => initialTrip?.currency ?? "USD");
  const [travelers, setTravelers] = useState(() => String(initialTrip?.travelers ?? 2));
  const [pace, setPace] = useState<Trip["pace"]>(() => initialTrip?.pace ?? "Balanced");
  const [accommodation, setAccommodation] = useState(() => initialTrip?.accommodation ?? "Boutique hotel");
  const [interests, setInterests] = useState<Interest[]>(() => initialTrip?.interests ?? ["Culture", "Food"]);
  const [error, setError] = useState("");

  const toggleInterest = (interest: Interest) => setInterests((current) =>
    current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!destination.trim()) { setError("Please enter a destination."); return; }
    if (!startDate || !endDate) { setError("Please choose your travel dates."); return; }
    if (endDate < startDate) { setError("The return date must be on or after the departure date."); return; }
    if (Number(budget) <= 0 || !Number.isFinite(Number(budget))) { setError("Please enter a valid budget."); return; }
    const days = Math.floor((new Date(`${endDate}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) / 86400000) + 1;
    if (days > 14) { setError("For this first version, trips can be up to 14 days."); return; }
    const trip: Trip = {
      id: initialTrip?.id ?? crypto.randomUUID(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget: Number(budget),
      currency,
      travelers: Number(travelers),
      pace,
      interests,
      accommodation,
      createdAt: initialTrip?.createdAt ?? new Date().toISOString(),
      itinerary: buildDemoItinerary(destination.trim(), startDate, days, interests),
    };
    setError("");
    try {
      const savedTrip = initialTrip && onUpdate ? await onUpdate(trip) : await onCreate(trip);
      navigate(`/trips/${savedTrip.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this trip. Check the backend connection and try again.");
    }
  }

  return (
    <div className="create-page">
      <Link to={initialTrip ? `/trips/${initialTrip.id}` : "/"} className="back-link"><ArrowLeft size={16} /> {initialTrip ? "Back to itinerary" : "Back to overview"}</Link>
      <div className="create-intro"><div className="eyebrow"><span className="eyebrow-line" /> {initialTrip ? "REFINE YOUR JOURNEY" : "YOUR NEXT ADVENTURE"}</div><h1>{initialTrip ? <>Make this trip <em>your own.</em></> : <>Let's plan something <em>remarkable.</em></>}</h1><p>{initialTrip ? "Update your preferences. Your day-by-day draft will be refreshed to match." : "Tell us what your ideal trip looks like. We'll shape a day-by-day draft you can make your own."}</p></div>
      <form className="trip-form" onSubmit={submit}>
        <div className="form-section-title"><span className="form-step">01</span><div><h2>The essentials</h2><p>Start with where and when.</p></div></div>
        <div className="form-grid">
          <label className="field field-full"><span>Destination <b>*</b></span><div className="input-with-icon"><MapPin size={17} /><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Kyoto, Japan" required /></div></label>
          <label className="field"><span>Departure date <b>*</b></span><input type="date" value={startDate} min={initialTrip ? undefined : new Date().toISOString().slice(0, 10)} onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value); }} required /></label>
          <label className="field"><span>Return date <b>*</b></span><input type="date" value={endDate} min={startDate || (initialTrip ? undefined : new Date().toISOString().slice(0, 10))} onChange={(e) => setEndDate(e.target.value)} required /></label>
        </div>

        <div className="form-divider" />
        <div className="form-section-title"><span className="form-step">02</span><div><h2>Make it yours</h2><p>A few preferences help shape your trip.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Total budget</span><div className="budget-input"><select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency"><option value="USD">USD $</option><option value="INR">INR ₹</option><option value="EUR">EUR €</option><option value="GBP">GBP £</option><option value="JPY">JPY ¥</option></select><input type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)} /></div></label>
          <label className="field"><span>Travelers</span><div className="input-with-icon"><Users size={17} /><select value={travelers} onChange={(e) => setTravelers(e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n} {n === 1 ? "traveler" : "travelers"}</option>)}</select><ChevronDown size={14} className="select-chevron" /></div></label>
          <label className="field"><span>Travel pace</span><div className="choice-row">{(["Relaxed", "Balanced", "Packed"] as const).map((option) => <button type="button" key={option} className={`choice-button ${pace === option ? "choice-active" : ""}`} onClick={() => setPace(option)}>{pace === option && <Check size={13} />}{option}</button>)}</div></label>
          <label className="field"><span>Stay preference</span><div className="input-with-icon"><Globe2 size={17} /><select value={accommodation} onChange={(e) => setAccommodation(e.target.value)}>{["Boutique hotel", "Hotel", "Guesthouse", "Hostel", "Apartment rental", "Resort", "Flexible"].map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} className="select-chevron" /></div></label>
        </div>

        <div className="form-divider" />
        <div className="form-section-title"><span className="form-step">03</span><div><h2>What moves you?</h2><p>Choose all the things you love to experience.</p></div></div>
        <div className="interest-grid">{INTERESTS.map((interest) => <button type="button" key={interest} onClick={() => toggleInterest(interest)} className={`interest-chip ${interests.includes(interest) ? "interest-selected" : ""}`}>{interests.includes(interest) ? <Check size={14} /> : <Plus size={14} />}{interest}</button>)}</div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-submit-row"><span><Sparkles size={15} /> Your trip will be saved to the backend database.</span><button type="submit" className="primary-button"><Sparkles size={16} /> {initialTrip ? "Save trip changes" : "Create my itinerary"} <ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}

function EditTrip({ trips, onUpdate }: { trips: Trip[]; onUpdate: (trip: Trip) => Promise<Trip> }) {
  const { tripId } = useParams();
  const trip = trips.find((item) => item.id === tripId);
  if (!trip) return <div className="not-found"><Compass size={30} /><h2>We couldn't find that trip.</h2><Link to="/" className="primary-button">Back to overview</Link></div>;
  return <CreateTrip initialTrip={trip} onCreate={() => undefined} onUpdate={onUpdate} />;
}

function TripDetail({ trips, onDelete }: { trips: Trip[]; onDelete: (id: string) => Promise<void> }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = trips.find((item) => item.id === tripId);
  const [activeDay, setActiveDay] = useState(1);
  const [showDelete, setShowDelete] = useState(false);
  if (!trip) return <div className="not-found"><Compass size={30} /><h2>We couldn't find that trip.</h2><Link to="/" className="primary-button">Back to overview</Link></div>;

  const selectedDay = trip.itinerary[Math.min(activeDay - 1, trip.itinerary.length - 1)];
  const estimatedSpend = trip.itinerary.reduce((sum, day) => sum + day.activities.reduce((inner, activity) => inner + activity.cost, 0), 0) * trip.travelers;
  return (
    <div className="detail-page">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> All journeys</Link>
      <section className="detail-hero">
        <div className="detail-hero-copy"><div className="hero-pill"><MapPin size={13} /> YOUR ITINERARY</div><h1>{trip.destination}</h1><p><CalendarDays size={16} /> {formatDate(trip.startDate)} — {formatDate(trip.endDate)} <span className="detail-dot">·</span> {tripDays(trip)} days <span className="detail-dot">·</span> {trip.travelers} travelers</p><div className="detail-tags">{trip.interests.map((interest) => <span key={interest}>{interest}</span>)}</div></div>
        <div className="detail-hero-art"><div className="sun" /><div className="mountain mountain-back" /><div className="mountain mountain-front" /><div className="river" /></div>
      </section>
      <div className="demo-notice"><Sparkles size={16} /><span><strong>Planning preview</strong> — This is a starter itinerary generated by the backend. Place details, opening hours, and costs are illustrative; verify before traveling.</span></div>
      <div className="detail-layout">
        <section className="itinerary-panel">
          <div className="section-heading detail-heading"><div><div className="eyebrow">YOUR DAY-BY-DAY PLAN</div><h2>The journey <span>unfolds</span></h2></div><span className="draft-pill"><span /> DRAFT</span></div>
          <div className="day-tabs">{trip.itinerary.map((day) => <button key={day.dayNumber} className={`day-tab ${activeDay === day.dayNumber ? "day-tab-active" : ""}`} onClick={() => setActiveDay(day.dayNumber)}><span>DAY {String(day.dayNumber).padStart(2, "0")}</span><strong>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong></button>)}</div>
          {selectedDay && <div className="day-content"><div className="day-title-row"><div><span className="day-kicker">DAY {selectedDay.dayNumber}</span><h3>{selectedDay.title}</h3></div><span className="day-date">{formatDate(selectedDay.date)}</span></div>
            <div className="activity-list">{selectedDay.activities.map((activity, index) => <article className="activity-item" key={activity.id}><div className="activity-timeline"><span className={`activity-dot activity-dot-${index % 4}`} />{index < selectedDay.activities.length - 1 && <span className="timeline-line" />}</div><div className="activity-time">{activity.time}<span>{activity.duration}</span></div><div className="activity-copy"><div className="activity-category">{activity.category}</div><h4>{activity.title}</h4><p>{activity.description}</p><span className="activity-cost">{activity.cost ? `Est. ${money(activity.cost, trip.currency)} / person` : "Free activity"}</span></div></article>)}</div>
          </div>}
        </section>
        <aside className="trip-summary">
          <div className="summary-head"><h3>Trip snapshot</h3><span><Sparkles size={14} /></span></div>
          <div className="summary-budget-label">TOTAL TRIP BUDGET</div><div className="summary-budget">{money(trip.budget, trip.currency)}</div><div className="budget-progress"><span style={{ width: `${Math.min(100, trip.budget ? estimatedSpend / trip.budget * 100 : 0)}%` }} /></div><div className="budget-legend"><span>Sample activity estimate</span><strong>{money(estimatedSpend, trip.currency)}</strong></div>
          <div className="summary-divider" />
          <SummaryRow icon={<CalendarDays size={16} />} label="Duration" value={`${tripDays(trip)} days`} />
          <SummaryRow icon={<Users size={16} />} label="Travelers" value={String(trip.travelers)} />
          <SummaryRow icon={<Compass size={16} />} label="Travel pace" value={trip.pace} />
          <SummaryRow icon={<Globe2 size={16} />} label="Stay preference" value={trip.accommodation} />
          <div className="summary-divider" />
          <Link className="outline-button full-width" to={`/trips/${trip.id}/edit`}>Edit trip details <ArrowRight size={15} /></Link>
          <button className="outline-button full-width" onClick={() => window.print()}>Print itinerary <ArrowRight size={15} /></button>
          <button className="text-danger-button" onClick={() => setShowDelete(true)}><Trash2 size={14} /> Delete this trip</button>
          {showDelete && <div className="confirm-delete summary-confirm"><span>Delete this trip permanently?</span><button onClick={() => { void onDelete(trip.id).then(() => navigate("/")).catch(() => undefined); }}>Delete</button><button onClick={() => setShowDelete(false)}>Keep</button></div>}
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="summary-row"><span className="summary-row-icon">{icon}</span><span className="summary-row-label">{label}</span><strong>{value}</strong></div>;
}

function NotFound() {
  return <div className="not-found"><Compass size={30} /><h2>This path hasn't been mapped yet.</h2><p>Let's get you back to your travels.</p><Link to="/" className="primary-button">Back to overview <ArrowRight size={16} /></Link></div>;
}
