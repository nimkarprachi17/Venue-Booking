export const venueFacilityOptions = [
  ['projector', 'Projector'],
  ['display', 'Display screen'],
  ['ac', 'Air conditioning'],
  ['microphone', 'Microphone'],
  ['soundSystem', 'Sound system'],
  ['paSystem', 'PA system'],
  ['stage', 'Stage'],
  ['podium', 'Podium'],
  ['whiteboard', 'Whiteboard'],
  ['wifi', 'Wi-Fi'],
  ['computers', 'Computers / workstations'],
  ['videoConferencing', 'Video conferencing'],
  ['accessible', 'Step-free access'],
];

const facilityLabels = new Map(venueFacilityOptions);

export function normalizeVenue(venue) {
  const id = String(venue?._id || venue?.id || '');
  return {
    ...venue,
    _id: id,
    location: venue?.location || '',
    building: venue?.location || '',
    capacity: Number(venue?.capacity) || 0,
    facilities: Array.isArray(venue?.facilities) ? venue.facilities : [],
    description: venue?.description || '',
    imageUrl: venue?.imageUrl || '',
    isActive: venue?.isActive !== false,
  };
}

export function getFacilityLabel(facility) {
  return facilityLabels.get(facility) || facility;
}
