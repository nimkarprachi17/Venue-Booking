// Shared navigation labels, route paths, and public-route definitions.

export const navUser = [
  ['Overview', 'space_dashboard'],
  ['Find a Venue', 'search'],
  ['My Bookings', 'calendar_month'],
  ['Calendar', 'event'],
  ['Profile', 'person'],
];

export const navPublic = [['Find a Venue', 'search']];

export const navAdmin = [
  ['Overview', 'space_dashboard'],
  ['Booking Requests', 'assignment'],
  ['Authorization Requests', 'verified_user'],
  ['Venue Management', 'meeting_room'],
  ['Booking Calendar', 'calendar_month'],
  ['Analytics', 'analytics'],
];

export const pageRoutes = {
  Overview: '/dashboard',
  'Find a Venue': '/venues',
  'My Bookings': '/bookings',
  Calendar: '/calendar',
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

export const publicPages = new Set([
  'Sign in',
  'Sign up',
  'Forgot password',
  'Access Pending',
  'Find a Venue',
  'Venue Details',
]);

export const getVenueIdFromPath = (pathname) => {
  const venueId = pathname.match(/^\/venues\/([^/]+)\/?$/)?.[1];
  if (!venueId) return null;

  try {
    return decodeURIComponent(venueId);
  } catch {
    return null;
  }
};

export const getPageFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/authorization' || path === '/') return 'Overview';
  if (/^\/venues\/[^/]+$/.test(path)) return 'Venue Details';
  if (path.startsWith('/admin/booking-requests/')) return 'Booking Requests';
  if (path.startsWith('/bookings/') && path !== '/bookings/new') return 'My Bookings';
  return Object.entries(pageRoutes).find(([, route]) => route === path)?.[0] || 'Not Found';
};

export const getBookingIdFromPath = (pathname) => {
  const match = pathname.match(/^\/(?:admin\/booking-requests|bookings)\/([^/]+)\/?$/);
  return match && match[1] !== 'new' ? decodeURIComponent(match[1]) : null;
};
