from flask import Blueprint, request, jsonify
from models.trip import Trip
from bson import ObjectId

# Create Blueprint for trip routes
trip_bp = Blueprint('trips', __name__)

# db object passed in from app.py
db = None
# Changed from init_routes to init_trips_routes
def init_trips_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database

@trip_bp.route('/trips', methods=['POST'])
def create_trip():
    data = request.get_json()
    
    new_trip = Trip(
        user_id=data['user_id'],
        name=data['name']
    )
    
    # Convert to dictionary
    trip_dict = new_trip.to_dict()
    
    result = db.trips.insert_one(trip_dict)
    
    # Add the _id to response
    trip_dict['_id'] = str(result.inserted_id)
    
    return jsonify(trip_dict), 201
