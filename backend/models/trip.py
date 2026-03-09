from datetime import datetime

class Trip:
    def __init__(self, user_id, name, campsite_ids=None):
        self.user_id = user_id
        self.name = name
        self.campsite_ids = campsite_ids if campsite_ids else []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.is_deleted = False

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "campsite_ids": self.campsite_ids,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_deleted": self.is_deleted
        }
