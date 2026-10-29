import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Ban,
  Building2,
  CalendarDays,
  Check,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';

export function createUserPages(model) {
  const {
    heading,
    greeting,
    displayName,
    button,
    go,
    bookings,
    table,
    status,
    venues,
    venue,
    setVenue,
    venuesLoading,
    venuesError,
    loadVenues,
    getFacilityLabel,
    field,
    query,
    setQuery,
    notify,
    venueRow,
    setModal,
    isAdmin,
    bookingAttendees,
    setBookingAttendees,
    role,
    bookingDate,
    setBookingDate,
    bookingStartTime,
    setBookingStartTime,
    bookingEndTime,
    setBookingEndTime,
    createBooking,
    filter,
    setFilter,
    filteredBookings,
    selected,
    closeBookingDetails,
  } = model;
  // Student and faculty screens.
  const dashboard = () => (
    <>
      {heading(
        `${greeting()}, ${displayName.split(' ')[0]}`,
        'Manage your campus venue bookings.',
        button('Book a venue', () => go('Find a Venue'), 'primary', Plus),
      )}
      <div className="summary-line">
        <div>
          <b>{bookings.filter((b) => ['Confirmed', 'Approved'].includes(b.status)).length}</b>
          <span>Upcoming bookings</span>
        </div>
        <div>
          <b>{bookings.filter((b) => b.status === 'Pending').length}</b>
          <span>Pending requests</span>
        </div>
        <div>
          <b>{bookings.filter((b) => b.status === 'Confirmed').length}</b>
          <span>Confirmed</span>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="section-head">
            <div>
              <h2>Upcoming bookings</h2>
              <p>Your confirmed and pending reservations</p>
            </div>
            {button('View all', () => go('My Bookings'), 'text')}
          </div>
          {table(
            bookings
              .filter((b) => ['Confirmed', 'Approved', 'Pending'].includes(b.status))
              .slice(0, 3),
          )}
        </section>
        <section className="panel updates">
          <div className="section-head">
            <div>
              <h2>Recently updated</h2>
              <p>Latest booking activity</p>
            </div>
          </div>
          {bookings.slice(0, 3).map((b) => (
            <div className="update-item" key={b.id}>
              <div>
                <b>{b.event}</b>
                <span>
                  {b.venue} · {b.date}
                </span>
              </div>
              {status(b.status)}
            </div>
          ))}
        </section>
        <section className="panel recommendations">
          <div className="section-head">
            <div>
              <h2>Campus venues</h2>
              <p>Browse spaces by capacity and facilities</p>
            </div>
            {button('Explore', () => go('Find a Venue'), 'text')}
          </div>
          {venues.slice(0, 2).map((v) => (
            <div className="recommend-item" key={v._id}>
              <div>
                <b>{v.name}</b>
                {!v.isActive && <span className="venue-inactive-note">Inactive · view only</span>}
                <span>
                  Capacity {v.capacity} · {v.facilities.slice(0, 2).map(getFacilityLabel).join(' · ')}
                </span>
              </div>
              <ArrowRight
                size={16}
                onClick={() => {
                  setVenue(v._id);
                  go('Venue Details', { venueId: v._id });
                }}
              />
            </div>
          ))}
        </section>
      </div>
    </>
  );
  const findVenue = () => (
    <>
      {heading('Find a venue', 'Search campus spaces and compare availability.')}
      <div className="filter-panel">
        <div className="search-line">
          {field(
            'Search by venue or location',
            <div className="input-icon">
              <Search size={16} />
              <input
                name="venueSearch"
                placeholder="Try ‘Academic Block’"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>,
          )}
        </div>
        <div className="filter-grid">
          {field('Event date', <input name="searchDate" type="date" />)}
          {field('Start time', <input name="searchStartTime" type="time" />)}
          {field('End time', <input name="searchEndTime" type="time" />)}
          {field('Attendees', <input name="searchAttendees" type="number" min="1" />)}
          {field(
            'Event type',
            <select name="searchEventType">
              <option>Presentation</option>
              <option>Workshop</option>
              <option>Meeting</option>
              <option>Lecture</option>
              <option>Other</option>
            </select>,
          )}
          {field(
            'Facilities',
            <select name="searchFacilities">
              <option>Projector</option>
              <option>Video conferencing</option>
              <option>PA system</option>
            </select>,
          )}
        </div>
        <div className="filter-actions">
          {button('Reset', () => {
            setQuery('');
          })}
          {button(
            'Apply filters',
            () => notify('Venue availability updated'),
            'primary',
            SlidersHorizontal,
          )}
        </div>
      </div>
      <div className="results-heading">
        <b>
          {
            venues.filter((v) =>
              `${v.name} ${v.building}`.toLowerCase().includes(query.toLowerCase()),
            ).length
          }{' '}
          venues
        </b>
        <label>
          Sort by{' '}
          <select name="sortBy">
            <option>Best fit</option>
            <option>Capacity</option>
            <option>Name</option>
          </select>
        </label>
      </div>
      <div className="venue-list">
        {venuesLoading && <div className="venue-empty-state">Loading available venues…</div>}
        {!venuesLoading && venuesError && (
          <div className="venue-empty-state">
            <b>Could not load venues</b>
            <span>{venuesError}</span>
            {button('Try again', loadVenues)}
          </div>
        )}
        {!venuesLoading && !venuesError && venues.length === 0 && (
          <div className="venue-empty-state">
            <b>No active venues are available</b>
            <span>Check back after an administrator adds or activates a venue.</span>
          </div>
        )}
        {venues
          .filter((v) => `${v.name} ${v.building}`.toLowerCase().includes(query.toLowerCase()))
          .map(venueRow)}
        {!venuesLoading && !venuesError && venues.length > 0 && venues.every(
          (v) => !`${v.name} ${v.building}`.toLowerCase().includes(query.toLowerCase()),
        ) && (
          <div className="venue-empty-state">
            <Search size={20} />
            <b>No venues match “{query}”</b>
            <span>Try a venue name or building.</span>
          </div>
        )}
      </div>
    </>
  );
  const createForm = () => (
    <>
      {heading('Create a booking', 'Enter your event details and confirm the venue.')}
      <div className="form-layout">
        <section className="panel form-panel">
          <h2>Event details</h2>
          <div className={`form-grid booking-event-grid${isAdmin ? ' is-admin' : ''}`}>
            {isAdmin &&
              field(
                'Booking for',
                <input name="bookingFor" placeholder="Name and college email" />,
                '',
                true,
              )}
            {field(
              'Event title',
              <input
                id="eventTitle"
                name="eventTitle"
                placeholder="e.g. CSE Project Presentation"
              />,
              '',
              true,
            )}
            {field(
              'Event type',
              <select name="eventType">
                <option>Presentation</option>
                <option>Workshop</option>
                <option>Meeting</option>
                <option>Club event</option>
                <option>Other</option>
              </select>,
              '',
              true,
            )}
            {field(
              'Attendees',
              <input
                id="attendees"
                name="attendees"
                type="number"
                min="1"
                value={bookingAttendees}
                onChange={(event) => setBookingAttendees(event.target.value)}
              />,
              '',
              true,
            )}
            {field(
              'Purpose or description',
              <textarea
                name="eventDescription"
                rows="3"
                placeholder="Briefly describe the event"
              />,
            )}
          </div>
          <div className="booking-section-heading">
            <h3>Venue &amp; schedule</h3>
            <p>Choose where and when the event will take place.</p>
          </div>
          <div className="form-grid booking-schedule-grid">
            {field(
              'Venue',
              <select name="venue" value={venue} onChange={(e) => setVenue(e.target.value)}>
                <option value="">Choose a venue</option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id} disabled={!v.isActive}>
                    {v.name}{v.isActive ? '' : ' (Inactive — unavailable for booking)'}
                  </option>
                ))}
              </select>,
              '',
              true,
            )}
            {field(
              'Event date',
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                value={bookingDate}
                onChange={(event) => setBookingDate(event.target.value)}
              />,
              '',
              true,
            )}
            {field(
              'Start time',
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={bookingStartTime}
                onChange={(event) => setBookingStartTime(event.target.value)}
              />,
              '',
              true,
            )}
            {field(
              'End time',
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={bookingEndTime}
                onChange={(event) => setBookingEndTime(event.target.value)}
              />,
              '',
              true,
            )}
            {field(
              'Required facilities',
              <div className="checkboxes">
                <label>
                  <input type="checkbox" name="facilityProjector" defaultChecked /> Projector
                </label>
                <label>
                  <input type="checkbox" name="facilityVideoConferencing" /> Video conferencing
                </label>
              </div>,
            )}
          </div>
          <div className="form-footer">
            <span>
              <span className="required-mark" aria-hidden="true">
                *
              </span>{' '}
              Required fields
            </span>
            {button(
              isAdmin
                ? 'Create booking'
                : role === 'Faculty'
                  ? 'Confirm Booking'
                  : 'Submit for Approval',
              createBooking,
              'primary',
            )}
          </div>
        </section>
        <aside className="panel booking-summary">
          <h2>Booking summary</h2>
          <div className="summary-venue">
            <Building2 />
            <div>
              <b>{venues.find((v) => v._id === venue)?.name || 'Choose a venue'}</b>
              <span>{venues.find((v) => v._id === venue)?.location || 'Venue location'}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>
                {bookingDate
                  ? new Date(`${bookingDate}T12:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Choose a date'}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {bookingStartTime} – {bookingEndTime}
              </dd>
            </div>
            <div>
              <dt>Attendees</dt>
              <dd>{bookingAttendees || '0'} people</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>{venues.find((v) => v._id === venue)?.capacity || '—'} people</dd>
            </div>
            <div>
              <dt>Facilities</dt>
              <dd>{venues.find((v) => v._id === venue)?.facilities.map(getFacilityLabel).join(', ') || '—'}</dd>
            </div>
          </dl>
          {role !== 'Faculty' && !isAdmin && (
            <p className="summary-note">
              <AlertCircle size={15} />
              Bookings by {role}s require admin approval.
            </p>
          )}
          {venues.find((v) => v._id === venue && !v.isActive) && (
            <p className="summary-note venue-inactive-warning">
              <AlertCircle size={15} />
              This venue is inactive and cannot be booked.
            </p>
          )}
        </aside>
      </div>
    </>
  );
  const details = () => {
    const v = venues.find((x) => x._id === venue);
    if (!v) {
      return (
        <>
          {heading('Venue details', 'This venue is no longer available.', button('Back to search', () => go('Find a Venue')))}
          <section className="panel venue-empty-state">
            <b>Venue not found</b>
            <span>It may have been deactivated or removed by an administrator.</span>
          </section>
        </>
      );
    }
    return (
      <>
        {heading(
          'Venue details',
          'Review facilities and availability before booking.',
          button('Back to search', () => go('Find a Venue')),
        )}
        <div className="detail-layout">
          <div>
            {v.imageUrl ? (
              <img className="detail-photo" src={v.imageUrl} alt={v.name} />
            ) : (
              <div className="detail-photo venue-image-placeholder"><MapPin size={24} /><span>No image provided</span></div>
            )}
            <section className="panel detail-copy">
              <span className="eyebrow">VENUE · {v.location}</span>
              <h2>{v.name}</h2>
              {!v.isActive && <span className="status inactive">Inactive · not available for booking</span>}
              {v.description && <p>{v.description}</p>}
              <div className="detail-facts">
                <span>
                  <Users />
                  {v.capacity} people
                </span>
                {v.facilities.map((f) => (
                  <span key={f}>
                    <Check />
                  {getFacilityLabel(f)}
                  </span>
                ))}
              </div>
              <h3>Suitable for</h3>
              <p>Presentations · Workshops · Department meetings · Student events</p>
            </section>
          </div>
          <aside className="panel availability">
            <h2>Check availability</h2>
            <p>Choose a date and time in the booking form. The system checks the venue schedule before submission.</p>
            {v.isActive ? (
              button('Book this venue', () => go('Create Booking'), 'primary')
            ) : (
              <p className="summary-note venue-inactive-warning">
                <AlertCircle size={15} />
                This venue is inactive. You can view its details, but it cannot be booked.
              </p>
            )}
          </aside>
        </div>
      </>
    );
  };
  const bookingsPage = () => (
    <>
      {heading(
        isAdmin ? 'Booking requests' : 'My bookings',
        isAdmin
          ? 'Review booking requests and manage venue reservations.'
          : 'Track requests and manage your venue reservations.',
        button('Book a venue', () => go('Find a Venue'), 'primary', Plus),
      )}
      <div className="toolbar booking-toolbar">
        <div className="tabs">
          {['All', 'Pending', 'Approved', 'Rejected'].map((t) => (
            <button key={t} className={filter === t ? 'active' : ''} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="toolbar-filters">
          <div className="input-icon">
            <Search size={16} />
            <input
              name="bookingSearch"
              placeholder="Search bookings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      {table(filteredBookings, isAdmin)}
      {selected && (
        <div className="detail-inline">
          <button className="close-inline" onClick={closeBookingDetails}>
            <X size={16} />
          </button>
          <b>{selected.event}</b>
          <span>
            {selected.venue} · {selected.date} · {selected.time}
          </span>
          <div>
            {status(selected.status)}
            {selected.reason && <p className="reason">Reason: {selected.reason}</p>}
          </div>
          {['Pending', 'Confirmed', 'Approved'].includes(selected.status) &&
            button('Cancel booking', () => setModal('cancel'), 'text danger', Ban)}
        </div>
      )}
    </>
  );
  return { dashboard, findVenue, createForm, details, bookingsPage };
}
