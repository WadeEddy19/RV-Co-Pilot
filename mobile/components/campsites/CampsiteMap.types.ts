export type CampsiteMapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  campsiteType?: string | null;
  amenities?: string[] | null;
  notes?: string | null;
};
