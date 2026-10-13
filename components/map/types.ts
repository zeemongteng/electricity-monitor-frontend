export interface MapLocation {
  id: number
  name: string
  address: string | null
  type: string
  lat: number
  lng: number
  deviceCount: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface LatLng {
  lat: number
  lng: number
}
