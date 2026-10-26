# Book a Room

Book a Room is a college venue booking application with a React frontend and an Express/MongoDB API starter.

## Frontend

```bash
npm install
npm run dev
```

The frontend is a responsive React application. Use the role selector in the sidebar to preview Faculty, Class Representative, Club Head, and Admin workflows. Booking and authorization state currently lives in the browser session as frontend demonstration data.

## API

The Express API starter is in `server/`. Configure `MONGO_URI` in `server/.env` before starting the API.

## Included workflows

- Faculty booking confirmation and CR/Club Head booking approval states.
- Role authorization requests, separate from booking approval.
- Venue discovery, recommendations, venue details, and conflict alternatives.
- Booking management, admin review, venue management, calendar, and analytics.
