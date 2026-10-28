// Date and time helpers shared by booking, calendar, and notification views.
export const toISODate = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const minutesOf = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

export const weekDays = (offset = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

export const normalizeBooking = (booking) => ({
  id: booking.bookingId,
  event: booking.event,
  venue: booking.venue,
  date: booking.date,
  time: `${booking.startTime} – ${booking.endTime}`,
  requested: new Date(booking.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  status: booking.status,
  reason: booking.rejectionReason,
  requester: booking.bookedFor || booking.requestedBy?.name || 'Unknown',
  role: booking.requestedBy?.role || '',
  attendees: booking.attendees,
  updatedAt: booking.updatedAt || booking.createdAt || new Date().toISOString(),
});

export const formatEventDate = (dateString) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${dateString}T12:00:00`));

export const formatActivityTime = (dateString) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
