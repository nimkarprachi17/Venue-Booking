import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// Helpers for dates/times and for mapping API bookings to the shape the screens already use.
const toISODate = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const minutesOf = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};
const weekDays = (offset = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
};
const normalizeBooking = (b) => ({
  id: b.bookingId,
  event: b.event,
  venue: b.venue,
  date: b.date,
  time: `${b.startTime} – ${b.endTime}`,
  requested: new Date(b.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  status: b.status,
  reason: b.rejectionReason,
  requester: b.bookedFor || b.requestedBy?.name || 'Unknown',
  role: b.requestedBy?.role || '',
  attendees: b.attendees,
  updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
});
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
// Venue inventory shown in search, recommendations, details, and administration.
const venues = [
  {
    name: 'Main auditorium',
    building: 'Auditorium',
    capacity: 500,
    facilities: ['Projector', 'PA system', 'Stage', 'Accessible'],
    img: 'photo-1475721027785-f74eccf877e2',
  },
  {
    name: 'Mini auditorium',
    building: 'Auditorium',
    capacity: 150,
    facilities: ['Projector', 'PA system', 'Stage'],
    img: 'photo-1517457373958-b7a2e6b815ab',
  },
  {
    name: 'Cognizant Lab',
    building: 'Computer laboratory',
    capacity: 60,
    facilities: ['Workstations', 'Projector', 'Wi-Fi'],
    img: 'photo-1581092921461-eab62e97a780',
  },
  {
    name: 'New Cse NC28',
    building: 'CSE · NC28',
    capacity: 80,
    facilities: ['Projector', 'Whiteboard', 'Wi-Fi'],
    img: 'photo-1497366754035-f200968a6e72',
  },
  {
    name: 'Academic Complex NC04',
    building: 'Academic Complex · NC04',
    capacity: 100,
    facilities: ['Projector', 'Whiteboard', 'Wi-Fi'],
    img: 'photo-1497366216548-37526070297c',
  },
  {
    name: 'Seminar Hall 2',
    building: 'Seminar hall',
    capacity: 120,
    facilities: ['Projector', 'Microphone', 'Podium', 'Air conditioning'],
    img: 'photo-1517457373958-b7a2e6b815ab',
  },
  {
    name: 'Electronic Extension Building',
    building: 'Electronic Extension Building',
    capacity: 100,
    facilities: ['Projector', 'Microphone', 'Wi-Fi'],
    img: 'photo-1497366216548-37526070297c',
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
const navPublic = [['Find a Venue', 'search']];
const navAdmin = [
  ['Overview', 'space_dashboard'],
  ['Booking Requests', 'assignment'],
  ['Authorization Requests', 'verified_user'],
  ['Venue Management', 'meeting_room'],
  ['Booking Calendar', 'calendar_month'],
  ['Analytics', 'analytics'],
];
const pageRoutes = {
  Overview: '/dashboard',
  'Find a Venue': '/venues',
  'My Bookings': '/bookings',
  Authorization: '/authorization',
  Notifications: '/notifications',
  Profile: '/profile',
  'Booking Requests': '/admin/booking-requests',
  'Authorization Requests': '/admin/authorization-requests',
  'Venue Management': '/admin/venues',
  'Booking Calendar': '/admin/calendar',
  Analytics: '/admin/analytics',
  'Create Booking': '/bookings/new',
  'Sign in': '/login',
  'Sign up': '/register',
  'Forgot password': '/forgot-password',
  'Access Pending': '/access-pending',
};
const publicPages = new Set([
  'Sign in',
  'Sign up',
  'Forgot password',
  'Access Pending',
  'Find a Venue',
  'Venue Details',
]);
const getPageFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'Overview';
  if (path.startsWith('/venues/')) return getVenueFromPath(path) ? 'Venue Details' : 'Not Found';
  if (path.startsWith('/admin/booking-requests/')) return 'Booking Requests';
  if (path.startsWith('/bookings/') && path !== '/bookings/new') return 'My Bookings';
  return Object.entries(pageRoutes).find(([, route]) => route === path)?.[0] || 'Not Found';
};
const getVenueFromPath = (pathname) => {
  const slug = pathname.match(/^\/venues\/([^/]+)\/?$/)?.[1];
  if (!slug) return null;
  let venueSlug;
  try {
    venueSlug = decodeURIComponent(slug);
  } catch {
    return null;
  }
  return (
    venues.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === venueSlug)
      ?.name ?? null
  );
};
const getBookingIdFromPath = (pathname) => {
  const match = pathname.match(/^\/(?:admin\/booking-requests|bookings)\/([^/]+)\/?$/);
  return match && match[1] !== 'new' ? decodeURIComponent(match[1]) : null;
};
function App() {
  // Current page and signed-in user's role.
  const [role, setRole] = useState('Faculty');
  const [page, setPage] = useState(() => getPageFromPath(window.location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Booking and venue workspace state.
  const [bookings, setBookings] = useState([]);
  const [previewBookingRequests, setPreviewBookingRequests] = useState(() => {
    const requested = new Date();
    const submitted = requested.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const withDaysFromNow = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return toISODate(date);
    };
    return [
      {
        id: 'preview-request-cse-presentation',
        requester: 'Riya Kulkarni',
        role: 'CR',
        event: 'CSE Project Presentation',
        venue: 'Seminar Hall 2',
        date: withDaysFromNow(2),
        time: '10:00 – 12:00',
        attendees: 82,
        requested: submitted,
        status: 'Pending',
      },
      {
        id: 'preview-request-web-workshop',
        requester: 'Aarav Patil',
        role: 'Club Head',
        event: 'Web Development Workshop',
        venue: 'Cognizant Lab',
        date: withDaysFromNow(3),
        time: '14:00 – 16:00',
        attendees: 48,
        requested: submitted,
        status: 'Pending',
      },
      {
        id: 'preview-request-electronics-showcase',
        requester: 'Ananya Shah',
        role: 'CR',
        event: 'Electronics Design Showcase',
        venue: 'Electronic Extension Building',
        date: withDaysFromNow(5),
        time: '11:00 – 13:00',
        attendees: 70,
        requested: submitted,
        status: 'Pending',
      },
    ];
  });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [venue, setVenue] = useState(() => getVenueFromPath(window.location.pathname) || 'Seminar Hall 2');
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  });
  const [bookingStartTime, setBookingStartTime] = useState('10:00');
  const [bookingEndTime, setBookingEndTime] = useState('12:00');
  const [bookingAttendees, setBookingAttendees] = useState('48');
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

  // JWT session and admin approval state.
  const [accessToken, setAccessToken] = useState('');
  const tokenRef = useRef('');
  const [sessionReady, setSessionReady] = useState(false);
  const [authRequests, setAuthRequests] = useState([]);
  const [pendingAuthRequestCount, setPendingAuthRequestCount] = useState(null);
  const [previewAuthRequests, setPreviewAuthRequests] = useState(() => {
    const createdAt = new Date().toISOString();
    return [
      {
        _id: 'preview-auth-request-cr-cse',
        user: { name: 'Meera Joshi', email: 'meera.joshi@college.edu' },
        type: 'Class Representative',
        details: {
          name: 'CSE · Third Year',
          department: 'Computer Engineering',
          note: 'Elected class representative for the 2026–27 academic year.',
        },
        status: 'pending',
        createdAt,
      },
      {
        _id: 'preview-auth-request-club',
        user: { name: 'Kabir Deshmukh', email: 'kabir.deshmukh@college.edu' },
        type: 'Club Head',
        details: {
          name: 'Coding Club',
          department: 'Computer Engineering',
          note: 'Club coordinator requesting venue booking access for student events.',
        },
        status: 'pending',
        createdAt,
      },
      {
        _id: 'preview-auth-request-cr-electronics',
        user: { name: 'Sana Kulkarni', email: 'sana.kulkarni@college.edu' },
        type: 'Class Representative',
        details: {
          name: 'Electronics · Second Year',
          department: 'Electronics Engineering',
          note: 'Class representative for department seminars and student sessions.',
        },
        status: 'pending',
        createdAt,
      },
    ];
  });
  const [authFilter, setAuthFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  // Signed-in user's profile, plus calendar controls.
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', role: '' });
  const [profileDraft, setProfileDraft] = useState(null);
  const [calendarVenue, setCalendarVenue] = useState('All venues');
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarSelection, setCalendarSelection] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = role === 'Admin';
  const isSignedIn = Boolean(accessToken);
  const nav = isAdmin ? navAdmin : isSignedIn ? navUser : navPublic;
  const displayName = currentUser.name || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  function go(p, options = {}) {
    if (!tokenRef.current && !publicPages.has(p)) p = 'Sign in';
    const path =
      p === 'Venue Details'
        ? `/venues/${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        : pageRoutes[p] || '/dashboard';
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setPage(p);
    if (p === 'Sign in') {
      setAuthView('signin');
      setRecovering(false);
    } else if (p === 'Sign up') {
      setAuthView('signup');
      setSignupStep('details');
      setRecovering(false);
    } else if (p === 'Forgot password') {
      setAuthView('signin');
      setRecovering(true);
    }
    setMobileOpen(false);
    setSelected(null);
  }
  function openBooking(booking) {
    const detailPath = isAdmin
      ? `/admin/booking-requests/${encodeURIComponent(booking.id)}`
      : `/bookings/${encodeURIComponent(booking.id)}`;
    if (window.location.pathname !== detailPath) {
      window.history.pushState({}, '', detailPath);
    }
    setPage(isAdmin ? 'Booking Requests' : 'My Bookings');
    setSelected(booking);
    setMobileOpen(false);
  }
  function closeBookingDetails() {
    const listPath = isAdmin ? pageRoutes['Booking Requests'] : pageRoutes['My Bookings'];
    window.history.replaceState({}, '', listPath);
    setSelected(null);
  }
  const notify = (s) => {
    setToast(s);
    setTimeout(() => setToast(''), 3000);
  };
  const apiBase =
    import.meta.env.VITE_API_URL !== undefined
      ? import.meta.env.VITE_API_URL
      : import.meta.env.DEV
        ? 'http://localhost:5000'
        : '';

  // JWT session: the access token lives in React state (mirrored in a ref so async code
  // always sees the latest value). The refresh token lives in an httpOnly cookie that the
  // browser sends automatically because every auth request uses credentials: 'include'.
  function saveToken(token) {
    tokenRef.current = token;
    setAccessToken(token);
  }
  async function refreshSession() {
    try {
      const response = await fetch(`${apiBase}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return null;
      const data = await response.json();
      saveToken(data.accessToken);
      return data;
    } catch {
      return null;
    }
  }
  function signOut() {
    fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
      () => {},
    );
    saveToken('');
    setAuthRequests([]);
    setPendingAuthRequestCount(null);
    setBookings([]);
    setCurrentUser({ name: '', email: '', role: '' });
    setLoginPassword('');
    setLoginError('');
    go('Sign in');
  }
  // Authenticated request helper: attaches the access token and, on a 401, silently
  // refreshes the session once and retries before giving up.
  async function api(path, options = {}, retry = true) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
        ...options.headers,
      },
    });
    if (response.status === 401 && retry) {
      const refreshed = await refreshSession();
      if (refreshed) return api(path, options, false);
      signOut();
      throw new Error('Session expired. Please sign in again.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

  // Keep the rendered screen in sync with the browser URL and Back/Forward buttons.
  useEffect(() => {
    const handlePopState = () => {
      const nextPage = getPageFromPath(window.location.pathname);
      const bookingId = getBookingIdFromPath(window.location.pathname);
      if (nextPage === 'Not Found') {
        window.history.replaceState({}, '', '/dashboard');
        setPage('Overview');
      } else {
        setPage(nextPage);
        if (nextPage === 'Sign in') {
          setAuthView('signin');
          setRecovering(false);
        } else if (nextPage === 'Sign up') {
          setAuthView('signup');
          setSignupStep('details');
          setRecovering(false);
        } else if (nextPage === 'Forgot password') {
          setAuthView('signin');
          setRecovering(true);
        }
        if (nextPage === 'Venue Details') {
          setVenue(getVenueFromPath(window.location.pathname) || 'Seminar Hall 2');
        }
      }
      setSelected(bookingId ? bookings.find((item) => String(item.id) === bookingId) || null : null);
      setMobileOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [bookings]);

  useEffect(() => {
    const bookingId = getBookingIdFromPath(window.location.pathname);
    if (!bookingId) {
      setSelected(null);
      return;
    }
    const booking = bookings.find((item) => String(item.id) === bookingId);
    if (booking) setSelected(booking);
  }, [bookings]);

  // Restore the session on page load from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      const data = await refreshSession();
      if (!active) return;
      if (data?.user) {
        setRole(data.user.role);
        setCurrentUser(data.user);
        setAuthorized(true);
        const requestedPage = getPageFromPath(window.location.pathname);
        if (['Sign in', 'Sign up', 'Forgot password', 'Access Pending'].includes(requestedPage)) {
          go('Overview', { replace: true });
        } else if (requestedPage === 'Not Found') {
          go('Overview', { replace: true });
        } else if (
          data.user.role !== 'Admin' &&
          ['Booking Requests', 'Authorization Requests', 'Venue Management', 'Booking Calendar', 'Analytics'].includes(requestedPage)
        ) {
          go('Overview', { replace: true });
        } else {
          if (requestedPage === 'Venue Details') {
            setVenue(getVenueFromPath(window.location.pathname) || 'Seminar Hall 2');
          }
          setPage(requestedPage);
        }
      } else {
        const requestedPage = getPageFromPath(window.location.pathname);
        if (!publicPages.has(requestedPage)) {
          go('Sign in', { replace: true });
        } else {
          setPage(requestedPage);
          if (requestedPage === 'Sign up') setAuthView('signup');
          if (requestedPage === 'Forgot password') setRecovering(true);
        }
      }
      setSessionReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Protect application and administrator routes when the URL is entered directly.
  useEffect(() => {
    if (!sessionReady) return;
    const adminPages = [
      'Booking Requests',
      'Authorization Requests',
      'Venue Management',
      'Booking Calendar',
      'Analytics',
    ];
    if (!accessToken && !publicPages.has(page)) {
      go('Sign in', { replace: true });
    } else if (accessToken && ['Sign in', 'Sign up', 'Forgot password'].includes(page)) {
      go('Overview', { replace: true });
    } else if (accessToken && adminPages.includes(page) && !isAdmin) {
      go('Overview', { replace: true });
    }
  }, [accessToken, isAdmin, page, sessionReady]);

  // Admin: authorization requests (list, approve, reject).
  async function loadAuthRequests(reviewStatus) {
    try {
      const data = await api(`/api/admin/auth-requests?status=${reviewStatus}`);
      setAuthRequests(data.requests);
      if (reviewStatus === 'pending') {
        setPendingAuthRequestCount(data.requests.length);
      }
    } catch (error) {
      notify(error.message);
    }
  }
  async function reviewRequest(id, action, reason) {
    if (reviewBusy) return;
    if (String(id).startsWith('preview-auth-request-')) {
      setPreviewAuthRequests((current) =>
        current.map((request) =>
          request._id === id
            ? {
                ...request,
                status: action === 'approve' ? 'approved' : 'rejected',
                rejectionReason: action === 'reject' ? reason : '',
              }
            : request,
        ),
      );
      setModal('');
      setReviewing(null);
      setRejectReason('');
      notify(action === 'approve' ? 'Sample authorization approved' : 'Sample authorization rejected');
      return;
    }
    setReviewBusy(true);
    try {
      await api(`/api/admin/auth-requests/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      setModal('');
      setReviewing(null);
      setRejectReason('');
      notify(action === 'approve' ? 'Authorization approved' : 'Authorization rejected');
      await loadAuthRequests(page === 'Overview' ? 'pending' : authFilter);
    } catch (error) {
      notify(error.message);
    } finally {
      setReviewBusy(false);
    }
  }
  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    if (page === 'Overview') loadAuthRequests('pending');
    else if (page === 'Authorization Requests') loadAuthRequests(authFilter);
  }, [isAdmin, accessToken, page, authFilter]);

  // Bookings: admins receive every booking, other users receive their own.
  async function loadBookings() {
    try {
      const data = await api('/api/bookings');
      setBookings(data.bookings.map(normalizeBooking));
    } catch (error) {
      notify(error.message);
    }
  }
  useEffect(() => {
    if (!accessToken) return;
    const pages = [
      'Overview',
      'Find a Venue',
      'My Bookings',
      'Booking Requests',
      'Booking Calendar',
      'Analytics',
      'Notifications',
    ];
    if (pages.includes(page)) loadBookings();
  }, [accessToken, page]);

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
        credentials: 'include',
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
      saveToken(data.accessToken || '');
      setCurrentUser(data.user);
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
  const showSampleBookingRequests = isAdmin && !bookings.some((b) => b.status === 'Pending');
  const adminBookingRows = showSampleBookingRequests
    ? [...bookings, ...previewBookingRequests]
    : bookings;
  const filteredBookings = useMemo(
    () =>
      (isAdmin ? adminBookingRows : bookings).filter(
        (b) =>
          (filter === 'All' || b.status === filter) &&
          `${b.event} ${b.venue} ${b.requester}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [bookings, filter, isAdmin, adminBookingRows, query],
  );
  const createBooking = async () => {
    const pick = (name) => document.querySelector(`[name="${name}"]`);
    const title = document.getElementById('eventTitle')?.value.trim();
    const attendeeCount = Number(document.getElementById('attendees')?.value);
    const capacity = venues.find((v) => v.name === venue)?.capacity;
    if (!title) {
      notify('Enter an event title');
      return;
    }
    if (capacity && attendeeCount > capacity) {
      notify(`${venue} fits up to ${capacity} people`);
      return;
    }
    try {
      await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          event: title,
          eventType: pick('eventType')?.value,
          description: pick('eventDescription')?.value,
          venue,
          date: document.getElementById('eventDate')?.value,
          startTime: document.getElementById('startTime')?.value,
          endTime: document.getElementById('endTime')?.value,
          attendees: attendeeCount,
          facilities: [
            pick('facilityProjector')?.checked && 'Projector',
            pick('facilityVideoConferencing')?.checked && 'Video conferencing',
          ].filter(Boolean),
          bookedFor: pick('bookingFor')?.value,
        }),
      });
      notify(
        isAdmin
          ? 'Booking created successfully'
          : role === 'Faculty'
            ? 'Booking confirmed'
            : 'Request submitted for admin approval',
      );
      await loadBookings();
      go('My Bookings');
    } catch (error) {
      notify(error.message);
    }
  };
  const authorize = () => {
    setAuthorized(false);
    notify('Authorization request submitted');
  };
  const decision = async (id, status, reason) => {
    if (status === 'Rejected' && !reason?.trim()) {
      notify('Enter a rejection reason');
      return;
    }
    if (String(id).startsWith('preview-request-')) {
      setPreviewBookingRequests((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, status, reason: reason?.trim() || '' } : booking,
        ),
      );
      notify(`Sample booking ${status.toLowerCase()}`);
      setModal('');
      setSelected(null);
      return;
    }
    const action = { Approved: 'approve', Rejected: 'reject', Cancelled: 'cancel' }[status];
    try {
      await api(`/api/bookings/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason?.trim() }),
      });
      notify(`Booking ${status.toLowerCase()}`);
      setModal('');
      setSelected(null);
      await loadBookings();
    } catch (error) {
      notify(error.message);
    }
  };
  const saveProfile = async () => {
    const name = (profileDraft ?? currentUser.name).trim();
    if (name.length < 2) {
      notify('Enter your full name');
      return;
    }
    try {
      const data = await api('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      setCurrentUser(data.user);
      setProfileDraft(null);
      notify('Profile updated');
    } catch (error) {
      notify(error.message);
    }
  };
  // Values derived from the real bookings (admin overview, calendar and analytics).
  const today = toISODate(new Date());
  const monthKey = today.slice(0, 7);
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const pendingBookings = adminBookingRows.filter((b) => b.status === 'Pending').length;
  const todaysBookings = bookings
    .filter((b) => b.date === today && ['Confirmed', 'Approved'].includes(b.status))
    .sort((a, b) => a.time.localeCompare(b.time));
  const monthBookings = bookings.filter((b) => b.date.startsWith(monthKey));
  const liveBookings = monthBookings.filter((b) => ['Confirmed', 'Approved'].includes(b.status));
  const analyticsPreview = monthBookings.length === 0;
  const previewVolumeBars = [1, 2, 1, 3, 1, 2, 4, 2, 1, 4, 3, 7];
  const volumeBars = Array.from(
    { length: 12 },
    (_, i) =>
      analyticsPreview
        ? previewVolumeBars[i]
        : liveBookings.filter((b) => {
            const day = Number(b.date.slice(8));
            return i === 11 ? day >= 23 : day === 2 * i + 1 || day === 2 * i + 2;
          }).length,
  );
  const volumeMax = Math.max(...volumeBars, 0);
  const bookedHours = (list) =>
    list.reduce((sum, b) => {
      const [from, to] = b.time.split(' – ');
      return sum + (minutesOf(to) - minutesOf(from)) / 60;
    }, 0);
  // Utilization assumes 9 bookable hours per venue per day in the selected month.
  const venueUtilization = analyticsPreview
    ? [
        ['Main auditorium', 23],
        ['Mini auditorium', 19],
        ['Cognizant Lab', 14],
        ['New Cse NC28', 12],
        ['Academic Complex NC04', 10],
        ['Seminar Hall 2', 17],
        ['Electronic Extension Building', 8],
      ]
    : venues
        .map((v) => [
          v.name,
          Math.min(
            100,
            Math.round(
              (bookedHours(liveBookings.filter((b) => b.venue === v.name)) / (9 * monthDays)) * 100,
            ),
          ),
        ])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
  const mostBooked = analyticsPreview
    ? [
        ['Main auditorium', '10 bookings'],
        ['Mini auditorium', '9 bookings'],
        ['Cognizant Lab', '6 bookings'],
        ['New Cse NC28', '5 bookings'],
        ['Academic Complex NC04', '5 bookings'],
        ['Seminar Hall 2', '8 bookings'],
        ['Electronic Extension Building', '4 bookings'],
      ]
    : venues
        .map((v) => [v.name, liveBookings.filter((b) => b.venue === v.name).length])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => [name, `${count} bookings`]);
  const statusBreakdown = analyticsPreview
    ? [
        ['Confirmed', 21],
        ['Approved', 10],
        ['Pending', 4],
        ['Rejected', 3],
      ]
    : ['Confirmed', 'Approved', 'Pending', 'Rejected'].map((name) => [
        name,
        monthBookings.filter((b) => b.status === name).length,
      ]);
  // Shared presentational helpers used by multiple screens.
  const status = (s) => <span className={`status ${s.toLowerCase()}`}>{s}</span>;
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
    <>
    <div className={`table-wrap ${admin ? 'admin-booking-table-wrap' : 'user-booking-table-wrap'}`} role="region" aria-label={admin ? 'Booking request list' : 'My booking list'} tabIndex={0}>
      <table className={admin ? 'admin-booking-table' : 'user-booking-table'}>
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
            <tr
              key={b.id}
              onClick={() => openBooking(b)}
              className="click-row"
            >
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
                    {b.status === 'Pending' && (
                      <>
                        {button('Approve', () => decision(b.id, 'Approved'), 'text')}
                        {button(
                          'Reject',
                          () => {
                            setSelected(b);
                            setModal('reject');
                          },
                          'text danger',
                        )}
                      </>
                    )}
                    {['Confirmed', 'Approved'].includes(b.status) &&
                      button(
                        'Cancel',
                        () => {
                          setSelected(b);
                          setModal('cancel');
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
    <div className={`booking-cards ${admin ? 'admin-booking-cards' : 'user-booking-cards'}`}>
      {rows.length === 0 ? (
        <div className="empty booking-card-empty">
          <CalendarDays size={20} />
          <b>No bookings found</b>
          <span>Try changing your filters or search terms.</span>
        </div>
      ) : rows.map((b) => (
        <article className="booking-mobile-card" key={b.id}>
          {admin ? (
            <>
              <div className="mobile-card-topline">
                <div><b>{b.requester}</b><span>{b.role}</span></div>
                {status(b.status)}
              </div>
              <button className="mobile-card-event" onClick={() => openBooking(b)}>{b.event}</button>
              <p className="mobile-card-venue"><MapPin size={14} />{b.venue}</p>
              <dl className="mobile-booking-facts">
                <div><dt>Date</dt><dd>{b.date}</dd></div>
                <div><dt>Time</dt><dd>{b.time}</dd></div>
                <div><dt>Attendees</dt><dd>{b.attendees}</dd></div>
                <div><dt>Submitted</dt><dd>{b.requested}</dd></div>
              </dl>
              {b.status === 'Pending' && <div className="mobile-card-actions">
                {button('Approve', () => decision(b.id, 'Approved'), 'primary')}
                {button('Reject', () => { setSelected(b); setModal('reject'); }, 'secondary danger')}
              </div>}
            </>
          ) : (
            <>
              <div className="mobile-card-topline"><span className="mobile-booking-label">Booking</span>{status(b.status)}</div>
              <button className="mobile-card-event" onClick={() => openBooking(b)}>{b.event}</button>
              {b.id && <p className="mobile-card-id">{b.id}</p>}
              <p className="mobile-card-venue"><MapPin size={14} />{b.venue}</p>
              <dl className="mobile-booking-facts">
                <div><dt>Date</dt><dd>{b.date}</dd></div>
                <div><dt>Time</dt><dd>{b.time}</dd></div>
                <div><dt>Requested</dt><dd>{b.requested}</dd></div>
              </dl>
              {b.reason && <p className="mobile-booking-reason">Reason: {b.reason}</p>}
              <div className="mobile-card-actions">{button('View details', () => openBooking(b), 'secondary')}</div>
            </>
          )}
        </article>
      ))}
    </div>
    </>
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
                name="venueSearch"
                placeholder="Try ‘Academic Block’"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>,
          )}
        </div>
        <div className="filter-grid">
          {field('Event date', <input name="searchDate" type="date" defaultValue="2026-10-21" />)}
          {field('Start time', <input name="searchStartTime" type="time" defaultValue="10:00" />)}
          {field('End time', <input name="searchEndTime" type="time" defaultValue="12:00" />)}
          {field('Attendees', <input name="searchAttendees" type="number" defaultValue="72" />)}
          {field(
            'Event type',
            <select name="searchEventType">
              <option>Presentation</option>
              <option>Workshop</option>
              <option>Meeting</option>
              <option>Lecture</option>
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
        <b>{venues.length} venues</b>
        <label>
          Sort by{' '}
          <select name="sortBy">
            <option>Best fit</option>
            <option>Capacity</option>
            <option>Name</option>
          </select>
        </label>
      </div>
      <section className="recommendation-band">
        <div>
          <span className="eyebrow">RECOMMENDED FOR YOUR EVENT</span>
          <h2>Cognizant Lab</h2>
          <p>Fits 48 attendees, includes workstations and a projector, and is available for your selected time.</p>
        </div>
        {button(
          'View recommendation',
          () => {
            setVenue('Cognizant Lab');
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
            Main auditorium is booked on 21 Oct, 10:00–12:00. Available alternatives: 13:00–15:00 in
            Main auditorium, or Mini auditorium at your selected time.
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
          <div className={`form-grid booking-event-grid${isAdmin ? ' is-admin' : ''}`}>
            {isAdmin &&
              field('Booking for', <input name="bookingFor" placeholder="Name and college email" />)}
            {field(
              'Event title',
              <input
                id="eventTitle"
                name="eventTitle"
                placeholder="e.g. CSE Project Presentation"
              />,
            )}
            {field(
              'Event type',
              <select name="eventType">
                <option>Presentation</option>
                <option>Workshop</option>
                <option>Meeting</option>
                <option>Club event</option>
              </select>,
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
                {venues.map((v) => (
                  <option key={v.name}>{v.name}</option>
                ))}
              </select>,
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
              <dd>{bookingStartTime} – {bookingEndTime}</dd>
            </div>
            <div>
              <dt>Attendees</dt>
              <dd>{bookingAttendees || '0'} people</dd>
            </div>
            <div>
              <dt>Capacity</dt>
              <dd>{venues.find((v) => v.name === venue)?.capacity} people</dd>
            </div>
            <div>
              <dt>Facilities</dt>
              <dd>{venues.find((v) => v.name === venue)?.facilities.join(', ')}</dd>
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
        isAdmin ? 'Booking requests' : 'My bookings',
        isAdmin
          ? 'Review booking requests and manage venue reservations.'
          : 'Track requests and manage your venue reservations.',
        button('Book a venue', () => go('Find a Venue'), 'primary', Plus),
      )}
      {showSampleBookingRequests && (
        <p className="booking-preview-note">
          Sample requests for preview · Live requests will appear here when available.
        </p>
      )}
      <div className="toolbar booking-toolbar">
        <div className="tabs">
          {['All', 'Pending', 'Approved', 'Rejected'].map((t) => (
            <button
              key={t}
              className={filter === t ? 'active' : ''}
              onClick={() => setFilter(t)}
            >
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
  const visibleAuthRequests =
    authRequests.length > 0
      ? authRequests
      : previewAuthRequests.filter((request) => request.status === authFilter);
  const showingAuthPreview = authRequests.length === 0 && visibleAuthRequests.length > 0;
  const authorizationBadgeCount =
    pendingAuthRequestCount > 0
      ? pendingAuthRequestCount
      : previewAuthRequests.filter((request) => request.status === 'pending').length;
  const dashboardBookingRequests = adminBookingRows.filter((booking) => booking.status === 'Pending');
  const dashboardBookingPreview = showSampleBookingRequests && dashboardBookingRequests.length > 0;
  const liveDashboardAuthorizationRequests = authRequests.filter(
    (request) => request.status === 'pending',
  );
  const dashboardAuthorizationRequests = liveDashboardAuthorizationRequests.length
    ? liveDashboardAuthorizationRequests
    : previewAuthRequests.filter((request) => request.status === 'pending');
  const dashboardAuthorizationPreview =
    liveDashboardAuthorizationRequests.length === 0 && dashboardAuthorizationRequests.length > 0;
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
          {showingAuthPreview && (
            <p className="authorization-preview-note">
              Sample authorization requests for preview · Live requests will appear here when available.
            </p>
          )}
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
          {field(
            'Authorized class or club',
            <input name="authorizedClub" defaultValue="CSE Coding Club" />,
          )}
          {field(
            'Supporting information',
            <textarea
              name="supportingInfo"
              rows="3"
              defaultValue="Student club lead for the 2026–27 academic year."
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
                  <select name="requestedRole" value={role} onChange={(e) => setRole(e.target.value)}>
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
                    <option>2026–27</option>
                    <option>2025–26</option>
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
              <p>
                {dashboardBookingPreview
                  ? 'Sample requests for preview · Live requests will replace these when available.'
                  : 'Only CR and Club Head requests need approval.'}
              </p>
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
                      <span>{booking.time} · {booking.attendees} attendees</span>
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
              <p>
                {dashboardAuthorizationPreview
                  ? 'Sample preview requests · Separate from booking approvals.'
                  : 'Separate from booking approvals.'}
              </p>
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
                <span>{r.type} · {r.details?.name}</span>
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
              <p>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} · All venues</p>
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
        {venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())).map((v) => (
          <article className="venue-management-card" key={v.name}>
            <div className="mobile-card-topline"><h3>{v.name}</h3><span className="status approved">Active</span></div>
            <p className="mobile-card-venue"><MapPin size={14} />{v.building}</p>
            <div className="venue-mobile-capacity"><span>Capacity</span><b>{v.capacity} people</b></div>
            <div className="chips">{v.facilities.map((facility) => <span key={facility}>{facility}</span>)}</div>
            <div className="mobile-card-actions">
              {button('Edit', () => { setVenue(v.name); setModal('edit-venue'); }, 'secondary', Pencil)}
              {button('Deactivate', () => { setVenue(v.name); setModal('deactivate'); }, 'text danger', Ban)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
  const calendarPage = () => (
    <>
      {heading(
        'Booking calendar',
        'Review venue schedules and identify busy periods.',
        button('Today', () => {
          setWeekOffset(0);
          notify('Showing this week');
        }),
      )}
      <div className="calendar-toolbar">
        <div className="month-head">
          <button className="icon-button" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft />
          </button>
          <b>
            {weekDays(weekOffset)[0].toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </b>
          <button className="icon-button" onClick={() => setWeekOffset(weekOffset + 1)}>
            <ChevronRight />
          </button>
        </div>
        <div className="tabs">
          {['Day', 'Week', 'Month'].map((t, i) => (
            <button key={t} className={i === 1 ? 'active' : ''}>
              {t}
            </button>
          ))}
        </div>
        <select
          name="calendarVenue"
          value={calendarVenue}
          onChange={(e) => setCalendarVenue(e.target.value)}
        >
          <option>All venues</option>
          {venues.map((v) => (
            <option key={v.name}>{v.name}</option>
          ))}
        </select>
      </div>
      {(() => {
        const days = weekDays(weekOffset);
        const weekStart = toISODate(days[0]);
        const weekEnd = toISODate(days[6]);
        const confirmedBookings = bookings.filter(
          (booking) =>
            ['confirmed', 'approved'].includes(String(booking.status).toLowerCase()) &&
            booking.date >= weekStart &&
            booking.date <= weekEnd,
        );
        const previewBookings = [
          {
            id: 'preview-cse-presentation',
            event: 'CSE Project Presentation',
            venue: 'Seminar Hall 2',
            date: toISODate(days[0]),
            time: '10:00 – 12:00',
            status: 'Confirmed',
            attendees: 82,
            requester: 'Prachi Sharma',
          },
          {
            id: 'preview-web-workshop',
            event: 'Web Development Workshop',
            venue: 'Cognizant Lab',
            date: toISODate(days[1]),
            time: '14:00 – 16:00',
            status: 'Approved',
            attendees: 48,
            requester: 'Coding Club',
          },
          {
            id: 'preview-guest-lecture',
            event: 'Department Guest Lecture',
            venue: 'Main auditorium',
            date: toISODate(days[2]),
            time: '11:00 – 13:00',
            status: 'Confirmed',
            attendees: 210,
            requester: 'Computer Engineering',
          },
          {
            id: 'preview-design-session',
            event: 'Design Thinking Session',
            venue: 'Academic Complex NC04',
            date: toISODate(days[3]),
            time: '09:00 – 11:00',
            status: 'Approved',
            attendees: 36,
            requester: 'Design Society',
          },
          {
            id: 'preview-coding-meetup',
            event: 'Coding Club Meetup',
            venue: 'New Cse NC28',
            date: toISODate(days[4]),
            time: '11:00 – 12:30',
            status: 'Approved',
            attendees: 24,
            requester: 'Coding Club',
          },
        ];
        const calendarBookings = confirmedBookings.length ? confirmedBookings : previewBookings;
        const displayBookings = calendarBookings.filter(
          (booking) => calendarVenue === 'All venues' || booking.venue === calendarVenue,
        );

        return (
          <>
            {!confirmedBookings.length && (
              <p className="calendar-preview-note">
                Sample schedule for preview. Approved and confirmed bookings will appear here when
                available.
              </p>
            )}
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
                ].map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
              {days.map((day) => {
                const iso = toISODate(day);
                return (
                  <div className="day-col" key={iso}>
                    <b>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })} {day.getDate()}
                    </b>
                    <div className="day-slots">
                      {displayBookings
                        .filter((booking) => booking.date === iso)
                        .map((booking) => {
                          const [from, to] = booking.time.split(' – ');
                          const top = ((minutesOf(from) - 480) / 600) * 100;
                          const height = ((minutesOf(to) - minutesOf(from)) / 600) * 100;
                          return (
                            <button
                              key={booking.id}
                              type="button"
                              className={`calendar-event${String(booking.status).toLowerCase() === 'approved' ? ' secondary-event' : ''}`}
                              style={{ top: `${Math.max(top, 0)}%`, height: `${height}%` }}
                              aria-label={`${booking.event}, ${booking.venue}, ${booking.time}`}
                              onClick={() => setCalendarSelection(booking)}
                            >
                              <b>{booking.event}</b>
                              <span>{booking.venue}</span>
                              <small>{from}–{to}</small>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
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
                    {calendarSelection.attendees} attendees · Booked for {calendarSelection.requester}
                  </span>
                </div>
                {status(calendarSelection.status)}
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
      })()}
    </>
  );
  const analytics = () => (
    <>
      {heading(
        'Analytics',
        'Booking patterns and venue utilization.',
        <div className="toolbar">
          <input name="analyticsFrom" type="date" aria-label="From date" defaultValue={`${monthKey}-01`} />
          <span>to</span>
          <input
            name="analyticsTo"
            type="date"
            aria-label="To date"
            defaultValue={toISODate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))}
          />
        </div>,
      )}
      {analyticsPreview && (
        <div className="analytics-preview-note">
          <b>Sample analytics</b>
          <span>
            Illustrative figures for preview only. Live totals will appear when booking records are
            available for this month.
          </span>
        </div>
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
          <b>{mostBooked[0][0]}</b>
          <small>{mostBooked[0][1]}</small>
        </div>
      </section>
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <h2>Booking volume</h2>
              <p>
                {analyticsPreview ? 'Illustrative booking activity' : 'Confirmed and approved bookings'} ·{' '}
                {monthLabel}
              </p>
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
          <div className="rank-list">
            {mostBooked.map((x, i) => (
              <div key={x[0]}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <span>{x[0]}</span>
                <small>{x[1]}</small>
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
                    go('Sign in');
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
                    go('Sign up');
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
                    name="recoveryEmail"
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
                    go('Sign in');
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
                    name="otpCode"
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
                  <select
                    name="signupRole"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                  >
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
                    name="email"
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
                      name="password"
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
                    <input type="checkbox" name="rememberMe" /> Remember me
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      go('Forgot password');
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
                          onClick={() => openBooking(booking)}
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
              {field(
                'Full name',
                <input
                  name="profileName"
                  value={profileDraft ?? currentUser.name}
                  onChange={(e) => setProfileDraft(e.target.value)}
                />,
              )}
              {field(
                'College email',
                <input name="profileEmail" value={currentUser.email} readOnly />,
              )}
              {field('Role', <input name="profileRole" value={role} readOnly />)}
              {button('Save changes', saveProfile, 'primary')}
            </section>
          </>
        );
      default:
        return dashboard();
    }
  };

  const content = renderPage();
  if (!sessionReady) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p>Loading…</p>
        </div>
      </div>
    );
  }
  return (
    <>
      {['Sign in', 'Sign up', 'Forgot password', 'Access Pending'].includes(page) ? (
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
                  {name === 'Booking Requests' && isAdmin && pendingBookings > 0 && (
                    <i className="nav-count">{pendingBookings}</i>
                  )}
                  {name === 'Authorization Requests' && isAdmin && authorizationBadgeCount > 0 && (
                    <i className="nav-count">{authorizationBadgeCount}</i>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              {isSignedIn ? (
                <>
                  <button className="nav-item" onClick={signOut}>
                    <LogOut size={18} />
                    <span>Sign out</span>
                  </button>
                  <div
                    className={`profile-mini ${profileOpen ? 'open' : ''}`}
                    onClick={() => setProfileOpen(!profileOpen)}
                  >
                    <div className="avatar">{initials}</div>
                    <div>
                      <b>{displayName}</b>
                      <span>{role}</span>
                    </div>
                    <ChevronDown
                      size={15}
                      className={`profile-chevron ${profileOpen ? 'rotated' : ''}`}
                    />
                    {profileOpen && (
                      <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="profile-dropdown-label">{displayName}</div>
                        <button
                          className="profile-dropdown-item"
                          onClick={() => {
                            go('Profile');
                            setProfileOpen(false);
                          }}
                        >
                          Profile
                        </button>
                        <button
                          className="profile-dropdown-item"
                          onClick={() => {
                            setProfileOpen(false);
                            signOut();
                          }}
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button className="nav-item" onClick={() => go('Sign in')}>
                  <span className="material-symbols-outlined nav-icon" aria-hidden="true">
                    login
                  </span>
                  <span>Sign in</span>
                </button>
              )}
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
                  window.matchMedia('(max-width: 900px)').matches ? mobileOpen : !sidebarHidden
                }
                title={
                  window.matchMedia('(max-width: 900px)').matches
                    ? 'Open navigation'
                    : 'Toggle navigation'
                }
                onClick={() => {
                  if (window.matchMedia('(max-width: 900px)').matches) {
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
                {isSignedIn ? (
                  <>
                    <button className="icon-button notify" onClick={() => go('Notifications')}>
                      <Bell size={18} />
                      <i />
                    </button>
                    <div className="top-profile">
                      <div className="avatar">{initials}</div>
                      <span>{displayName}</span>
                      <ChevronDown size={14} />
                    </div>
                  </>
                ) : (
                  <button className="button primary" onClick={() => go('Sign in')}>
                    Sign in
                  </button>
                )}
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
                    name="rejectionReason"
                    rows="4"
                    placeholder="e.g. Venue is reserved for examinations on this date."
                  />
                </label>
                <div className="modal-actions">
                  {button('Cancel', () => setModal(''))}
                  {button(
                    'Reject request',
                    () =>
                      decision(
                        selected.id,
                        'Rejected',
                        document.querySelector('[name="rejectionReason"]')?.value,
                      ),
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
                <p>Main auditorium is unavailable on 21 October, 10:00–12:00.</p>
                <div className="alternative-row">
                  <b>21 Oct · 13:00–15:00</b>
                  <span>Main auditorium · Available</span>
                  {button(
                    'Select time',
                    () => {
                      setVenue('Main auditorium');
                      setModal('');
                      go('Create Booking');
                    },
                    'primary',
                  )}
                </div>
                <div className="alternative-row">
                  <b>21 Oct · 10:00–12:00</b>
                  <span>Mini auditorium · Fits 150 people</span>
                  {button(
                    'Select venue',
                    () => {
                      setVenue('Mini auditorium');
                      setModal('');
                      go('Create Booking');
                    },
                    'primary',
                  )}
                </div>
              </>
            ) : modal === 'authorization' ? (
              reviewing && (
                <>
                  <h2>Authorization request</h2>
                  <p>
                    {reviewing.user?.name} · {reviewing.type} · {reviewing.details?.name}
                  </p>
                  <div className="notice">
                    {reviewing.user?.email} · Submitted{' '}
                    {new Date(reviewing.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {reviewing.details?.note && <p>{reviewing.details.note}</p>}
                  {reviewing.status === 'pending' ? (
                    <>
                      <label className="field">
                        <span>Reason (required to reject)</span>
                        <textarea
                          name="authRejectReason"
                          rows="3"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </label>
                      <div className="modal-actions">
                        {button(
                          'Reject',
                          () => {
                            if (!rejectReason.trim()) {
                              notify('Enter a rejection reason');
                              return;
                            }
                            reviewRequest(reviewing._id, 'reject', rejectReason.trim());
                          },
                          'danger-button',
                        )}
                        {button(
                          reviewBusy ? 'Please wait…' : 'Approve authorization',
                          () => reviewRequest(reviewing._id, 'approve'),
                          'primary',
                        )}
                      </div>
                    </>
                  ) : (
                    <p>
                      Status: {reviewing.status}
                      {reviewing.rejectionReason ? ` · Reason: ${reviewing.rejectionReason}` : ''}
                    </p>
                  )}
                </>
              )
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
                        name="venueName"
                        defaultValue={modal === 'edit-venue' ? venue : ''}
                        placeholder="Venue name"
                      />,
                    )}
                    {field(
                      'Location',
                      <input name="venueLocation" placeholder="Building and floor" />,
                    )}
                    {field(
                      'Capacity',
                      <input name="venueCapacity" type="number" placeholder="Maximum attendees" />,
                    )}
                    {field(
                      'Facilities',
                      <input name="venueFacilities" placeholder="Projector, whiteboard" />,
                    )}
                    {field(
                      'Description',
                      <textarea
                        name="venueDescription"
                        rows="2"
                        placeholder="Venue description"
                      />,
                    )}
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
