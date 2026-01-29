from datetime import datetime

class Campsite:
    """
    Represents a campsite with various attributes. Mirrored from the Trips.py structure
    
    """
    def __init__(self, campsite_id, name, latitude, longitude, campsite_type=None, amenities=None, notes=None, is_private=False, creator_id=None):
        self.campsite_id = campsite_id
        self.name = name
        self.latitude = latitude
        self.longitude = longitude
        self.campsite_type = campsite_type
        self.amenities = amenities
        self.notes = notes
        self.is_private = is_private
        self.creator_id = creator_id
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "campsite_id": self.campsite_id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "campsite_type": self.campsite_type,
            "amenities": self.amenities,
            "notes": self.notes,
            "is_private": self.is_private,
            "creator_id": self.creator_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
