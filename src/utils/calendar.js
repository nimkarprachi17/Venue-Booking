import { minutesOf } from './dateTime';

// Places events that overlap in time into separate lanes within a calendar day.
export const getCalendarEventLayout = (bookings) => {
  const events = bookings
    .map((booking) => {
      const [start, end] = booking.time.split(' – ').map(minutesOf);
      return { booking, start, end };
    })
    .sort((first, second) => first.start - second.start || first.end - second.end);

  const clusters = [];
  let cluster = [];
  let clusterEnd = -1;

  events.forEach((event) => {
    if (cluster.length && event.start >= clusterEnd) {
      clusters.push(cluster);
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.end);
  });
  if (cluster.length) clusters.push(cluster);

  const layout = new Map();
  clusters.forEach((group) => {
    const laneEnds = [];
    const assignedEvents = group.map((event) => {
      let column = laneEnds.findIndex((laneEnd) => laneEnd <= event.start);
      if (column === -1) column = laneEnds.length;
      laneEnds[column] = event.end;
      return { ...event, column };
    });

    assignedEvents.forEach(({ booking, column }) => {
      layout.set(booking.id, { column, columns: laneEnds.length });
    });
  });

  return layout;
};

export const getCalendarDisplayStatus = (status) =>
  ['confirmed', 'approved'].includes(String(status).toLowerCase()) ? 'Confirmed' : 'Pending';
