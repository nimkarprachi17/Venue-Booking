import React from 'react';
import {
  AlertCircle,
  Ban,
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { formatEventDate, toISODate } from '../utils/dateTime';

export function createAdminPages(model) {
  const academicYearStart =
    new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const {
    heading,
    isAdmin,
    authFilter,
    setAuthFilter,
    visibleAuthRequests,
    button,
    setReviewing,
    setRejectReason,
    setModal,
    reviewRequest,
    authorized,
    status,
    role,
    field,
    notify,
    setRole,
    authorize,
    go,
    venues,
    todaysBookings,
    dashboardBookingRequests,
    dashboardAuthorizationRequests,
    openBooking,
    decision,
    setSelected,
    query,
    setQuery,
    setVenue,
    monthKey,
    monthLabel,
    statusBreakdown,
    volumeBars,
    mostBooked,
    volumeMax,
    venueUtilization,
  } = model;
  const authPage = () => (
    <>
      {heading(
        isAdmin ? 'Authorization requests' : 'Role authorization',
        isAdmin
          ? 'Review role access requests. This is separate from booking approval.'
          : 'CRs and Club Heads need an approved role authorization before booking.',
      )}
      {isAdmin ? (
        <section className="panel auth-review-panel">
          <div className="section-head">
            <div>
              <h2>Requests requiring review</h2>
              <p>Authorization grants booking access; each booking still needs approval.</p>
            </div>
          </div>
          <div className="tabs">
            {['pending', 'approved', 'rejected'].map((t) => (
              <button
                key={t}
                className={authFilter === t ? 'active' : ''}
                onClick={() => setAuthFilter(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {visibleAuthRequests.length === 0 && (
            <div className="empty">
              <ShieldCheck />
              <b>No {authFilter} requests</b>
              <span>Role requests will appear here.</span>
            </div>
          )}
          {visibleAuthRequests.map((r) => (
            <div className="auth-request auth-review-row" key={r._id}>
              <div>
                <b>{r.user?.name || 'Unknown user'}</b>
                <span>
                  {r.type} · {r.details?.name} · {r.user?.email} · Submitted{' '}
                  {new Date(r.createdAt).toLocaleDateString('en-IN')}
                </span>
                {r.details?.note && <small>{r.details.note}</small>}
                {r.status === 'rejected' && r.rejectionReason && (
                  <small className="reason">Reason: {r.rejectionReason}</small>
                )}
              </div>
              <div className="row-actions">
                {button(
                  'Review',
                  () => {
                    setReviewing(r);
                    setRejectReason('');
                    setModal('authorization');
                  },
                  'secondary',
                )}
                {r.status === 'pending' &&
                  button('Approve', () => reviewRequest(r._id, 'approve'), 'primary')}
              </div>
            </div>
          ))}
        </section>
      ) : authorized ? (
        <section className="panel auth-panel">
          <div className="auth-status">
            <ShieldCheck />
            <div>
              <span className="eyebrow">CURRENT STATUS</span>
              <h2>Approved</h2>
              <p>Authorized as {role === 'Faculty' ? 'Class Representative' : role}.</p>
            </div>
            {status('Approved')}
          </div>
          <div className="notice">
            Your authorization is approved. Every booking request still requires admin approval.
          </div>
          {field(
            'Authorized class or club',
            <input name="authorizedClub" placeholder="Class or club name" />,
          )}
          {field(
            'Supporting information',
            <textarea
              name="supportingInfo"
              rows="3"
              placeholder="Add information that supports this authorization."
            />,
          )}
          {button('Update details', () => notify('Authorization details updated'), 'primary')}
        </section>
      ) : (
        <section className="panel auth-panel">
          <div className="auth-status">
            <AlertCircle />
            <div>
              <span className="eyebrow">CURRENT STATUS</span>
              <h2>{authorized ? 'Not requested' : 'Pending review'}</h2>
              <p>
                {authorized
                  ? 'Submit a request for your college role.'
                  : 'Awaiting admin review.'}
              </p>
            </div>
            {status(authorized ? 'Not Requested' : 'Pending')}
          </div>
          {!authorized ? (
            <div className="notice warning">
              Your request is in the admin review queue. You can book after authorization is
              approved.
            </div>
          ) : (
            <>
              <div className="form-grid">
                {field(
                  'Requested role',
                  <select
                    name="requestedRole"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option>Class Representative</option>
                    <option>Club Head</option>
                  </select>,
                )}
                {field(
                  'Class or club',
                  <input name="classOrClub" placeholder="e.g. CSE 3rd Year / Coding Club" />,
                )}
                {field(
                  'Academic year',
                  <select name="academicYear">
                    {[academicYearStart, academicYearStart - 1].map((year) => (
                      <option key={year}>
                        {year}–{String(year + 1).slice(-2)}
                      </option>
                    ))}
                  </select>,
                )}
                {field(
                  'Supporting information',
                  <textarea
                    name="supportingInfo"
                    rows="4"
                    placeholder="Describe your role and include relevant details"
                  />,
                )}
              </div>
              {button('Submit request', authorize, 'primary')}
            </>
          )}
        </section>
      )}
    </>
  );
  // Administrator operations screens.
  const adminOverview = () => (
    <>
      {heading(
        'Admin overview',
        `Operations at a glance for ${new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}.`,
        button('Create booking', () => go('Create Booking'), 'primary', Plus),
      )}
      <div className="admin-kpis">
        <div>
          <span>Total venues</span>
          <b>{venues.length}</b>
          <small>{venues.length} active</small>
        </div>
        <div>
          <span>Today’s bookings</span>
          <b>{todaysBookings.length}</b>
          <small>Across {new Set(todaysBookings.map((b) => b.venue)).size} venues</small>
        </div>
        <div>
          <span>Booking requests</span>
          <b>{dashboardBookingRequests.length}</b>
          <small>Require your review</small>
        </div>
        <div>
          <span>Authorization requests</span>
          <b>{dashboardAuthorizationRequests.length}</b>
          <small>Require your review</small>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel wide admin-queue-panel">
          <div className="section-head">
            <div>
              <h2>Booking requests</h2>
              <p>Only CR and Club Head requests need approval.</p>
            </div>
            {button('View queue', () => go('Booking Requests'), 'text')}
          </div>
          <div className="overview-request-list">
            {dashboardBookingRequests.length === 0 ? (
              <div className="overview-empty">
                <CalendarDays size={19} />
                <span>No booking requests need review.</span>
              </div>
            ) : (
              dashboardBookingRequests.slice(0, 4).map((booking) => {
                const requesterInitials = booking.requester
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0].toUpperCase())
                  .join('');
                return (
                  <article className="overview-request" key={booking.id}>
                    <div className="overview-request-identity">
                      <span className="overview-request-avatar">{requesterInitials}</span>
                      <div>
                        <b>{booking.requester}</b>
                        <span>{booking.role}</span>
                      </div>
                    </div>
                    <div className="overview-request-event">
                      <button className="overview-event-link" onClick={() => openBooking(booking)}>
                        {booking.event}
                      </button>
                      <span>{booking.venue}</span>
                    </div>
                    <div className="overview-request-time">
                      <b>{formatEventDate(booking.date)}</b>
                      <span>
                        {booking.time} · {booking.attendees} attendees
                      </span>
                    </div>
                    <div className="overview-request-actions">
                      {button('Approve', () => decision(booking.id, 'Approved'), 'primary')}
                      {button(
                        'Reject',
                        () => {
                          setSelected(booking);
                          setModal('reject');
                        },
                        'text danger',
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Authorization requests</h2>
              <p>Separate from booking approvals.</p>
            </div>
            {button('View all', () => go('Authorization Requests'), 'text')}
          </div>
          {dashboardAuthorizationRequests.length === 0 && (
            <div className="overview-empty compact">
              <ShieldCheck size={18} />
              <span>No authorization requests need review.</span>
            </div>
          )}
          {dashboardAuthorizationRequests.slice(0, 3).map((r) => (
            <div className="auth-request dashboard-auth-request" key={r._id}>
              <div>
                <b>{r.user?.name || 'Unknown user'}</b>
                <span>
                  {r.type} · {r.details?.name}
                </span>
                <small>{r.details?.department}</small>
              </div>
              <div>
                {button(
                  'Review',
                  () => {
                    setReviewing(r);
                    setRejectReason('');
                    setModal('authorization');
                  },
                  'secondary',
                )}
              </div>
            </div>
          ))}
        </section>
        <section className="panel schedule">
          <div className="section-head">
            <div>
              <h2>Today’s schedule</h2>
              <p>
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} · All
                venues
              </p>
            </div>
            {button('Calendar', () => go('Booking Calendar'), 'text')}
          </div>
          {todaysBookings.length === 0 && (
            <div className="overview-empty compact">
              <CalendarDays size={18} />
              <span>No bookings scheduled today.</span>
            </div>
          )}
          {todaysBookings.map((b) => (
            <div className="schedule-row" key={b.id}>
              <b>{b.time.split(' – ')[0]}</b>
              <span>{b.event}</span>
              <small>{b.venue}</small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
  const venueAdmin = () => (
    <>
      {heading(
        'Venue management',
        'Manage campus spaces and their booking availability.',
        button('Add venue', () => setModal('add-venue'), 'primary', Plus),
      )}
      <div className="toolbar">
        <div className="input-icon">
          <Search size={16} />
          <input
            name="venueAdminSearch"
            placeholder="Search venues"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select name="capacityFilter">
          <option>All capacities</option>
          <option>Under 50</option>
          <option>50–100</option>
          <option>100+</option>
        </select>
        <select name="facilityFilter">
          <option>All facilities</option>
          <option>Projector</option>
          <option>Accessible</option>
        </select>
      </div>
      <div className="table-wrap venue-management-table">
        <table>
          <thead>
            <tr>
              {['Venue', 'Location', 'Capacity', 'Facilities', 'Status', 'Actions'].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues
              .filter((v) => v.name.toLowerCase().includes(query.toLowerCase()))
              .map((v) => (
                <tr key={v.name}>
                  <td>
                    <b>{v.name}</b>
                  </td>
                  <td>{v.building}</td>
                  <td>{v.capacity}</td>
                  <td>{v.facilities.join(', ')}</td>
                  <td>
                    <span className="status approved">Active</span>
                  </td>
                  <td>
                    {button(
                      'Edit',
                      () => {
                        setVenue(v.name);
                        setModal('edit-venue');
                      },
                      'text',
                      Pencil,
                    )}
                    {button(
                      'Deactivate',
                      () => {
                        setVenue(v.name);
                        setModal('deactivate');
                      },
                      'text danger',
                      Ban,
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="venue-management-cards">
        {venues
          .filter((v) => v.name.toLowerCase().includes(query.toLowerCase()))
          .map((v) => (
            <article className="venue-management-card" key={v.name}>
              <div className="mobile-card-topline">
                <h3>{v.name}</h3>
                <span className="status approved">Active</span>
              </div>
              <p className="mobile-card-venue">
                <MapPin size={14} />
                {v.building}
              </p>
              <div className="venue-mobile-capacity">
                <span>Capacity</span>
                <b>{v.capacity} people</b>
              </div>
              <div className="chips">
                {v.facilities.map((facility) => (
                  <span key={facility}>{facility}</span>
                ))}
              </div>
              <div className="mobile-card-actions">
                {button(
                  'Edit',
                  () => {
                    setVenue(v.name);
                    setModal('edit-venue');
                  },
                  'secondary',
                  Pencil,
                )}
                {button(
                  'Deactivate',
                  () => {
                    setVenue(v.name);
                    setModal('deactivate');
                  },
                  'text danger',
                  Ban,
                )}
              </div>
            </article>
          ))}
      </div>
    </>
  );
  const analytics = () => (
    <>
      {heading(
        'Analytics',
        'Booking patterns and venue utilization.',
        <div className="toolbar">
          <input
            name="analyticsFrom"
            type="date"
            aria-label="From date"
            defaultValue={`${monthKey}-01`}
          />
          <span>to</span>
          <input
            name="analyticsTo"
            type="date"
            aria-label="To date"
            defaultValue={toISODate(
              new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            )}
          />
        </div>,
      )}
      <section className="panel analytics-summary" aria-label={`${monthLabel} booking summary`}>
        <div>
          <span>Total requests</span>
          <b>{statusBreakdown.reduce((total, [, count]) => total + count, 0)}</b>
        </div>
        <div>
          <span>Confirmed and approved</span>
          <b>{volumeBars.reduce((total, count) => total + count, 0)}</b>
        </div>
        <div>
          <span>Pending review</span>
          <b>{statusBreakdown.find(([name]) => name === 'Pending')?.[1] ?? 0}</b>
        </div>
        <div>
          <span>Most booked venue</span>
          <b>{mostBooked[0]?.[0] || '—'}</b>
          <small>{mostBooked[0]?.[1] || 'No bookings yet'}</small>
        </div>
      </section>
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <h2>Booking volume</h2>
              <p>Confirmed and approved bookings · {monthLabel}</p>
            </div>
          </div>
          <div className="bar-chart">
            {volumeBars.map((n, i) => (
              <div key={i}>
                <span
                  title={`${n} bookings`}
                  style={{ height: `${volumeMax ? Math.round((n / volumeMax) * 145) : 0}px` }}
                ></span>
                <small>
                  {['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'][i]}
                </small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <i />
            Bookings
          </div>
        </section>
        <section className="panel">
          <h2>Venue utilization</h2>
          <p className="muted">Booked hours as a share of available hours</p>
          {venueUtilization.map(([name, n]) => (
            <div className="util-row" key={name}>
              <span>{name}</span>
              <div className="progress">
                <i style={{ width: `${n}%` }} />
              </div>
              <b>{n}%</b>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Most booked venues</h2>
          {mostBooked.length ? (
            <div className="rank-list">
              {mostBooked.map((x, i) => (
                <div key={x[0]}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <span>{x[0]}</span>
                  <small>{x[1]}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No bookings recorded for this month.</p>
          )}
        </section>
      </div>
    </>
  );

  return { authPage, adminOverview, venueAdmin, analytics };
}
