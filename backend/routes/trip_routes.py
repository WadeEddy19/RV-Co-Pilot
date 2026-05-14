from flask import Blueprint, request, jsonify
from models.trip import Trip
from bson import ObjectId
from datetime import datetime
import base64
import json

# Create Blueprint for trip routes
trip_bp = Blueprint('trips', __name__)

# db object passed in from app.py
db = None
# Changed from init_routes to init_trips_routes
def init_trips_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database


def _get_user_sub_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    parts = token.split('.')
    if len(parts) < 2:
        return None
    try:
        payload_b64 = parts[1] + '=' * (-len(parts[1]) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        return payload.get('sub')
    except Exception:
        return None


@trip_bp.route('/trips', methods=['POST'])
def create_trip():
    data = request.get_json() or {}

    # use the token's user if present so you can't make a trip for someone else
    token_sub = _get_user_sub_from_token()
    user_id = token_sub or data.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    if 'name' not in data:
        return jsonify({"error": "Missing trip name"}), 400

    new_trip = Trip(
        user_id=user_id,
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
    query = {"_id": ObjectId(trip_id), "is_deleted": {"$ne": True}}
    data = request.get_json()

    # only the owner can edit (when a token is sent)
    token_sub = _get_user_sub_from_token()
    if token_sub:
        existing = db.trips.find_one(query)
        if not existing:
            return jsonify({"error": "Trip not found"}), 404
        if existing.get('user_id') != token_sub:
            return jsonify({"error": "Forbidden"}), 403

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
    trips = list(db.trips.find({"is_deleted": {"$ne": True}}))

    for trip in trips:
        trip['_id'] = str(trip['_id'])
    return jsonify(trips), 200

@trip_bp.route('/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    query = {"_id": ObjectId(trip_id), "is_deleted": {"$ne": True}}
    trip = db.trips.find_one(query)

    if not trip:
        return jsonify({"error": "Trip not found!"}), 404

    trip['_id'] = str(trip['_id'])
    return jsonify(trip), 200

@trip_bp.route('/trips/user/<user_id>', methods=['GET'])
def get_trips_by_user(user_id):
    # if a token is present, return that user's trips regardless of the URL
    # (so you can't grab someone else's by changing the path)
    token_sub = _get_user_sub_from_token()
    effective_user_id = token_sub or user_id

    trips = list(db.trips.find({"user_id": effective_user_id, "is_deleted": {"$ne": True}}))

    for trip in trips:
        trip['_id'] = str(trip['_id'])

    return jsonify(trips), 200

@trip_bp.route('/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    query = {"_id":ObjectId(trip_id)}

    # only the owner can delete (when a token is sent)
    token_sub = _get_user_sub_from_token()
    if token_sub:
        existing = db.trips.find_one(query)
        if not existing:
            return jsonify({"error": "Trip not found"}), 404
        if existing.get('user_id') != token_sub:
            return jsonify({"error": "Forbidden"}), 403

    result = db.trips.update_one(
        query,
        {"$set": {"is_deleted": True}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Trip not found"}), 404

    return "", 204
