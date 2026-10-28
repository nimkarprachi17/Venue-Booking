import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  getCalendarDisplayStatus as calendarDisplayStatus,
  getCalendarEventLayout as calendarEventLayout,
} from '../utils/calendar';
import { formatEventDate, minutesOf, toISODate } from '../utils/dateTime';
const CalendarPage = ({
  isAdmin,
  calendarDate,
  setCalendarDate,
  calendarView,
  setCalendarView,
  mobileCalendarDay,
  setMobileCalendarDay,
  calendarSelection,
  setCalendarSelection,
  calendarVenue,
  setCalendarVenue,
  bookings,
  venues,
  heading,
  button,
  status,
}) => {
  const monday = new Date(calendarDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
  const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
  const rangeStart =
    calendarView === 'Day' ? calendarDate : calendarView === 'Week' ? weekDates[0] : monthStart;
  const rangeEnd =
    calendarView === 'Day' ? calendarDate : calendarView === 'Week' ? weekDates[6] : monthEnd;
  const isoStart = toISODate(rangeStart);
  const isoEnd = toISODate(rangeEnd);
  const dateLabel =
    calendarView === 'Day'
      ? calendarDate.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : calendarView === 'Week'
        ? `${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const moveDate = (direction) => {
    const nextDate = new Date(calendarDate);
    if (calendarView === 'Month') {
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + direction);
    } else {
      nextDate.setDate(nextDate.getDate() + direction * (calendarView === 'Week' ? 7 : 1));
    }
    setCalendarDate(nextDate);
    setMobileCalendarDay((nextDate.getDay() + 6) % 7);
    setCalendarSelection(null);
  };
  const showToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setMobileCalendarDay((today.getDay() + 6) % 7);
    setCalendarSelection(null);
  };
  const liveBookings = bookings.filter(
    (booking) =>
      ['confirmed', 'approved', 'pending'].includes(String(booking.status).toLowerCase()) &&
      booking.date >= isoStart &&
      booking.date <= isoEnd,
  );
  const previewBookings = [
    {
      id: 'preview-cse-presentation',
      event: 'CSE Project Presentation',
      venue: 'Seminar Hall 2',
      date: toISODate(weekDates[0]),
      time: '10:00 – 12:00',
      status: 'Confirmed',
      attendees: 82,
      requester: 'Prachi Sharma',
    },
    {
      id: 'preview-web-workshop',
      event: 'Web Development Workshop',
      venue: 'Cognizant Lab',
      date: toISODate(weekDates[1]),
      time: '14:00 – 16:00',
      status: 'Approved',
      attendees: 48,
      requester: 'Coding Club',
    },
    {
      id: 'preview-guest-lecture',
      event: 'Department Guest Lecture',
      venue: 'Main auditorium',
      date: toISODate(weekDates[2]),
      time: '11:00 – 13:00',
      status: 'Confirmed',
      attendees: 210,
      requester: 'Computer Engineering',
    },
    {
      id: 'preview-electronics-showcase',
      event: 'Electronics Design Showcase',
      venue: 'Electronic Extension Building',
      date: toISODate(weekDates[2]),
      time: '11:00 – 13:00',
      status: 'Pending',
      attendees: 70,
      requester: 'Ananya Shah',
    },
    {
      id: 'preview-design-session',
      event: 'Design Thinking Session',
      venue: 'Academic Complex NC04',
      date: toISODate(weekDates[3]),
      time: '09:00 – 11:00',
      status: 'Approved',
      attendees: 36,
      requester: 'Design Society',
    },
    {
      id: 'preview-coding-meetup',
      event: 'Coding Club Meetup',
      venue: 'New Cse NC28',
      date: toISODate(weekDates[4]),
      time: '11:00 – 12:30',
      status: 'Approved',
      attendees: 24,
      requester: 'Coding Club',
    },
  ];
  const usingPreview = liveBookings.length === 0;
  const displayBookings = (usingPreview ? previewBookings : liveBookings).filter(
    (booking) => calendarVenue === 'All venues' || booking.venue === calendarVenue,
  );
  const days = calendarView === 'Day' ? [calendarDate] : weekDates;
  const agendaDate = calendarView === 'Day' ? calendarDate : weekDates[mobileCalendarDay];
  const agendaBookings = displayBookings
    .filter((booking) => calendarView === 'Month' || booking.date === toISODate(agendaDate))
    .sort(
      (first, second) =>
        first.date.localeCompare(second.date) || first.time.localeCompare(second.time),
    );
  const monthGridStart = new Date(monthStart);
  monthGridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const monthGridDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(monthGridStart);
    date.setDate(monthGridStart.getDate() + index);
    return date;
  });
  const renderAgendaItem = (booking) => (
    <button
      key={booking.id}
      className="calendar-agenda-item"
      onClick={() => setCalendarSelection(booking)}
      aria-label={`View ${calendarDisplayStatus(booking.status)} booking: ${booking.event}, ${booking.venue}, ${booking.time}`}
    >
      <span className="calendar-agenda-time">{booking.time}</span>
      <span className="calendar-agenda-copy">
        <b>{booking.event}</b>
        <span>{booking.venue}</span>
      </span>
      {status(calendarDisplayStatus(booking.status))}
    </button>
  );

  return (
    <>
      {heading(
        isAdmin ? 'Booking calendar' : 'Campus calendar',
        isAdmin
          ? 'Review venue schedules and identify busy periods.'
          : 'View confirmed bookings and pending booking requests across campus.',
        button('Today', showToday),
      )}
      <div className="calendar-toolbar">
        <div className="calendar-date-nav" aria-label="Calendar date navigation">
          <button
            className="icon-button"
            aria-label="Previous date range"
            onClick={() => moveDate(-1)}
          >
            <ChevronLeft />
          </button>
          <b>{dateLabel}</b>
          <button className="icon-button" aria-label="Next date range" onClick={() => moveDate(1)}>
            <ChevronRight />
          </button>
        </div>
        <div className="calendar-view-controls">
          <div className="calendar-legend" aria-label="Booking status legend">
            <span>
              <i className="calendar-legend-swatch confirmed-swatch" />
              Confirmed
            </span>
            <span>
              <i className="calendar-legend-swatch pending-swatch" />
              Pending request
            </span>
          </div>
          <div className="tabs calendar-view-tabs" role="tablist" aria-label="Calendar view">
            {['Day', 'Week', 'Month'].map((view) => (
              <button
                key={view}
                role="tab"
                aria-selected={calendarView === view}
                className={calendarView === view ? 'active' : ''}
                onClick={() => {
                  setCalendarView(view);
                  setCalendarSelection(null);
                }}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        <label className="calendar-venue-filter">
          <span>Venue</span>
          <select
            name="calendarVenue"
            value={calendarVenue}
            onChange={(event) => {
              setCalendarVenue(event.target.value);
              setCalendarSelection(null);
            }}
          >
            <option>All venues</option>
            {venues.map((v) => (
              <option key={v.name}>{v.name}</option>
            ))}
          </select>
        </label>
      </div>
      {calendarVenue !== 'All venues' && (
        <div className="calendar-context-row">
          <span className="calendar-filter-context">Showing {calendarVenue}</span>
        </div>
      )}
      {usingPreview && (
        <p className="calendar-preview-note">
          Preview schedule · Live confirmed bookings and pending requests appear here when
          available.
        </p>
      )}

      {calendarView === 'Month' ? (
        <div className="calendar-month-view">
          <div className="calendar-month-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <b key={day}>{day}</b>
            ))}
          </div>
          <div className="calendar-month-grid">
            {monthGridDays.map((day) => {
              const iso = toISODate(day);
              const events = displayBookings.filter((booking) => booking.date === iso);
              return (
                <div
                  key={iso}
                  className={`calendar-month-cell${day.getMonth() !== calendarDate.getMonth() ? ' outside-month' : ''}`}
                >
                  <button
                    className="calendar-month-date"
                    onClick={() => {
                      setCalendarDate(day);
                      setCalendarView('Day');
                      setCalendarSelection(null);
                    }}
                  >
                    {day.getDate()}
                  </button>
                  {events.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      className={`calendar-month-event${String(booking.status).toLowerCase() === 'pending' ? ' pending-event' : ''}`}
                      onClick={() => setCalendarSelection(booking)}
                      aria-label={`${calendarDisplayStatus(booking.status)}: ${booking.event}, ${booking.venue}, ${booking.time}`}
                    >
                      <b>
                        {calendarDisplayStatus(booking.status)} · {booking.time.split(' – ')[0]}
                      </b>{' '}
                      {booking.event}
                    </button>
                  ))}
                  {events.length > 3 && (
                    <span className="calendar-month-more">+{events.length - 3} more</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`calendar-week${calendarView === 'Day' ? ' is-day-view' : ''}`}>
          <div className="time-axis">
            <span></span>
            {[
              '08:00',
              '09:00',
              '10:00',
              '11:00',
              '12:00',
              '13:00',
              '14:00',
              '15:00',
              '16:00',
              '17:00',
            ].map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
          {days.map((day) => {
            const iso = toISODate(day);
            const dateBookings = displayBookings.filter((booking) => booking.date === iso);
            const overlapLayout = calendarEventLayout(dateBookings);
            return (
              <div className="day-col" key={iso}>
                <b>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
                </b>
                <div className="day-slots">
                  {dateBookings.map((booking) => {
                    const [from, to] = booking.time.split(' – ');
                    const top = ((minutesOf(from) - 480) / 600) * 100;
                    const height = ((minutesOf(to) - minutesOf(from)) / 600) * 100;
                    const { column, columns } = overlapLayout.get(booking.id) || {
                      column: 0,
                      columns: 1,
                    };
                    return (
                      <button
                        key={booking.id}
                        type="button"
                        className={`calendar-event${String(booking.status).toLowerCase() === 'pending' ? ' pending-event' : ''}${columns > 1 ? ' is-overlapping' : ''}`}
                        style={{
                          top: `${Math.max(top, 0)}%`,
                          height: `${height}%`,
                          left: `calc(${(column * 100) / columns}% + 3px)`,
                          width: `calc(${100 / columns}% - 6px)`,
                          right: 'auto',
                        }}
                        aria-label={`${calendarDisplayStatus(booking.status)}: ${booking.event}, ${booking.venue}, ${booking.time}`}
                        onClick={() => setCalendarSelection(booking)}
                      >
                        <span className="calendar-event-state">
                          {calendarDisplayStatus(booking.status)}
                        </span>
                        <b>{booking.event}</b>
                        <span>{booking.venue}</span>
                        <small>
                          {from}–{to}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`calendar-mobile-agenda${calendarView === 'Month' ? ' is-month-agenda' : ''}`}
      >
        {calendarView === 'Week' && (
          <div className="calendar-mobile-day-picker" aria-label="Choose a day in this week">
            {weekDates.map((day, index) => (
              <button
                key={toISODate(day)}
                className={mobileCalendarDay === index ? 'active' : ''}
                aria-pressed={mobileCalendarDay === index}
                onClick={() => {
                  setMobileCalendarDay(index);
                  setCalendarSelection(null);
                }}
              >
                <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <b>{day.getDate()}</b>
              </button>
            ))}
          </div>
        )}
        <div className="calendar-agenda-heading">
          <h2>
            {calendarView === 'Month'
              ? 'Bookings this month'
              : agendaDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
          </h2>
          <span>
            {agendaBookings.length} {agendaBookings.length === 1 ? 'booking' : 'bookings'}
          </span>
        </div>
        {agendaBookings.length ? (
          <div className="calendar-agenda-list">
            {calendarView === 'Month'
              ? agendaBookings.map((booking) => (
                  <div className="calendar-agenda-month-group" key={booking.id}>
                    <span>{formatEventDate(booking.date)}</span>
                    {renderAgendaItem(booking)}
                  </div>
                ))
              : agendaBookings.map(renderAgendaItem)}
          </div>
        ) : (
          <p className="calendar-agenda-empty">
            No confirmed bookings or pending requests for this date.
          </p>
        )}
      </div>

      {calendarSelection && (
        <section className="panel calendar-selection" aria-live="polite">
          <div>
            <span className="eyebrow">BOOKING DETAILS</span>
            <h2>{calendarSelection.event}</h2>
            <p>
              {calendarSelection.venue} · {formatEventDate(calendarSelection.date)} ·{' '}
              {calendarSelection.time}
            </p>
            <span>
              {calendarSelection.attendees} attendees
              {isAdmin && calendarSelection.requester
                ? ` · Booked for ${calendarSelection.requester}`
                : ''}
            </span>
          </div>
          {status(calendarDisplayStatus(calendarSelection.status))}
          <button
            className="icon-button"
            aria-label="Close booking details"
            onClick={() => setCalendarSelection(null)}
          >
            <X size={16} />
          </button>
        </section>
      )}
    </>
  );
};

export default CalendarPage;
