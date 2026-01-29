// Contains static data for campsite display
import type {Campsite} from "@/src/types/Campsite";

export const mockCampsites: Campsite[] =[
    {
        id: "a001",
        name: "Wade's mock campsite",
        latitude: 45,
        longitude: 24,
        type: "dispersed",
        amenities: ["parking", "bathroom", "shower"],
        notes: "It is a very nice place with beautiful views and great weather most of the year",
        isPrivate: false,
    
    },
    {
        id: "a002",
        name: "Wade's mock campsite 2",
        latitude: 45,
        longitude: 24,
        type: "RV Parking",
        amenities: ["parking"],
        notes: "It is just a plain lot with a bunch of parking for RVs and nothing else",
        isPrivate: false,
    
    }
];