// Contains the structure for a campsite
export type Campsite = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    type: string;
    amenities: string[];
    notes?: string;
    isPrivate?: boolean;
};