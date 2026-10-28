// Shared navigation labels, route paths, and public-route definitions.
import { venues } from '../data/venues';

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

export const getVenueFromPath = (pathname) => {
  const slug = pathname.match(/^\/venues\/([^/]+)\/?$/)?.[1];
  if (!slug) return null;

  let venueSlug;
  try {
    venueSlug = decodeURIComponent(slug);
  } catch {
    return null;
  }

  return (
    venues.find((venue) => venue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === venueSlug)
      ?.name ?? null
  );
};

export const getPageFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/authorization' || path === '/') return 'Overview';
  if (path.startsWith('/venues/')) return getVenueFromPath(path) ? 'Venue Details' : 'Not Found';
  if (path.startsWith('/admin/booking-requests/')) return 'Booking Requests';
  if (path.startsWith('/bookings/') && path !== '/bookings/new') return 'My Bookings';
  return Object.entries(pageRoutes).find(([, route]) => route === path)?.[0] || 'Not Found';
};

export const getBookingIdFromPath = (pathname) => {
  const match = pathname.match(/^\/(?:admin\/booking-requests|bookings)\/([^/]+)\/?$/);
  return match && match[1] !== 'new' ? decodeURIComponent(match[1]) : null;
};
