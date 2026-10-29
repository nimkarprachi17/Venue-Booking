import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Bell,
  Menu,
  X,
  ChevronDown,
  MapPin,
  LogOut,
  ArrowRight,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import {
  navAdmin,
  navPublic,
  navUser,
  pageRoutes,
  publicPages,
  getBookingIdFromPath,
  getPageFromPath,
  getVenueIdFromPath,
} from './config/navigation';
import { getFacilityLabel, normalizeVenue, venueFacilityOptions } from './utils/venue';
import { getAuthorizationSpecifications } from './utils/authorization';
import CalendarPage from './pages/CalendarPage';
import { createAdminPages } from './pages/adminPages';
import { createAuthPage } from './pages/authPage';
import { createUserPages } from './pages/userPages';
import {
  formatActivityTime,
  formatEventDate,
  greeting,
  minutesOf,
  normalizeBooking,
  toISODate,
} from './utils/dateTime';

function App() {
  // Current page and signed-in user's role.
  const [role, setRole] = useState('Faculty');
  const [page, setPage] = useState(() => getPageFromPath(window.location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Booking and venue workspace state.
  const [bookings, setBookings] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState('');
  const [venueBusy, setVenueBusy] = useState(false);
  const [selectedVenueFacilityCount, setSelectedVenueFacilityCount] = useState(0);
  const [query, setQuery] = useState('');
  const [venueCapacityFilter, setVenueCapacityFilter] = useState('All capacities');
  const [venueFacilityFilter, setVenueFacilityFilter] = useState('All facilities');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState('');
  const [venue, setVenue] = useState(() => getVenueIdFromPath(window.location.pathname) || '');
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  });
  const [bookingStartTime, setBookingStartTime] = useState('10:00');
  const [bookingEndTime, setBookingEndTime] = useState('12:00');
  const [bookingAttendees, setBookingAttendees] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
  const [signupSpecifications, setSignupSpecifications] = useState({
    position: '',
    year: '',
    branch: '',
    className: '',
    clubName: '',
  });
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
  const [profileApprovalNotification, setProfileApprovalNotification] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bookARoom.profileApprovalNotification') || 'null');
    } catch {
      return null;
    }
  });
  const [authRequests, setAuthRequests] = useState([]);
  const [pendingAuthRequestCount, setPendingAuthRequestCount] = useState(null);
  const [authFilter, setAuthFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  // Signed-in user's profile, plus calendar controls.
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', role: '' });
  const [profileDraft, setProfileDraft] = useState(null);
  const [calendarVenue, setCalendarVenue] = useState('All venues');
  const [calendarView, setCalendarView] = useState('Week');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [mobileCalendarDay, setMobileCalendarDay] = useState((new Date().getDay() + 6) % 7);
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
        ? `/venues/${encodeURIComponent(options.venueId || venue)}`
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
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    fetch(`${apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
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

  async function loadVenues() {
    setVenuesError('');
    setVenuesLoading(true);
    try {
      const data = await api('/api/venues?includeInactive=true');
      const rows = Array.isArray(data) ? data : data.venues || [];
      const normalized = rows.map(normalizeVenue);
      setVenues(normalized);
      setVenue((current) => {
        if (current && normalized.some((item) => item._id === current)) return current;
        return normalized[0]?._id || '';
      });
    } catch (error) {
      setVenuesError(error.message || 'Could not load venues.');
      setVenues([]);
    } finally {
      setVenuesLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, [isAdmin, accessToken]);

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
          setVenue(getVenueIdFromPath(window.location.pathname) || '');
        }
      }
      setSelected(
        bookingId ? bookings.find((item) => String(item.id) === bookingId) || null : null,
      );
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
          [
            'Booking Requests',
            'Authorization Requests',
            'Venue Management',
            'Booking Calendar',
            'Analytics',
          ].includes(requestedPage)
        ) {
          go('Overview', { replace: true });
        } else {
          if (requestedPage === 'Venue Details') {
            setVenue(getVenueIdFromPath(window.location.pathname) || '');
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
  async function loadCalendarBookings() {
    setCalendarLoading(true);
    setCalendarError('');
    try {
      const response = await fetch(`${apiBase}/api/bookings/calendar`, {
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not load the campus calendar.');
      const rows = Array.isArray(data.bookings) ? data.bookings : [];
      setCalendarBookings(
        rows.map((booking) => ({
          id: String(booking.bookingId || booking._id || ''),
          event: booking.event || booking.eventName || 'Campus booking',
          venue: booking.venue || booking.venueName || 'Venue',
          date: booking.date,
          time: `${booking.startTime} – ${booking.endTime}`,
          status: booking.status,
        })),
      );
    } catch (error) {
      setCalendarError(error.message || 'Could not load the campus calendar.');
      setCalendarBookings([]);
    } finally {
      setCalendarLoading(false);
    }
  }
  useEffect(() => {
    if (!['Calendar', 'Booking Calendar'].includes(page)) return undefined;
    loadCalendarBookings();
    const refreshCalendar = () => loadCalendarBookings();
    const intervalId = window.setInterval(refreshCalendar, 30_000);
    window.addEventListener('focus', refreshCalendar);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshCalendar);
    };
  }, [page]);
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
    const roleRequirements = {
      Faculty: ['position'],
      'Class Representative': ['year', 'branch', 'className'],
      'Club Head': ['clubName', 'position'],
    };
    const missingSpecification = (roleRequirements[signupRole] || []).find(
      (key) => !signupSpecifications[key].trim(),
    );
    if (missingSpecification) {
      setLoginError('Complete the required role details.');
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
          ...signupSpecifications,
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
        // data.user.role === 'Faculty' ||
        data.user.role === 'Admin' ||
        data.user.authorizationStatus === 'approved';
      setAuthorized(isApproved);
      setAccessReviewStatus(data.user.authorizationStatus || 'pending');
      setLoginEmail(data.user.email);
      if (!isApproved && ['Class Representative', 'Club Head','Faculty'].includes(data.user.role)) {
        localStorage.setItem(
          'bookARoom.pendingProfileApproval',
          JSON.stringify({ email: data.user.email.toLowerCase(), role: data.user.role }),
        );
      }
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
        // data.user.role === 'Faculty' ||
        data.user.role === 'Admin' ||
        data.user.authorizationStatus === 'approved';
      setAuthorized(isApproved);
      if (!isApproved) {
        setAccessReviewStatus(data.user.authorizationStatus || 'pending');
        if (['Class Representative', 'Club Head','Faculty'].includes(data.user.role)) {
          localStorage.setItem(
            'bookARoom.pendingProfileApproval',
            JSON.stringify({ email: data.user.email.toLowerCase(), role: data.user.role }),
          );
        }
        go('Access Pending');
        return;
      }
      let wasWaitingForApproval = false;
      try {
        const pendingApproval = JSON.parse(
          localStorage.getItem('bookARoom.pendingProfileApproval') || 'null',
        );
        wasWaitingForApproval =
          ['Class Representative', 'Club Head','Faculty'].includes(data.user.role) &&
          pendingApproval?.email === data.user.email.toLowerCase() &&
          pendingApproval?.role === data.user.role &&
          data.user.authorizationStatus === 'approved';
      } catch {
        wasWaitingForApproval = false;
      }
      if (wasWaitingForApproval) {
        const approvalNotice = {
          id: `profile-approved-${data.user.email.toLowerCase()}`,
          email: data.user.email.toLowerCase(),
          title: `Profile approved for ${data.user.role}`,
          message: `An administrator approved your profile for ${data.user.role}. You can now submit venue booking requests; each booking still requires admin approval.`,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(
          'bookARoom.profileApprovalNotification',
          JSON.stringify(approvalNotice),
        );
        localStorage.removeItem('bookARoom.pendingProfileApproval');
        setProfileApprovalNotification(approvalNotice);
      }
      saveToken(data.accessToken || '');
      setCurrentUser(data.user);
      go('Overview');
      notify(wasWaitingForApproval ? 'Your profile has been approved.' : 'Signed in successfully');
    } catch (error) {
      setLoginError(
        error.message || 'Could not reach the sign-in service. Check that the server is running.',
      );
    } finally {
      setLoginLoading(false);
    }
  };
  // Booking actions and derived data.
  const adminBookingRows = bookings;
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
    const selectedVenue = venues.find((v) => v._id === venue);
    const capacity = selectedVenue?.capacity;
    if (!selectedVenue || !selectedVenue.isActive) {
      notify('Choose an active venue before submitting.');
      return;
    }
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
          venueId: venue,
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
  async function saveVenue() {
    if (venueBusy) return;
    const read = (name) => document.querySelector(`[name="${name}"]`);
    const isEditing = modal === 'edit-venue';
    const existingVenue = venues.find((item) => item._id === venue);
    const selectedFacilities = Array.from(
      document.querySelectorAll('[name="venueFacility"]:checked'),
    ).map((input) => input.value);
    const additionalFacilities = (read('venueOtherFacilities')?.value || '')
      .split(',')
      .map((facility) => facility.trim())
      .filter(Boolean);
    const payload = {
      name: read('venueName')?.value.trim(),
      location: read('venueLocation')?.value.trim(),
      capacity: Number(read('venueCapacity')?.value),
      facilities: [...new Set([...selectedFacilities, ...additionalFacilities])],
      description: read('venueDescription')?.value.trim() || '',
      imageUrl: read('venueImageUrl')?.value.trim() || '',
    };
    if (isEditing) payload.isActive = read('venueStatus')?.value === 'active';
    if (!payload.name || !payload.location || !Number.isFinite(payload.capacity) || payload.capacity < 1) {
      notify('Enter a venue name, location, and capacity greater than zero.');
      return;
    }
    setVenueBusy(true);
    try {
      const data = await api(isEditing ? `/api/venues/${venue}` : '/api/venues', {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      await loadVenues();
      if (data.venue?._id) setVenue(String(data.venue._id));
      setModal('');
      notify(isEditing ? 'Venue updated.' : 'Venue added.');
    } catch (error) {
      notify(error.message);
    } finally {
      setVenueBusy(false);
    }
  }
  async function deactivateVenue() {
    if (!venue) return;
    setVenueBusy(true);
    try {
      await api(`/api/venues/${venue}/deactivate`, { method: 'PATCH' });
      await loadVenues();
      setModal('');
      notify('Venue deactivated. Existing booking records are retained.');
    } catch (error) {
      notify(error.message);
    } finally {
      setVenueBusy(false);
    }
  }
  async function setVenueStatus(id, isActive) {
    try {
      await api(`/api/venues/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      await loadVenues();
      notify(isActive ? 'Venue activated.' : 'Venue deactivated. Existing bookings are retained.');
    } catch (error) {
      notify(error.message);
    }
  }
  const authorize = () => {
    setAuthorized(false);
    notify('Authorization request submitted');
  };
  const decision = async (id, status, reason) => {
    if (status === 'Rejected' && !reason?.trim()) {
      notify('Enter a rejection reason');
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
  const visibleProfileApprovalNotification =
    profileApprovalNotification?.email === currentUser.email?.toLowerCase()
      ? profileApprovalNotification
      : null;
  const todaysBookings = bookings
    .filter((b) => b.date === today && ['Confirmed', 'Approved'].includes(b.status))
    .sort((a, b) => a.time.localeCompare(b.time));
  const monthBookings = bookings.filter((b) => b.date.startsWith(monthKey));
  const liveBookings = monthBookings.filter((b) => ['Confirmed', 'Approved'].includes(b.status));
  const volumeBars = Array.from({ length: 12 }, (_, i) =>
    liveBookings.filter((b) => {
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
  const activeVenues = venues.filter((item) => item.isActive);
  const venueUtilization = activeVenues
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
  const mostBooked = liveBookings.length
    ? activeVenues
        .map((v) => [v.name, liveBookings.filter((b) => b.venue === v.name).length])
        .sort((a, b) => b[1] - a[1])
        .filter(([, count]) => count > 0)
        .slice(0, 4)
        .map(([name, count]) => [name, `${count} bookings`])
    : [];
  const statusBreakdown = ['Confirmed', 'Approved', 'Pending', 'Rejected'].map((name) => [
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
  const field = (label, control, extra = '', required = false) => {
    const fieldControl =
      required && React.isValidElement(control)
        ? React.cloneElement(control, { required: true, 'aria-required': 'true' })
        : control;

    return (
      <label className="field">
        <span>
          {label}
          {required && (
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {fieldControl}
        {extra && <small>{extra}</small>}
      </label>
    );
  };
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
      <div
        className={`table-wrap ${admin ? 'admin-booking-table-wrap' : 'user-booking-table-wrap'}`}
        role="region"
        aria-label={admin ? 'Booking request list' : 'My booking list'}
        tabIndex={0}
      >
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
              <tr key={b.id} onClick={() => openBooking(b)} className="click-row">
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
        ) : (
          rows.map((b) => (
            <article className="booking-mobile-card" key={b.id}>
              {admin ? (
                <>
                  <div className="mobile-card-topline">
                    <div>
                      <b>{b.requester}</b>
                      <span>{b.role}</span>
                    </div>
                    {status(b.status)}
                  </div>
                  <button className="mobile-card-event" onClick={() => openBooking(b)}>
                    {b.event}
                  </button>
                  <p className="mobile-card-venue">
                    <MapPin size={14} />
                    {b.venue}
                  </p>
                  <dl className="mobile-booking-facts">
                    <div>
                      <dt>Date</dt>
                      <dd>{b.date}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{b.time}</dd>
                    </div>
                    <div>
                      <dt>Attendees</dt>
                      <dd>{b.attendees}</dd>
                    </div>
                    <div>
                      <dt>Submitted</dt>
                      <dd>{b.requested}</dd>
                    </div>
                  </dl>
                  {b.status === 'Pending' && (
                    <div className="mobile-card-actions">
                      {button('Approve', () => decision(b.id, 'Approved'), 'primary')}
                      {button(
                        'Reject',
                        () => {
                          setSelected(b);
                          setModal('reject');
                        },
                        'secondary danger',
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mobile-card-topline">
                    <span className="mobile-booking-label">Booking</span>
                    {status(b.status)}
                  </div>
                  <button className="mobile-card-event" onClick={() => openBooking(b)}>
                    {b.event}
                  </button>
                  {b.id && <p className="mobile-card-id">{b.id}</p>}
                  <p className="mobile-card-venue">
                    <MapPin size={14} />
                    {b.venue}
                  </p>
                  <dl className="mobile-booking-facts">
                    <div>
                      <dt>Date</dt>
                      <dd>{b.date}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{b.time}</dd>
                    </div>
                    <div>
                      <dt>Requested</dt>
                      <dd>{b.requested}</dd>
                    </div>
                  </dl>
                  {b.reason && <p className="mobile-booking-reason">Reason: {b.reason}</p>}
                  <div className="mobile-card-actions">
                    {button('View details', () => openBooking(b), 'secondary')}
                  </div>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </>
  );
  const venueRow = (v) => (
    <article className="venue-row" key={v._id}>
      {v.imageUrl ? (
        <img src={v.imageUrl} alt={`${v.name}`} />
      ) : (
        <div className="venue-image-placeholder" aria-label="No venue image provided">
          <MapPin size={22} />
          <span>No image</span>
        </div>
      )}
      <div className="venue-main">
        <div className="venue-title-line">
          <h3>{v.name}</h3>
          {!v.isActive && <span className="status inactive">Inactive · view only</span>}
        </div>
        <p>
          <MapPin size={14} />
          {v.location}
        </p>
        {v.description && <p className="venue-description">{v.description}</p>}
        <div className="chips">
          {v.facilities.map((f) => (
            <span key={f}>{getFacilityLabel(f)}</span>
          ))}
        </div>
      </div>
      <div className="venue-cap">
        <span>Capacity</span>
        <b>{v.capacity} people</b>
      </div>
      <div className="venue-availability">
        Availability checked when you book
      </div>
      <div className="venue-actions">
        {button('Details', () => {
          setVenue(v._id);
          go('Venue Details', { venueId: v._id });
        })}
        {v.isActive ? (
          button(
            'Book venue',
            () => {
              setVenue(v._id);
              go('Create Booking');
            },
            'primary',
          )
        ) : (
          <button className="button inactive-button" type="button" disabled>
            Inactive
          </button>
        )}
      </div>
    </article>
  );
  const userPages = createUserPages({
    heading,
    greeting,
    displayName,
    button,
    go,
    bookings,
    table,
    status,
    venue,
    venues,
    getFacilityLabel,
    venue,
    venuesLoading,
    venuesError,
    loadVenues,
    setVenue,
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
  });
  const { dashboard, findVenue, createForm, details, bookingsPage } = userPages;
  const visibleAuthRequests = authRequests;
  const authorizationBadgeCount = pendingAuthRequestCount || 0;
  const dashboardBookingRequests = adminBookingRows.filter(
    (booking) => booking.status === 'Pending',
  );
  const dashboardAuthorizationRequests = authRequests.filter(
    (request) => request.status === 'pending',
  );
  const adminPages = createAdminPages({
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
    venuesLoading,
    venuesError,
    loadVenues,
    venueBusy,
    selectedVenueFacilityCount,
    setSelectedVenueFacilityCount,
    saveVenue,
    deactivateVenue,
    setVenueStatus,
    getFacilityLabel,
    venueFacilityOptions,
    todaysBookings,
    dashboardBookingRequests,
    dashboardAuthorizationRequests,
    openBooking,
    decision,
    setSelected,
    query,
    setQuery,
    venueCapacityFilter,
    setVenueCapacityFilter,
    venueFacilityFilter,
    setVenueFacilityFilter,
    setVenue,
    monthKey,
    monthLabel,
    statusBreakdown,
    volumeBars,
    mostBooked,
    volumeMax,
    venueUtilization,
  });
  const { authPage, adminOverview, venueAdmin, analytics } = adminPages;
  const calendarPage = () => (
    <CalendarPage
      isAdmin={isAdmin}
      calendarDate={calendarDate}
      setCalendarDate={setCalendarDate}
      calendarView={calendarView}
      setCalendarView={setCalendarView}
      mobileCalendarDay={mobileCalendarDay}
      setMobileCalendarDay={setMobileCalendarDay}
      calendarSelection={calendarSelection}
      setCalendarSelection={setCalendarSelection}
      calendarVenue={calendarVenue}
      setCalendarVenue={setCalendarVenue}
      bookings={calendarBookings}
      loading={calendarLoading}
      error={calendarError}
      venues={venues}
      heading={heading}
      button={button}
      status={status}
    />
  );
  // Authentication screens and main route selection.
  const login = createAuthPage({
    authView,
    signupStep,
    recovering,
    page,
    field,
    button,
    go,
    setLoginError,
    accessReviewStatus,
    role,
    setLoginPassword,
    loginEmail,
    setLoginEmail,
    loginError,
    recoverySent,
    setRecoverySent,
    otpCode,
    setOtpCode,
    signupBusy,
    verifyRegistrationOtp,
    resendWait,
    resendRegistrationOtp,
    cancelRegistration,
    signupName,
    setSignupName,
    signupRole,
    setSignupRole,
    signupSpecifications,
    setSignupSpecifications,
    signupPassword,
    setSignupPassword,
    signupConfirm,
    setSignupConfirm,
    startRegistration,
    showPassword,
    setShowPassword,
    loginPassword,
    loginLoading,
    signIn,
  }); // Render the active screen. Keep route selection in one place for easier navigation changes.
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
      case 'Calendar':
        return calendarPage();
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
            {heading('Notifications', 'Booking updates and profile decisions.')}
            <section className="panel notification-panel">
              <div className="notification-panel-head">
                <div>
                  <h2>Recent activity</h2>
                  <p>Updates are ordered by the latest change.</p>
                </div>
                <span>
                  {bookings.length + (visibleProfileApprovalNotification ? 1 : 0)} updates
                </span>
              </div>
              {bookings.length > 0 || visibleProfileApprovalNotification ? (
                <div className="notification-list">
                  {visibleProfileApprovalNotification && (
                    <article
                      className="notification-row"
                      key={visibleProfileApprovalNotification.id}
                    >
                      <button
                        className="notification-main"
                        onClick={() => go('Find a Venue')}
                        aria-label="Find a venue after profile approval"
                      >
                        <span className="notification-copy">
                          <strong>{visibleProfileApprovalNotification.title}</strong>
                          <span>{visibleProfileApprovalNotification.message}</span>
                        </span>
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                      <div className="notification-meta">
                        <span className="notification-time">
                          Updated {formatActivityTime(visibleProfileApprovalNotification.createdAt)}
                        </span>
                        {status('Approved')}
                      </div>
                    </article>
                  )}
                  {[...bookings]
                    .sort(
                      (first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
                    )
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
      case 'Profile': {
        const roleNeedsApproval = ['Class Representative', 'Club Head','Faculty'].includes(role);
        const profileRoleApproved =
          !roleNeedsApproval || currentUser.authorizationStatus === 'approved';

        return (
          <>
            {heading('Profile', 'Your college account details.')}
            <div className="profile-page">
              <section className="panel profile-identity">
                <div className="profile-avatar" aria-hidden="true">
                  {initials || 'U'}
                </div>
                <div className="profile-identity-copy">
                  <h2>{currentUser.name || 'Your profile'}</h2>
                  <p>{currentUser.email}</p>
                </div>
                <span
                  className={`profile-approval ${profileRoleApproved ? 'is-approved' : 'is-pending'}`}
                >
                  {profileRoleApproved ? 'Profile approved' : 'Approval pending'}
                </span>
              </section>

              <section className="panel profile-details">
                <div className="profile-section-heading">
                  <h2>Account details</h2>
                  <p>
                    Update your name. Your college email and assigned role are managed by the
                    college.
                  </p>
                </div>
                <div className="profile-fields">
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
                  {field('College role', <input name="profileRole" value={role} readOnly />)}
                </div>
                <div className="profile-footer">
                  <span>
                    {roleNeedsApproval && profileRoleApproved
                      ? 'Each booking request still requires admin approval.'
                      : role === 'Faculty'
                        ? 'Faculty bookings are confirmed directly when availability checks pass.'
                        : 'Your account details are associated with your college login.'}
                  </span>
                  {button('Save changes', saveProfile, 'primary')}
                </div>
              </section>
            </div>
          </>
        );
      }
      default:
        return dashboard();
    }
  };

  const authPages = ['Sign in', 'Sign up', 'Forgot password', 'Access Pending'];
  const reviewingSpecifications = getAuthorizationSpecifications(reviewing);
  // Do not render a protected workspace while restoring a session or showing auth.
  // Besides avoiding unnecessary work, this prevents errors in a dashboard page
  // from taking down the standalone login screen.
  const content = sessionReady && !authPages.includes(page) ? renderPage() : null;
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
      {authPages.includes(page) ? (
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
      ) : modal === 'authorization' ? (
              reviewing && (
                <>
                  <h2>Authorization request</h2>
                  <p>
                    {reviewing.user?.name} · {reviewing.type}
                  </p>
                  <dl className="authorization-specifications">
                    {reviewingSpecifications.map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
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
                    ? `New bookings will no longer be accepted for ${venues.find((item) => item._id === venue)?.name || 'this venue'}. Existing booking records will be kept.`
                    : 'Keep venue information accurate for campus users.'}
                </p>
                {modal !== 'deactivate' && (
                  <div className="form-grid">
                    {field(
                      'Venue name',
                      <input
                        name="venueName"
                        defaultValue={modal === 'edit-venue' ? venues.find((item) => item._id === venue)?.name || '' : ''}
                        placeholder="Venue name"
                        required
                      />,
                    )}
                    {field(
                      'Location',
                      <input name="venueLocation" defaultValue={modal === 'edit-venue' ? venues.find((item) => item._id === venue)?.location || '' : ''} placeholder="Building and floor" required />,
                    )}
                    {field(
                      'Capacity',
                      <input name="venueCapacity" type="number" min="1" defaultValue={modal === 'edit-venue' ? venues.find((item) => item._id === venue)?.capacity || '' : ''} placeholder="Maximum attendees" required />,
                    )}
                    {field(
                      'Facilities',
                      <details className="facility-dropdown">
                        <summary>
                          <span>Select facilities</span>
                          {selectedVenueFacilityCount > 0 && (
                            <span className="facility-selected-count">
                              {selectedVenueFacilityCount} selected
                            </span>
                          )}
                          <ChevronDown size={16} aria-hidden="true" />
                        </summary>
                        <div className="facility-dropdown-menu">
                          {venueFacilityOptions.map(([value, label]) => (
                            <label key={value}>
                              <input
                                type="checkbox"
                                name="venueFacility"
                                value={value}
                                defaultChecked={modal === 'edit-venue' && venues.find((item) => item._id === venue)?.facilities.includes(value)}
                                onChange={() => {
                                  const checkedCount = document.querySelectorAll('[name="venueFacility"]:checked').length;
                                  const otherCount = (document.querySelector('[name="venueOtherFacilities"]')?.value || '')
                                    .split(',').filter((facility) => facility.trim()).length;
                                  setSelectedVenueFacilityCount(checkedCount + otherCount);
                                }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </details>,
                    )}
                    {field(
                      'Additional facilities',
                      <input
                        name="venueOtherFacilities"
                        defaultValue={
                          modal === 'edit-venue'
                            ? venues.find((item) => item._id === venue)?.facilities
                                .filter((facility) => !venueFacilityOptions.some(([value]) => value === facility))
                                .join(', ')
                            : ''
                        }
                        placeholder="e.g. Lecture capture, lectern computer"
                        onChange={(event) => {
                          const checkedCount = document.querySelectorAll('[name="venueFacility"]:checked').length;
                          const otherCount = event.target.value.split(',').filter((facility) => facility.trim()).length;
                          setSelectedVenueFacilityCount(checkedCount + otherCount);
                        }}
                      />,
                      'Enter other facilities separated by commas.',
                    )}
                    {field(
                      'Description',
                      <textarea name="venueDescription" rows="3" defaultValue={modal === 'edit-venue' ? venues.find((item) => item._id === venue)?.description || '' : ''} placeholder="Describe the space and its suitable uses" />,
                    )}
                    {field(
                      'Image URL (optional)',
                      <input name="venueImageUrl" type="url" defaultValue={modal === 'edit-venue' ? venues.find((item) => item._id === venue)?.imageUrl || '' : ''} placeholder="https://…" />,
                    )}
                    {modal === 'edit-venue' && field(
                      'Status',
                      <select name="venueStatus" defaultValue={venues.find((item) => item._id === venue)?.isActive ? 'active' : 'inactive'}>
                        <option value="active">Active — accepts new bookings</option>
                        <option value="inactive">Inactive — hidden from booking</option>
                      </select>,
                    )}
                  </div>
                )}
                <div className="modal-actions">
                  {button('Cancel', () => setModal(''))}
                  <button
                    className={`button ${modal === 'deactivate' ? 'danger-button' : 'primary'}`}
                    disabled={venueBusy}
                    onClick={modal === 'deactivate' ? deactivateVenue : saveVenue}
                  >
                    {venueBusy ? 'Saving…' : modal === 'deactivate' ? 'Deactivate venue' : 'Save venue'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
export default App;
