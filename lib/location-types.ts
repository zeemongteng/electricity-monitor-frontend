export const LOCATION_TYPES = ['dorm', 'apartment', 'condo', 'house'] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  dorm: 'Dormitory',
  apartment: 'Apartment',
  condo: 'Condominium',
  house: 'House',
}

export function typeLabel(type: string) {
  return LOCATION_TYPE_LABEL[type as LocationType] ?? type
}
