from flask import Blueprint, request, jsonify
from models.trip import Trip
from bson import ObjectId
from datetime import datetime

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

@trip_bp.route('/trips/<trip_id>', methods=['PATCH'])
def edit_trip(trip_id):
    query = {"_id":ObjectId(trip_id)}
    data = request.get_json()

    update_data = {}

    if 'name' in data:
        update_data['name'] = data['name']

    if 'campsite_ids' in data:
        update_data['campsite_ids'] = data['campsite_ids']
    
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    update_data['updated_at'] = datetime.utcnow()

    result = db.trips.update_one(
        query,
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Trip not found"}), 404

    updated_trip = db.trips.find_one({"_id": ObjectId(trip_id)})
    updated_trip['_id'] = str(updated_trip['_id'])

    return jsonify(updated_trip), 200

@trip_bp.route('/trips', methods=['GET'])
def get_trips():
    trips = list(db.trips.find({}))

    for trip in trips:
        trip['_id'] = str(trip['_id'])
    return jsonify(trips), 200

@trip_bp.route('/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    query = {"_id":ObjectId(trip_id)}
    trip = db.trips.find_one(query)

    if not trip:
        return jsonify({"error": "Trip not found!"}), 404
    
    trip['_id'] = str(trip['_id'])
    return jsonify(trip), 200

# @trip_bp.route('/trips/<trip_id>', methods=['DELETE'])
# def delete_trip(trip_id):
#     query = {"_id":ObjectId(trip_id)}
#     result = db.trips.update_one(
#         query,
#         {"$set": {"is_deleted": True}}
#     )
#     if result.matched_count == 0:
#         return jsonify({"error": "Trip not found"}), 404
    
#     return "", 204
