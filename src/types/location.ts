export interface LocationPayload {
  tripnum?: string;
  deviceid?: string;
  personid?: string;
  latitudey?: number;
  longitudex?: number;
  latitudeysnap?: number | null;
  longitudexsnap?: number | null;
  accuracy?: number;
  createdate?: string;
  tpltriptrackid?: number;
  rowstamp?: string;
}

export interface UserConfig {
  employeeId: string;
  apiBaseUrl: string;
  authToken: string;
  interval?: string;
  tripId?: string;
  orgid?: string;
}
