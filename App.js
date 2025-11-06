/*
Little Lemon — Full functional single-file React app (App.jsx)

Features:
- Responsive booking form (date, time, party size, name, phone, email)
- Client-side validation
- Real-time availability check (mocked: limited tables per timeslot)
- Stores bookings in localStorage
- View & cancel bookings
- Accessible form inputs & keyboard friendly
- Tailwind CSS utility classes (expects Tailwind configured)

How to use (quick):
1) Create a new Vite + React app:
   npm create vite@latest little-lemon -- --template react
   cd little-lemon
2) Install dependencies (optional shadcn/ui not required):
   npm install
3) Install Tailwind (follow Tailwind docs). Quick steps:
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   // in tailwind.config.cjs set content to ['./index.html', './src/**/
   // in src/index.css add @tailwind base; @tailwind components; @tailwind utilities;



import React, { useEffect, useMemo, useState } from "react";

// Helper: format date as YYYY-MM-DD
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Generate timeslots between open and close in 30-min increments
function generateTimeSlots(open = "11:00", close = "22:00", stepMinutes = 30) {
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  const slots = [];
  const base = new Date();
  base.setHours(openH, openM, 0, 0);
  const end = new Date();
  end.setHours(closeH, closeM, 0, 0);
  while (base <= end) {
    const hh = String(base.getHours()).padStart(2, "0");
    const mm = String(base.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    base.setMinutes(base.getMinutes() + stepMinutes);
  }
  return slots;
}

const TIMESLOTS = generateTimeSlots();
const MAX_TABLES_PER_SLOT = 6; // mock capacity per slot

export default function App() {
  const today = useMemo(() => formatDate(new Date()), []);
  const [bookings, setBookings] = useState(() => {
    try {
      const raw = localStorage.getItem("littleLemonBookings");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: today,
    time: TIMESLOTS[0],
    partySize: 2,
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    localStorage.setItem("littleLemonBookings", JSON.stringify(bookings));
  }, [bookings]);

  // Count bookings for a given date/time
  function countBookings(date, time) {
    return bookings.filter((b) => b.date === date && b.time === time).length;
  }

  function availableTables(date, time) {
    return Math.max(0, MAX_TABLES_PER_SLOT - countBookings(date, time));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!/^\d{7,15}$/.test(form.phone.replace(/[^0-9]/g, "")))
      e.phone = "Enter a valid phone number (7–15 digits).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email.";

    const selected = new Date(form.date + "T" + form.time + ":00");
    const now = new Date();
    if (selected < new Date(now.getTime() - 5 * 60 * 1000)) e.date = "Please choose a future date/time.";

    if (!(Number(form.partySize) >= 1 && Number(form.partySize) <= 12))
      e.partySize = "Party size must be between 1 and 12.";

    // availability check
    if (availableTables(form.date, form.time) <= 0) e.time = "No tables available for the chosen slot.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    setSuccess(null);
    if (!validate()) return;
    const newBooking = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      date: form.date,
      time: form.time,
      partySize: Number(form.partySize),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setBookings((b) => [newBooking, ...b]);
    setSuccess({ message: `Booking confirmed for ${form.date} at ${form.time}` });
    // reset the form but keep date/time sensible
    setForm((f) => ({ ...f, name: "", phone: "", email: "", notes: "" }));
  }

  function handleCancel(id) {
    if (!confirm("Cancel this booking?")) return;
    setBookings((b) => b.filter((x) => x.id !== id));
  }

  const upcomingBookings = bookings.filter((b) => new Date(b.date + "T" + b.time) >= new Date()).slice(0, 50);

  return (
    <div className="min-h-screen bg-linear-to-b from-yellow-50 to-white p-6 md:p-12 font-sans">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-yellow-400 w-16 h-16 flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">LL</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Little Lemon</h1>
            <p className="text-gray-600">Fresh local flavors — Reserve a table</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold mb-2">Book a table</h2>
          <p className="text-sm text-gray-600 mb-4">Choose date, time and party size. We hold tables for 15 minutes.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1">Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Full name"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <small className="text-red-600">{errors.name}</small>}
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="e.g. +911234567890"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <small className="text-red-600">{errors.phone}</small>}
              </label>
            </div>

            <label className="flex flex-col">
              <span className="text-sm font-medium mb-1">Email</span>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && <small className="text-red-600">{errors.email}</small>}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1">Date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  min={today}
                  onChange={handleChange}
                  className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.date ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.date && <small className="text-red-600">{errors.date}</small>}
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1">Time</span>
                <select
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.time ? 'border-red-400' : 'border-gray-200'}`}
                >
                  {TIMESLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t} — {availableTables(form.date, t)} available
                    </option>
                  ))}
                </select>
                {errors.time && <small className="text-red-600">{errors.time}</small>}
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-medium mb-1">Party size</span>
                <input
                  name="partySize"
                  type="number"
                  min={1}
                  max={12}
                  value={form.partySize}
                  onChange={handleChange}
                  className={`px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-300 ${errors.partySize ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.partySize && <small className="text-red-600">{errors.partySize}</small>}
              </label>
            </div>

            <label className="flex flex-col">
              <span className="text-sm font-medium mb-1">Notes (optional)</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-yellow-300"
                placeholder="Allergies, celebrations, accessibility needs..."
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 font-semibold shadow-sm"
              >
                Confirm booking
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, name: "", phone: "", email: "", notes: "" });
                  setErrors({});
                  setSuccess(null);
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Reset
              </button>

              <div className="text-sm text-gray-600 ml-auto">Capacity per slot: {MAX_TABLES_PER_SLOT} tables</div>
            </div>

            {success && <div className="mt-2 text-green-700">{success.message}</div>}
          </form>
        </section>

        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-bold mb-2">Today & upcoming</h3>
            <p className="text-sm text-gray-600 mb-3">Quick look at availability for selected date ({form.date})</p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto">
              {TIMESLOTS.map((t) => (
                <div key={t} className="flex items-center justify-between p-2 rounded border">
                  <div className="font-medium">{t}</div>
                  <div className="text-sm text-gray-600">{availableTables(form.date, t)} left</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-bold mb-2">Your bookings</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming bookings. Make one!</p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-auto">
                {upcomingBookings.map((b) => (
                  <li key={b.id} className="p-3 rounded border flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">{b.date} · {b.time} · {b.partySize} people</div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-sm text-gray-600">{b.phone} • {b.email}</div>
                      {b.notes && <div className="text-sm mt-1">Note: {b.notes}</div>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => navigator.clipboard?.writeText(`Booking ${b.name} on ${b.date} at ${b.time} for ${b.partySize}`)} className="text-xs px-2 py-1 rounded border">Copy</button>
                      <button onClick={() => handleCancel(b.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border">Cancel</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-bold mb-2">About Little Lemon</h3>
            <p className="text-sm text-gray-600">Family-run restaurant serving seasonal dishes. Open 11:00–22:00 daily. This demo stores bookings locally; connect to your server to make it production-ready.</p>
          </div>
        </aside>
      </main>

      <footer className="max-w-6xl mx-auto mt-10 text-center text-gray-500 text-sm">© Little Lemon — Demo booking widget</footer>
    </div>
  );
}
