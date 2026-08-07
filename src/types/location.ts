export interface LocationPayload {
  'spi:refobject'?: string;
  'spi:key1'?: string;
  'spi:key2'?: string;
  'spi:longitude': number;
  'spi:latitude': number;
  'spi:altitude': number | null;
  'spi:locationaccuracy': number;
  'spi:altitudeaccuracy'?: number;
  'spi:heading'?: number | null;
  'spi:speed'?: number | null;
  'spi:lastupdate'?: string;
  'spi:wonum'?: string;
  'spi:siteid'?: string;
  'spi:rowstamp'?: string;
  'spi:key3'?: string;
  'spi:orgid'?: string;
}

export interface UserConfig {
  employeeId: string;
  apiBaseUrl: string;
  authToken: string;
}
