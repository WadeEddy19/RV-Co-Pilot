from flask import Blueprint, request, jsonify
from models.campsite import Campsite
from bson import ObjectId
from datetime import datetime
import base64
import json

# Assisted by AI tool suggestions; code reviewed and modified by Wade Eddy
# Heavily inspired and adapted from Raiden's work on trips.

# Create Blueprint for campsite routes
campsite_bp = Blueprint('campsites', __name__)

# db object passed in from app.py
db = None

def init_campsites_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database

# Helper copied from trip_routes
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

@campsite_bp.route('/campsites', methods=['POST'])
def create_campsite():
    data = request.get_json()
    
    token_sub = _get_user_sub_from_token()

    new_campsite = Campsite(
        campsite_id=data['campsite_id'],
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        campsite_type=data.get('campsite_type'),
        amenities=data.get('amenities', []),
        notes=data.get('notes'),
        creator_id=token_sub,
    )

    # Convert to dictionary
    campsite_dict = new_campsite.to_dict()
    result = db.campsites.insert_one(campsite_dict)

    # Add the _id to response
    campsite_dict['_id'] = str(result.inserted_id)

    return jsonify(campsite_dict), 201

# Get all campsites
@campsite_bp.route('/campsites', methods=['GET'])
def get_campsites():
    campsites = list(db.campsites.find())
    for campsite in campsites:
        campsite['_id'] = str(campsite['_id'])
    return jsonify(campsites), 200

# EDIT campsite, used trip_routes code and modified to apply to campsites
@campsite_bp.route('/campsites/<campsite_id>', methods=['PATCH'])
def edit_campsite(campsite_id):
    query = {"_id":ObjectId(campsite_id)}

    # Altered from code in trip_routes
    token_sub = _get_user_sub_from_token()
    if token_sub:
        existing = db.campsites.find_one(query)
        if not existing:
            return jsonify({"error": "Campsite not found"}), 404
        if existing.get('creator_id') != token_sub:
            return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    update_data = {}

    if 'name' in data:
        update_data['name'] = data['name']
    
    if 'latitude' in data:
        update_data['latitude'] = data['latitude']

    if 'longitude' in data:
        update_data['longitude'] = data['longitude']
    
    if 'amenities' in data:
        update_data['amenities'] = data['amenities']
    
    if 'campsite_type' in data:
        update_data['campsite_type'] = data['campsite_type']

    if 'notes' in data:
        update_data['notes'] = data['notes']
    
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    update_data['updated_at'] = datetime.utcnow()

    result = db.campsites.update_one(
        query,
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Campsite not found"}), 404

    updated_campsite = db.campsites.find_one({"_id": ObjectId(campsite_id)})
    updated_campsite['_id'] = str(updated_campsite['_id'])

    return jsonify(updated_campsite), 200

# To test with windows:
"""
Invoke-RestMethod -Method Patch `
-Uri "http://127.0.0.1:5000/api/campsites/6997b3a9ede5ab757dc4f59c" `
-ContentType "application/json" `
-Body '{
    "name": "Wade Updated Camp",
    "latitude": 33.8121,
    "longitude": -117.9190,
    "amenities": "Showers, Firewood",
    "campsite_type": "RV Park",
    "notes": "These notes are testing if Wades Edit works for all functions"
}'
"""


# GET single campsite
@campsite_bp.route('/campsites/<id>', methods=['GET'])
def get_single_campsite(id):
    try:
        campsite = db.campsites.find_one({"campsite_id": id})

        if not campsite:
            return jsonify({"error": "Campsite not found"}), 404

        # Convert ObjectId to string for JSON
        campsite["_id"] = str(campsite["_id"])

        return jsonify(campsite), 200

    except:
        return jsonify({"error": "Invalid campsite ID"}), 400

"""
USE THE FOLLOWING TO VIEW ALL CAMPSITES:
Invoke-RestMethod http://127.0.0.1:5000/api/campsites
"""

"""
USED THE FOLLOWING TO ADD CAMPSITE
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5000/api/campsites" `
  -ContentType "application/json" `
  -Body '{"campsite_id":"123","name":"Test Campsite", "latitude":"45", "longitude":"45"}'
"""

# DELETE Campsite
@campsite_bp.route("/campsites/<campsite_id>", methods=["DELETE"])
def delete_campsite(campsite_id):
    try:
        query = {"_id": ObjectId(campsite_id)}
        # Copied From trip_routes
        token_sub = _get_user_sub_from_token()
        if token_sub:
            existing = db.campsites.find_one(query)
            if not existing:
                return jsonify({"error": "Campsite not found"}), 404
            if existing.get('creator_id') != token_sub:
                return jsonify({"error": "Forbidden"}), 403
    except:
        return jsonify({"error": "Invalid Campsite ID"}), 400
    
    result = db.campsites.delete_one(query)

    if result.deleted_count == 0:
        return jsonify({"error": "Campsite not found"}), 404
    
    return jsonify({"message": "Campsite deleted successfully"}), 200

"""
Invoke-RestMethod -Method Delete `
-Uri "http://127.0.0.1:5000/api/campsites/6997b3a9ede5ab757dc4f59c"
"""