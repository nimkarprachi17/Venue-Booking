const displayValue = (...values) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() || 'Not provided';

export function getAuthorizationSpecifications(request) {
  const details = request?.details || {};
  const user = request?.user || {};
  const normalizedDetailsName = String(details.name || '').trim().toLocaleLowerCase();
  const normalizedUserName = String(user.name || '').trim().toLocaleLowerCase();
  const legacyName = normalizedDetailsName && normalizedDetailsName !== normalizedUserName
    ? details.name
    : '';

  if (request?.type === 'Class Representative') {
    return [
      ['Year', displayValue(details.year, user.year)],
      ['Branch', displayValue(details.branch, user.branch, details.department)],
      ['Class', displayValue(details.className, user.className, legacyName)],
    ];
  }

  return [
    ['Club', displayValue(details.clubName, user.clubName, legacyName)],
    ['Position', displayValue(details.position, user.position)],
  ];
}
