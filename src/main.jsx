import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search,
  CalendarDays,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  MapPin,
  Users,
  Check,
  AlertCircle,
  Building2,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Pencil,
  Ban,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import './style.css';

// Sample records used to make the frontend flows usable without live venue data.
const initialBookings = [
  {
    id: 'BK-24018',
    event: 'CSE Project Presentation',
    venue: 'Seminar Hall 2',
    date: '2026-10-21',
    time: '10:00 – 12:00',
    requested: '17 Oct 2026',
    updatedAt: '2026-10-18T09:42:00+05:30',
    status: 'Confirmed',
    requester: 'Prachi Sharma',
    role: 'Faculty',
    attendees: 72,
  },
  {
    id: 'BK-24012',
    event: 'Web Development Workshop',
    venue: 'Computer Lab 1',
    date: '2026-10-23',
    time: '14:00 – 16:00',
    requested: '16 Oct 2026',
    updatedAt: '2026-10-18T08:15:00+05:30',
    status: 'Pending',
    requester: 'Arjun Mehta',
    role: 'Club Head',
    attendees: 48,
  },
  {
    id: 'BK-23997',
    event: 'Coding Club Meetup',
    venue: 'Conference Room A',
    date: '2026-10-25',
    time: '11:00 – 12:30',
    requested: '15 Oct 2026',
    updatedAt: '2026-10-17T17:30:00+05:30',
    status: 'Approved',
    requester: 'Nisha Rao',
    role: 'Class Representative',
    attendees: 24,
  },
  {
    id: 'BK-23941',
    event: 'Design Thinking Session',
    venue: 'Classroom C-204',
    date: '2026-10-16',
    time: '09:00 – 11:00',
    requested: '12 Oct 2026',
    updatedAt: '2026-10-16T08:20:00+05:30',
    status: 'Rejected',
    reason: 'Venue is reserved for department examinations.',
    requester: 'Kabir Das',
    role: 'Club Head',
    attendees: 62,
  },
];
// Venue inventory shown in search, recommendations, details, and administration.
const venues = [
  {
    name: 'Main Auditorium',
    building: 'Central Block · Ground floor',
    capacity: 300,
    facilities: ['Projector', 'PA system', 'Stage', 'Accessible'],
    img: 'photo-1475721027785-f74eccf877e2',
  },
  {
    name: 'Seminar Hall 2',
    building: 'Academic Block B · Level 2',
    capacity: 100,
    facilities: ['Projector', 'Video conferencing', 'Whiteboard'],
    img: 'photo-1517457373958-b7a2e6b815ab',
  },
  {
    name: 'Conference Room A',
    building: 'Administration Block · Level 1',
    capacity: 30,
    facilities: ['Display', 'Video conferencing', 'Whiteboard'],
    img: 'photo-1497366216548-37526070297c',
  },
  {
    name: 'Computer Lab 1',
    building: 'Technology Block · Level 3',
    capacity: 60,
    facilities: ['60 workstations', 'Projector', 'Wi-Fi'],
    img: 'photo-1581092921461-eab62e97a780',
  },
  {
    name: 'Classroom C-204',
    building: 'Academic Block C · Level 2',
    capacity: 80,
    facilities: ['Projector', 'Whiteboard', 'Accessible'],
    img: 'photo-1497366754035-f200968a6e72',
  },
];
const navUser = [
  ['Overview', 'space_dashboard'],
  ['Find a Venue', 'search'],
  ['My Bookings', 'calendar_month'],
  ['Authorization', 'verified_user'],
  ['Notifications', 'notifications'],
  ['Profile', 'person'],
];
const navAdmin = [
  ['Overview', 'space_dashboard'],
  ['Booking Requests', 'assignment'],
  ['Authorization Requests', 'verified_user'],
  ['Venue Management', 'meeting_room'],
  ['Booking Calendar', 'calendar_month'],
  ['Analytics', 'analytics'],
];
function App() {
  // Current page and signed-in user's role.
  const [role, setRole] = useState('Faculty');
  const [page, setPage] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Booking and venue workspace state.
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [venue, setVenue] = useState('Seminar Hall 2');
  const [showPassword, setShowPassword] = useState(false);
  const [month, setMonth] = useState(0);

  // Sign-in, sign-up, and email verification state.
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [authView, setAuthView] = useState('signin');
  const [accessReviewStatus, setAccessReviewStatus] = useState('pending');
  const [signupRole, setSignupRole] = useState('Faculty');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupStep, setSignupStep] = useState('details');
  const [otpCode, setOtpCode] = useState('');
  const [signupBusy, setSignupBusy] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  // Authorization and profile-menu state.
  const [authorized, setAuthorized] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = role === 'Admin';
  const nav = isAdmin ? navAdmin : navUser;
  const go = (p) => {
    setPage(p);
    setMobileOpen(false);
    setSelected(null);
  };
  const notify = (s) => {
    setToast(s);
    setTimeout(() => setToast(''), 3000);
  };
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Registration, email verification, and sign-in requests.
  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = setTimeout(() => setResendWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendWait]);
  const startRegistration = async () => {
    if (signupName.trim().length < 2) {
      setLoginError('Enter your full name.');
      return;
    }
    if (!/.+@.+\..+/.test(loginEmail)) {
      setLoginError('Enter a valid college email address.');
      return;
    }
    if (signupPassword.length < 8) {
      setLoginError('Use a password with at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setLoginError('Passwords do not match.');
      return;
    }
    setLoginError('');
    setSignupBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupName,
          email: loginEmail,
          role: signupRole,
          password: signupPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not start registration.');
      setSignupStep('otp');
      setOtpCode('');
      setResendWait(data.resendAfterSeconds || 60);
      notify('Verification code sent to your college email.');
    } catch (error) {
      setLoginError(
        error.message ||
          'Could not reach the registration service. Check that the server is running.',
      );
    } finally {
      setSignupBusy(false);
    }
  };
  const verifyRegistrationOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setLoginError('Enter the six-digit code sent to your email.');
      return;
    }
    setLoginError('');
    setSignupBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, code: otpCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not verify the code.');
      setRole(data.user.role);
      const isApproved =
        data.user.role === 'Faculty' ||
        data.user.role === 'Admin' ||
        data.user.authorizationStatus === 'approved';
      setAuthorized(isApproved);
      setAccessReviewStatus(data.user.authorizationStatus || 'pending');
      setLoginEmail(data.user.email);
      setLoginPassword('');
      setAuthView('signin');
      setSignupStep('details');
      setSignupName('');
      setSignupPassword('');
      setSignupConfirm('');
      setOtpCode('');
      if (!isApproved) {
        go('Access Pending');
        notify('Email verified. Your profile is waiting for admin approval.');
      } else {
        go('Sign in');
        notify('Email verified. Your account is ready to sign in.');
      }
    } catch (error) {
      setLoginError(error.message || 'Could not reach the verification service.');
    } finally {
      setSignupBusy(false);
    }
  };
  const resendRegistrationOtp = async () => {
    setLoginError('');
    setSignupBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not resend the code.');
      setResendWait(data.resendAfterSeconds || 60);
      notify('A new code was sent.');
    } catch (error) {
      setLoginError(error.message || 'Could not resend the code.');
    } finally {
      setSignupBusy(false);
    }
  };
  const cancelRegistration = () => {
    fetch(`${apiBase}/api/auth/cancel-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail }),
    }).catch(() => {});
    setSignupStep('details');
    setOtpCode('');
    setResendWait(0);
    setLoginError('');
  };
  const signIn = async () => {
    if (loginLoading) return;
    if (!/.+@.+\..+/.test(loginEmail)) {
      setLoginError('Enter a valid college email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Enter your password.');
      return;
    }
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not sign in.');
      setRole(data.user.role);
      const isApproved =
        data.user.role === 'Faculty' ||
        data.user.role === 'Admin' ||
        data.user.authorizationStatus === 'approved';
      setAuthorized(isApproved);
      if (!isApproved) {
        setAccessReviewStatus(data.user.authorizationStatus || 'pending');
        go('Access Pending');
        return;
      }
      go('Overview');
      notify('Signed in successfully');
    } catch (error) {
      setLoginError(
        error.message || 'Could not reach the sign-in service. Check that the server is running.',
      );
    } finally {
      setLoginLoading(false);
    }
  };
  // Booking actions and derived data.
  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (filter === 'All' || b.status === filter) &&
          `${b.event} ${b.venue} ${b.requester}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [bookings, filter, query],
  );
  const createBooking = () => {
    setBookings([
      {
        id: `BK-${24020 + bookings.length}`,
        event: document.getElementById('eventTitle')?.value || 'Student Research Showcase',
        venue,
        date: document.getElementById('eventDate')?.value || '2026-10-28',
        time: `${document.getElementById('startTime')?.value || '10:00'} – ${document.getElementById('endTime')?.value || '12:00'}`,
        requested: '18 Oct 2026',
        updatedAt: new Date().toISOString(),
        status: role === 'Faculty' || isAdmin ? 'Confirmed' : 'Pending',
        requester: 'Prachi Sharma',
        role,
        attendees: Number(document.getElementById('attendees')?.value || 48),
      },
      ...bookings,
    ]);
    notify(
      isAdmin
        ? 'Booking created successfully'
        : role === 'Faculty'
          ? 'Booking confirmed'
          : 'Request submitted for admin approval',
    );
    go('My Bookings');
  };
  const authorize = () => {
    setAuthorized(false);
    notify('Authorization request submitted');
  };
  const decision = (id, status) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status, updatedAt: new Date().toISOString() } : b)),
    );
    notify(`Booking ${status.toLowerCase()}`);
    setModal('');
  };
  // Shared presentational helpers used by multiple screens.
  const status = (s) => <span className={`status ${s.toLowerCase()}`}>{s}</span>;
  const formatEventDate = (dateString) =>
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${dateString}T12:00:00`));
  const formatActivityTime = (dateString) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  const button = (label, onClick, kind = 'secondary', icon = null) => (
    <button className={`button ${kind}`} onClick={onClick}>
      {icon && React.createElement(icon, { size: 16 })}
      {label}
    </button>
  );
  const field = (label, control, extra = '') => (
    <label className="field">
      <span>{label}</span>
      {control}
      {extra && <small>{extra}</small>}
    </label>
  );
  const heading = (title, sub, action) => (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
  const table = (rows, admin = false) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {(admin
              ? [
                  'Requester',
                  'Role',
                  'Event',
                  'Venue',
                  'Date & time',
                  'Attendees',
                  'Submitted',
                  'Status',
                  '',
                ]
              : ['Event', 'Venue', 'Date', 'Time', 'Request date', 'Status', '']
            ).map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} onClick={() => setSelected(b)} className="click-row">
              {admin ? (
                <>
                  <td>
                    <b>{b.requester}</b>
                  </td>
                  <td>{b.role}</td>
                  <td>{b.event}</td>
                  <td>{b.venue}</td>
                  <td>
                    {b.date}
                    <small>{b.time}</small>
                  </td>
                  <td>{b.attendees}</td>
                  <td>{b.requested}</td>
                  <td>{status(b.status)}</td>
                  <td className="row-actions">
                    {button('Approve', () => decision(b.id, 'Approved'), 'text')}
                    {button(
                      'Reject',
                      () => {
                        setSelected(b);
                        setModal('reject');
                      },
                      'text danger',
                    )}
                  </td>
                </>
              ) : (
                <>
                  <td>
                    <b>{b.event}</b>
                    <small>{b.id}</small>
                    {b.reason && <small className="reason">Reason: {b.reason}</small>}
                  </td>
                  <td>{b.venue}</td>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>{b.requested}</td>
                  <td>{status(b.status)}</td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(b);
                      }}
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="empty">
          <CalendarDays />
          <b>No bookings found</b>
          <span>Try changing your filters or search terms.</span>
        </div>
      )}
    </div>
  );
  const venueRow = (v, i) => (
    <article className="venue-row" key={v.name}>
      <img
        src={`https://images.unsplash.com/${v.img}?auto=format&fit=crop&w=600&q=80`}
        alt={`${v.name} interior`}
      />
      <div className="venue-main">
        <h3>{v.name}</h3>
        <p>
          <MapPin size={14} />
          {v.building}
        </p>
        <div className="chips">
          {v.facilities.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </div>
      <div className="venue-cap">
        <span>Capacity</span>
        <b>{v.capacity} people</b>
      </div>
      <div className="venue-availability">
        <span className="available-dot" />
        Available for selected time
      </div>
      <div className="venue-actions">
        {button('Details', () => {
          setVenue(v.name);
          go('Venue Details');
        })}
        {button(
          'Book venue',
          () => {
            setVenue(v.name);
            go('Create Booking');
          },
          'primary',
        )}
      </div>
    </article>
  );
  // Student and faculty screens.
  const dashboard = () => (
    <>
      {heading(
        `Good morning, Prachi`,
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
        {role !== 'Faculty' && !authorized && (
          <div className="auth-notice">
            <AlertCircle size={17} />
            <span>Booking access requires role authorization.</span>
            {button('Request authorization', () => go('Authorization'), 'text')}
          </div>
        )}
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
              <h2>Recommended venues</h2>
              <p>Good fits for your upcoming events</p>
            </div>
            {button('Explore', () => go('Find a Venue'), 'text')}
          </div>
          {venues.slice(1, 3).map((v) => (
            <div className="recommend-item" key={v.name}>
              <div>
                <b>{v.name}</b>
                <span>Fits your group · projector available</span>
              </div>
              <ArrowRight
                size={16}
                onClick={() => {
                  setVenue(v.name);
                  go('Venue Details');
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
                placeholder="Try ‘Academic Block’"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>,
          )}
        </div>
        <div className="filter-grid">
          {field('Event date', <input type="date" defaultValue="2026-10-21" />)}
          {field('Start time', <input type="time" defaultValue="10:00" />)}
          {field('End time', <input type="time" defaultValue="12:00" />)}
          {field('Attendees', <input type="number" defaultValue="72" />)}
          {field(
            'Event type',
            <select>
              <option>Presentation</option>
              <option>Workshop</option>
              <option>Meeting</option>
              <option>Lecture</option>
            </select>,
          )}
          {field(
            'Facilities',
            <select>
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
        <b>{venues.length} venues</b>
        <label>
          Sort by{' '}
          <select>
            <option>Best fit</option>
            <option>Capacity</option>
            <option>Name</option>
          </select>
        </label>
      </div>
      <section className="recommendation-band">
        <div>
          <span className="eyebrow">RECOMMENDED FOR YOUR EVENT</span>
          <h2>Seminar Hall 2</h2>
          <p>Fits 72 attendees, includes a projector, and is available for your selected time.</p>
        </div>
        {button(
          'View recommendation',
          () => {
            setVenue('Seminar Hall 2');
            go('Venue Details');
          },
          'secondary',
          ArrowRight,
        )}
      </section>
      <div className="venue-list">{venues.map(venueRow)}</div>
      <div className="conflict-callout">
        <AlertCircle size={18} />
        <div>
          <b>Looking for a different time?</b>
          <span>
            Main Auditorium is booked on 21 Oct, 10:00–12:00. Available alternatives: 13:00–15:00 in
            Main Auditorium, or Seminar Hall 2 at your selected time.
          </span>
        </div>
        {button('See alternatives', () => setModal('alternatives'), 'secondary')}
      </div>
    </>
  );
  const createForm = () => (
    <>
      {heading('Create a booking', 'Enter your event details and confirm the venue.')}
      {role !== 'Faculty' && !isAdmin && !authorized && (
        <div className="notice error">
          <AlertCircle />
          Your role needs authorization before you can book a venue.{' '}
          {button('Request authorization', () => go('Authorization'), 'primary')}
        </div>
      )}
      <div className="form-layout">
        <section className="panel form-panel">
          <h2>Event details</h2>
          <div className="form-grid">
            {isAdmin && field('Booking for', <input placeholder="Name and college email" />)}
            {field(
              'Event title',
              <input id="eventTitle" placeholder="e.g. CSE Project Presentation" />,
            )}
            {field(
              'Event type',
              <select>
                <option>Presentation</option>
                <option>Workshop</option>
                <option>Meeting</option>
                <option>Club event</option>
              </select>,
            )}
            {field(
              'Purpose or description',
              <textarea rows="3" placeholder="Briefly describe the event" />,
            )}
            {field('Attendees', <input id="attendees" type="number" defaultValue="48" />)}
            {field(
              'Venue',
              <select value={venue} onChange={(e) => setVenue(e.target.value)}>
                {venues.map((v) => (
                  <option>{v.name}</option>
                ))}
              </select>,
            )}
            {field('Event date', <input id="eventDate" type="date" defaultValue="2026-10-28" />)}
            {field('Start time', <input id="startTime" type="time" defaultValue="10:00" />)}
            {field('End time', <input id="endTime" type="time" defaultValue="12:00" />)}
            {field(
              'Required facilities',
              <div className="checkboxes">
                <label>
                  <input type="checkbox" defaultChecked /> Projector
                </label>
                <label>
                  <input type="checkbox" /> Video conferencing
                </label>
              </div>,
            )}
          </div>
          <div className="form-footer">
            <span>
              <CheckCircle2 size={15} /> Required fields are marked by labels
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
              <b>{venue}</b>
              <span>{venues.find((v) => v.name === venue)?.building}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>28 Oct 2026</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>10:00 – 12:00</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>{venues.find((v) => v.name === venue)?.capacity} people</dd>
            </div>
            <div>
              <dt>Facilities</dt>
              <dd>Projector, Whiteboard</dd>
            </div>
          </dl>
          {role !== 'Faculty' && !isAdmin && (
            <p className="summary-note">
              <AlertCircle size={15} />
              Bookings by {role}s require admin approval.
            </p>
          )}
        </aside>
      </div>
    </>
  );
  const details = () => {
    const v = venues.find((x) => x.name === venue) || venues[1];
    return (
      <>
        {heading(
          'Venue details',
          'Review facilities and availability before booking.',
          button('Back to search', () => go('Find a Venue')),
        )}
        <div className="detail-layout">
          <div>
            <img
              className="detail-photo"
              src={`https://images.unsplash.com/${v.img}?auto=format&fit=crop&w=1200&q=85`}
              alt={`${v.name} interior`}
            />
            <section className="panel detail-copy">
              <span className="eyebrow">VENUE · {v.building}</span>
              <h2>{v.name}</h2>
              <p>
                A flexible campus venue equipped for focused academic sessions, presentations, and
                collaborative events.
              </p>
              <div className="detail-facts">
                <span>
                  <Users />
                  {v.capacity} people
                </span>
                {v.facilities.map((f) => (
                  <span key={f}>
                    <Check />
                    {f}
                  </span>
                ))}
              </div>
              <h3>Suitable for</h3>
              <p>Presentations · Workshops · Department meetings · Student events</p>
            </section>
          </div>
          <aside className="panel availability">
            <h2>Availability</h2>
            <div className="month-head">
              <button className="icon-button" onClick={() => setMonth(month - 1)}>
                <ChevronLeft />
              </button>
              <b>{['October', 'November', 'December'][((month % 3) + 3) % 3]} 2026</b>
              <button className="icon-button" onClick={() => setMonth(month + 1)}>
                <ChevronRight />
              </button>
            </div>
            <div className="mini-calendar">
              {[
                'M',
                'T',
                'W',
                'T',
                'F',
                'S',
                'S',
                ...Array.from({ length: 35 }, (_, i) => (i < 31 ? `${i + 1}` : '')),
              ].map((n, i) => (
                <span
                  key={i}
                  className={`${i === 17 ? 'selected-day' : ''} ${[6, 13, 20, 27].includes(i - 7) ? 'busy-day' : ''}`}
                >
                  {n}
                </span>
              ))}
            </div>
            <div className="legend">
              <span>
                <i className="available-dot" />
                Available
              </span>
              <span>
                <i className="busy-dot" />
                Unavailable
              </span>
            </div>
            <h3>21 October · Available times</h3>
            <button className="slot selected-slot">
              10:00 – 12:00 <Check size={15} />
            </button>
            <button className="slot">13:00 – 15:00</button>
            <button className="slot unavailable-slot" onClick={() => setModal('alternatives')}>
              15:00 – 17:00 · Booked
            </button>
            {button('Book this venue', () => go('Create Booking'), 'primary')}
          </aside>
        </div>
      </>
    );
  };
  const bookingsPage = () => (
    <>
      {heading(
        'My bookings',
        'Track requests and manage your venue reservations.',
        button('Book a venue', () => go('Find a Venue'), 'primary', Plus),
      )}
      <div className="toolbar">
        <div className="tabs">
          {['All', 'Upcoming', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((t) => (
            <button
              className={filter === t ? 'active' : ''}
              onClick={() => setFilter(t === 'Upcoming' ? 'All' : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="toolbar-filters">
          <div className="input-icon">
            <Search size={16} />
            <input
              placeholder="Search bookings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <input type="date" aria-label="Filter by date" />
        </div>
      </div>
      {table(filteredBookings)}
      {selected && (
        <div className="detail-inline">
          <button className="close-inline" onClick={() => setSelected(null)}>
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
          {selected.status === 'Confirmed' &&
            button('Cancel booking', () => setModal('cancel'), 'text danger', Ban)}
        </div>
      )}
    </>
  );
  const authPage = () => (
    <>
      {heading(
        isAdmin ? 'Authorization requests' : 'Role authorization',
        isAdmin
          ? 'Review role access requests. This is separate from booking approval.'
          : 'CRs and Club Heads need an approved role authorization before booking.',
      )}
      {isAdmin ? (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Requests requiring review</h2>
              <p>Authorization grants booking access; each booking still needs approval.</p>
            </div>
          </div>
          {[
            'Arjun Mehta · Club Head · Coding Club',
            'Nisha Rao · Class Representative · CSE 3rd Year',
            'Kabir Das · Club Head · Robotics Club',
          ].map((n, i) => (
            <div className="auth-request">
              <div>
                <b>{n.split(' · ')[0]}</b>
                <span>
                  {n.split(' · ').slice(1).join(' · ')} · Submitted {17 - i} Oct 2026
                </span>
              </div>
              <div className="row-actions">
                {button(
                  'Review',
                  () => {
                    setSelected({
                      requester: n.split(' · ')[0],
                      role: n.split(' · ')[1],
                      club: n.split(' · ')[2],
                    });
                    setModal('authorization');
                  },
                  'secondary',
                )}
                {button(
                  'Approve',
                  () => notify(`Authorization approved for ${n.split(' · ')[0]}`),
                  'text',
                )}
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
              <p>
                Authorized as {role === 'Faculty' ? 'Class Representative' : role} · Submitted 12
                Oct 2026
              </p>
            </div>
            {status('Approved')}
          </div>
          <div className="notice">
            Your authorization is approved. Every booking request still requires admin approval.
          </div>
          {field('Authorized class or club', <input defaultValue="CSE Coding Club" />)}
          {field(
            'Supporting information',
            <textarea rows="3" defaultValue="Student club lead for the 2026–27 academic year." />,
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
                  : 'Request submitted 18 Oct 2026 · Awaiting admin review'}
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
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option>Class Representative</option>
                    <option>Club Head</option>
                  </select>,
                )}
                {field('Class or club', <input placeholder="e.g. CSE 3rd Year / Coding Club" />)}
                {field(
                  'Academic year',
                  <select>
                    <option>2026–27</option>
                    <option>2025–26</option>
                  </select>,
                )}
                {field(
                  'Supporting information',
                  <textarea
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
        'Operations at a glance for Sunday, 18 October 2026.',
        button('Create booking', () => go('Create Booking'), 'primary', Plus),
      )}
      <div className="admin-kpis">
        <div>
          <span>Total venues</span>
          <b>18</b>
          <small>16 active · 2 inactive</small>
        </div>
        <div>
          <span>Today’s bookings</span>
          <b>6</b>
          <small>Across 5 venues</small>
        </div>
        <div>
          <span>Booking requests</span>
          <b>{bookings.filter((b) => b.status === 'Pending').length}</b>
          <small>Require your review</small>
        </div>
        <div>
          <span>Authorization requests</span>
          <b>3</b>
          <small>Require your review</small>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel wide">
          <div className="section-head">
            <div>
              <h2>Booking requests</h2>
              <p>Only CR and Club Head requests need approval</p>
            </div>
            {button('View queue', () => go('Booking Requests'), 'text')}
          </div>
          {table(
            bookings.filter((b) => b.status === 'Pending'),
            true,
          )}
        </section>
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Authorization requests</h2>
              <p>Separate from booking approvals</p>
            </div>
            {button('View all', () => go('Authorization Requests'), 'text')}
          </div>
          {[
            'Arjun Mehta · Coding Club',
            'Nisha Rao · CSE 3rd Year',
            'Kabir Das · Robotics Club',
          ].map((n, i) => (
            <div className="auth-request">
              <div>
                <b>{n.split(' · ')[0]}</b>
                <span>
                  {n.split(' · ')[1]} · {i === 1 ? 'Class Representative' : 'Club Head'}
                </span>
              </div>
              <div>{button('Review', () => setModal('authorization'), 'secondary')}</div>
            </div>
          ))}
        </section>
        <section className="panel schedule">
          <div className="section-head">
            <div>
              <h2>Today’s schedule</h2>
              <p>18 October · All venues</p>
            </div>
            {button('Calendar', () => go('Booking Calendar'), 'text')}
          </div>
          {[
            ['09:00', 'Faculty orientation', 'Main Auditorium'],
            ['11:30', 'Research committee', 'Conference Room A'],
            ['14:00', 'Lab induction', 'Computer Lab 1'],
          ].map((x) => (
            <div className="schedule-row">
              <b>{x[0]}</b>
              <span>{x[1]}</span>
              <small>{x[2]}</small>
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
            placeholder="Search venues"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select>
          <option>All capacities</option>
          <option>Under 50</option>
          <option>50–100</option>
          <option>100+</option>
        </select>
        <select>
          <option>All facilities</option>
          <option>Projector</option>
          <option>Accessible</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {['Venue', 'Location', 'Capacity', 'Facilities', 'Status', 'Actions'].map((x) => (
                <th>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues
              .filter((v) => v.name.toLowerCase().includes(query.toLowerCase()))
              .map((v) => (
                <tr>
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
    </>
  );
  const calendarPage = () => (
    <>
      {heading(
        'Booking calendar',
        'Review venue schedules and identify busy periods.',
        button('Today', () => notify('Showing 18 October 2026')),
      )}
      <div className="calendar-toolbar">
        <div className="month-head">
          <button className="icon-button" onClick={() => setMonth(month - 1)}>
            <ChevronLeft />
          </button>
          <b>{['October', 'November', 'December'][((month % 3) + 3) % 3]} 2026</b>
          <button className="icon-button" onClick={() => setMonth(month + 1)}>
            <ChevronRight />
          </button>
        </div>
        <div className="tabs">
          {['Day', 'Week', 'Month'].map((t, i) => (
            <button className={i === 1 ? 'active' : ''}>{t}</button>
          ))}
        </div>
        <select>
          <option>All venues</option>
          {venues.map((v) => (
            <option>{v.name}</option>
          ))}
        </select>
      </div>
      <div className="calendar-week">
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
          ].map((t) => (
            <span>{t}</span>
          ))}
        </div>
        {['Mon 19', 'Tue 20', 'Wed 21', 'Thu 22', 'Fri 23', 'Sat 24', 'Sun 25'].map((day, i) => (
          <div className="day-col">
            <b>{day}</b>
            <div className="day-slots">
              {i === 2 && (
                <div className="calendar-event" style={{ top: '20%', height: '19%' }}>
                  <b>CSE Project Presentation</b>
                  <span>Seminar Hall 2 · 10:00</span>
                </div>
              )}
              {i === 4 && (
                <div
                  className="calendar-event secondary-event"
                  style={{ top: '60%', height: '18%' }}
                >
                  <b>Web Development Workshop</b>
                  <span>Computer Lab 1 · 14:00</span>
                </div>
              )}
              {i === 6 && (
                <div
                  className="calendar-event secondary-event"
                  style={{ top: '35%', height: '14%' }}
                >
                  <b>Coding Club Meetup</b>
                  <span>Conference Room A · 11:00</span>
                </div>
              )}
            </div>
          </div>
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
          <input type="date" defaultValue="2026-10-01" />
          <span>to</span>
          <input type="date" defaultValue="2026-10-31" />
        </div>,
      )}
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <h2>Booking volume</h2>
              <p>Confirmed and approved bookings · October 2026</p>
            </div>
          </div>
          <div className="bar-chart">
            {[12, 19, 15, 27, 22, 32, 26, 36, 28, 40, 33, 48].map((n, i) => (
              <div>
                <span style={{ height: `${n * 2}px` }}></span>
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
          {[
            ['Main Auditorium', 68],
            ['Seminar Hall 2', 56],
            ['Computer Lab 1', 42],
            ['Conference Room A', 31],
          ].map(([name, n]) => (
            <div className="util-row">
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
          <div className="rank-list">
            {[
              ['Seminar Hall 2', '34 bookings'],
              ['Computer Lab 1', '28 bookings'],
              ['Main Auditorium', '21 bookings'],
              ['Classroom C-204', '17 bookings'],
            ].map((x, i) => (
              <div>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <span>{x[0]}</span>
                <small>{x[1]}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Booking status</h2>
          <div className="status-breakdown">
            {[
              ['Confirmed', 18],
              ['Approved', 24],
              ['Pending', 7],
              ['Rejected', 4],
            ].map(([n, v]) => (
              <div>
                {status(n)}
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
  // Authentication screens and main route selection.
  const login = () => (
    <div className="login-screen">
      <div className={`login-card ${authView === 'signup' ? 'signup-card' : ''}`}>
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">B</span>
          <span>
            Book a Room<small>Venue booking system</small>
          </span>
        </a>
        {page === 'Access Pending' ? (
          <section className="access-pending" aria-live="polite">
            <span className="eyebrow">ACCOUNT ACCESS</span>
            <h1>
              {accessReviewStatus === 'rejected'
                ? 'Profile approval required'
                : 'Your profile is awaiting approval'}
            </h1>
            <p>
              {accessReviewStatus === 'rejected'
                ? 'Your role request was not approved. Contact your college administrator for details before trying again.'
                : `Your ${role} profile must be approved by a college administrator before you can access Book a Room.`}
            </p>
            <div className="access-review-status">
              <span>Status</span>
              <b>{accessReviewStatus === 'rejected' ? 'Rejected' : 'Pending review'}</b>
            </div>
            <button
              className="button primary full"
              onClick={() => {
                setLoginPassword('');
                setLoginError('');
                go('Sign in');
              }}
            >
              Back to sign in
            </button>
          </section>
        ) : (
          <>
            {!recovering && !(authView === 'signup' && signupStep === 'otp') && (
              <div className="auth-tabs" role="tablist" aria-label="Account access">
                <button
                  role="tab"
                  aria-selected={authView === 'signin'}
                  className={authView === 'signin' ? 'active' : ''}
                  onClick={() => {
                    setAuthView('signin');
                    setLoginError('');
                  }}
                >
                  Sign in
                </button>
                <button
                  role="tab"
                  aria-selected={authView === 'signup'}
                  className={authView === 'signup' ? 'active' : ''}
                  onClick={() => {
                    setAuthView('signup');
                    setSignupStep('details');
                    setLoginError('');
                  }}
                >
                  Sign up
                </button>
              </div>
            )}
            {recovering ? (
              <>
                <h1>Reset your password</h1>
                <p>
                  Enter your college email and we’ll send reset instructions if an account exists.
                </p>
                {field(
                  'College email',
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {recoverySent && (
                  <div className="login-success" role="status">
                    <CheckCircle2 size={15} />
                    If an account exists, reset instructions will be sent to this email.
                  </div>
                )}
                {button(
                  recoverySent ? 'Send again' : 'Send reset instructions',
                  () => {
                    if (!/.+@.+\..+/.test(loginEmail)) {
                      setLoginError('Enter a valid college email address.');
                      return;
                    }
                    setLoginError('');
                    setRecoverySent(true);
                  },
                  'primary full',
                )}
                <button
                  className="back-to-login"
                  onClick={() => {
                    setRecovering(false);
                    setRecoverySent(false);
                    setLoginError('');
                  }}
                >
                  Back to sign in
                </button>
              </>
            ) : authView === 'signup' && signupStep === 'otp' ? (
              <>
                <h1>Verify your college email</h1>
                <p>
                  Enter the six-digit code we sent to <strong>{loginEmail}</strong>. The code
                  expires in 10 minutes.
                </p>
                {field(
                  'Email verification code',
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="6"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {button(
                  signupBusy ? 'Verifying…' : 'Verify email',
                  verifyRegistrationOtp,
                  'primary full',
                )}
                <div className="otp-actions">
                  <button
                    className="text-button"
                    disabled={signupBusy || resendWait > 0}
                    onClick={resendRegistrationOtp}
                  >
                    {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
                  </button>
                  <button className="text-button" onClick={cancelRegistration}>
                    Change details
                  </button>
                </div>
              </>
            ) : recovering ? null : authView === 'signup' ? (
              <>
                <h1>Create your account</h1>
                <p>Register with your college email to book campus venues.</p>
                {field(
                  'Full name',
                  <input
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(e) => {
                      setSignupName(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'College email',
                  <input
                    name="registrationEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'College role',
                  <select value={signupRole} onChange={(e) => setSignupRole(e.target.value)}>
                    <option>Faculty</option>
                    <option>Class Representative</option>
                    <option>Club Head</option>
                  </select>,
                )}
                {field(
                  'Password',
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'Confirm password',
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={signupConfirm}
                    onChange={(e) => {
                      setSignupConfirm(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {button(
                  signupBusy ? 'Sending code…' : 'Send verification code',
                  startRegistration,
                  'primary full',
                )}
                <small className="login-foot">
                  CR and Club Head accounts need role authorization before booking.
                </small>
              </>
            ) : (
              <>
                <h1>Sign in to your account</h1>
                <p>Use your college account to continue.</p>
                {field(
                  'College email',
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'Password',
                  <div className="password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                    />
                    <button onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                <div className="login-options">
                  <label>
                    <input type="checkbox" /> Remember me
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      setRecovering(true);
                      setLoginError('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                {button(loginLoading ? 'Signing in…' : 'Sign in', signIn, 'primary full')}
                <small className="login-foot">
                  Need access? Contact your college administrator.
                </small>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
  // Render the active screen. Keep route selection in one place for easier navigation changes.
  const renderPage = () => {
    switch (page) {
      case 'Overview':
        return isAdmin ? adminOverview() : dashboard();
      case 'Find a Venue':
        return findVenue();
      case 'Venue Details':
        return details();
      case 'Create Booking':
        return createForm();
      case 'My Bookings':
      case 'Booking Requests':
        return bookingsPage();
      case 'Authorization':
      case 'Authorization Requests':
        return authPage();
      case 'Venue Management':
        return venueAdmin();
      case 'Booking Calendar':
        return calendarPage();
      case 'Analytics':
        return analytics();
      case 'Notifications':
        return (
          <>
            {heading('Notifications', 'Booking changes and decisions for your reservations.')}
            <section className="panel notification-panel">
              <div className="notification-panel-head">
                <div>
                  <h2>Recent activity</h2>
                  <p>Updates are ordered by the latest change.</p>
                </div>
                <span>{bookings.length} updates</span>
              </div>
              {bookings.length > 0 ? (
                <div className="notification-list">
                  {[...bookings]
                    .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
                    .map((booking) => (
                      <article className="notification-row" key={booking.id}>
                        <button
                          className="notification-main"
                          aria-label={`Open details for ${booking.event}`}
                          onClick={() => {
                            setPage('My Bookings');
                            setSelected(booking);
                            setMobileOpen(false);
                          }}
                        >
                          <span className="notification-copy">
                            <strong>{booking.event}</strong>
                            <span>
                              {booking.venue} · {formatEventDate(booking.date)} · {booking.time}
                            </span>
                            {booking.reason && (
                              <span className="notification-reason">
                                Rejection reason: {booking.reason}
                              </span>
                            )}
                          </span>
                          <ArrowRight size={17} aria-hidden="true" />
                        </button>
                        <div className="notification-meta">
                          <span className="notification-time">
                            Updated {formatActivityTime(booking.updatedAt)}
                          </span>
                          {status(booking.status)}
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <div className="notification-empty">
                  <b>No booking updates yet</b>
                  <span>Updates will appear here when a booking request changes.</span>
                </div>
              )}
            </section>
          </>
        );
      case 'Profile':
        return (
          <>
            {heading('Profile', 'Your college account details.')}
            <section className="panel auth-panel">
              {field('Full name', <input defaultValue="Prachi Sharma" />)}
              {field('College email', <input defaultValue="prachi.sharma@college.edu" />)}
              {field('Role', <input value={role} readOnly />)}
              {button('Save changes', () => notify('Profile updated'), 'primary')}
            </section>
          </>
        );
      default:
        return dashboard();
    }
  };

  const content = renderPage();
  return (
    <>
      {page === 'Sign in' || page === 'Access Pending' ? (
        login()
      ) : (
        <div className="app-shell">
          <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${sidebarHidden ? 'hidden' : ''}`}>
            <div className="brand">
              <span className="brand-mark">B</span>
              <span className="brand-copy">
                Book a Room<small>VENUE BOOKING</small>
              </span>
              <button
                className="mobile-close"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </button>
            </div>
            <div className="nav-label">WORKSPACE</div>
            <nav>
              {nav.map(([name, iconName]) => (
                <button
                  key={name}
                  className={`nav-item ${page === name ? 'active' : ''}`}
                  aria-label={name}
                  onClick={() => go(name)}
                >
                  <span className="material-symbols-outlined nav-icon" aria-hidden="true">
                    {iconName}
                  </span>
                  <span>{name}</span>
                  {name === 'Booking Requests' && isAdmin && <i className="nav-count">1</i>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button className="nav-item" aria-label="Sign out" onClick={() => go('Sign in')}>
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
              <div className="profile-mini">
                <div className="avatar">PS</div>
                <div>
                  <b>Prachi Sharma</b>
                  <span>{role}</span>
                </div>
              </div>
            </div>
          </aside>
          {mobileOpen && (
            <button
              className="sidebar-overlay"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div className={`workspace ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
            <header className="topbar">
              <button
                className="nav-toggle"
                aria-label="Toggle navigation"
                aria-expanded={
                  window.matchMedia('(max-width: 720px)').matches ? mobileOpen : !sidebarHidden
                }
                title={
                  window.matchMedia('(max-width: 720px)').matches
                    ? 'Open navigation'
                    : 'Toggle navigation'
                }
                onClick={() => {
                  if (window.matchMedia('(max-width: 720px)').matches) {
                    setSidebarHidden(false);
                    setMobileOpen(true);
                  } else {
                    setSidebarHidden((hidden) => !hidden);
                    setProfileOpen(false);
                  }
                }}
              >
                <Menu />
              </button>
              <div className="top-actions">
                <button className="icon-button notify" onClick={() => go('Notifications')}>
                  <Bell size={18} />
                  <i />
                </button>
                <div className="top-profile">
                  <div className="avatar">PS</div>
                  <span>Prachi Sharma</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </header>
            <main className="main-content">{content}</main>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal('')}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal('')}>
              <X />
            </button>
            {modal === 'reject' ? (
              <>
                <h2>Reject booking request</h2>
                <p>Provide a reason so the requester understands the decision.</p>
                <label className="field">
                  <span>Reason for rejection</span>
                  <textarea
                    rows="4"
                    placeholder="e.g. Venue is reserved for examinations on this date."
                  />
                </label>
                <div className="modal-actions">
                  {button('Cancel', () => setModal(''))}
                  {button(
                    'Reject request',
                    () => decision(selected.id, 'Rejected'),
                    'danger-button',
                  )}
                </div>
              </>
            ) : modal === 'cancel' ? (
              <>
                <h2>Cancel this booking?</h2>
                <p>This will release the venue for other campus users.</p>
                <div className="modal-actions">
                  {button('Keep booking', () => setModal(''))}
                  {button(
                    'Cancel booking',
                    () => {
                      decision(selected.id, 'Cancelled');
                    },
                    'danger-button',
                  )}
                </div>
              </>
            ) : modal === 'alternatives' ? (
              <>
                <h2>Choose an alternative</h2>
                <p>Main Auditorium is unavailable on 21 October, 10:00–12:00.</p>
                <div className="alternative-row">
                  <b>21 Oct · 13:00–15:00</b>
                  <span>Main Auditorium · Available</span>
                  {button(
                    'Select time',
                    () => {
                      setVenue('Main Auditorium');
                      setModal('');
                      go('Create Booking');
                    },
                    'primary',
                  )}
                </div>
                <div className="alternative-row">
                  <b>21 Oct · 10:00–12:00</b>
                  <span>Seminar Hall 2 · Fits 100 people</span>
                  {button(
                    'Select venue',
                    () => {
                      setVenue('Seminar Hall 2');
                      setModal('');
                      go('Create Booking');
                    },
                    'primary',
                  )}
                </div>
              </>
            ) : modal === 'authorization' ? (
              <>
                <h2>Authorization request</h2>
                <p>Arjun Mehta · Coding Club Head</p>
                <div className="notice">
                  Submitted 17 Oct 2026. Supports the 2026–27 club leadership roster.
                </div>
                <div className="modal-actions">
                  {button(
                    'Reject',
                    () => {
                      setModal('');
                      notify('Authorization request rejected');
                    },
                    'danger-button',
                  )}
                  {button(
                    'Approve authorization',
                    () => {
                      setModal('');
                      notify('Authorization approved');
                    },
                    'primary',
                  )}
                </div>
              </>
            ) : (
              <>
                <h2>
                  {modal === 'deactivate'
                    ? 'Deactivate venue?'
                    : modal === 'edit-venue'
                      ? 'Edit venue'
                      : 'Add venue'}
                </h2>
                <p>
                  {modal === 'deactivate'
                    ? `New bookings will no longer be accepted for ${venue}.`
                    : 'Keep venue information accurate for campus users.'}
                </p>
                {modal !== 'deactivate' && (
                  <div className="form-grid">
                    {field(
                      'Venue name',
                      <input
                        defaultValue={modal === 'edit-venue' ? venue : ''}
                        placeholder="Venue name"
                      />,
                    )}
                    {field('Location', <input placeholder="Building and floor" />)}
                    {field('Capacity', <input type="number" placeholder="Maximum attendees" />)}
                    {field('Facilities', <input placeholder="Projector, whiteboard" />)}
                    {field('Description', <textarea rows="2" placeholder="Venue description" />)}
                  </div>
                )}
                <div className="modal-actions">
                  {button('Cancel', () => setModal(''))}
                  {button(
                    modal === 'deactivate' ? 'Deactivate venue' : 'Save venue',
                    () => {
                      setModal('');
                      notify(modal === 'deactivate' ? 'Venue deactivated' : 'Venue saved');
                    },
                    modal === 'deactivate' ? 'danger-button' : 'primary',
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
