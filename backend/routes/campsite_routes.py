from flask import Blueprint, request, jsonify
from models.campsite import Campsite
from bson import ObjectId
from datetime import datetime

# Create Blueprint for campsite routes
campsite_bp = Blueprint('campsites', __name__)

# db object passed in from app.py
db = None

def init_campsites_routes(database):
    """Initialize routes with database connection"""
    global db
    db = database

@campsite_bp.route('/campsites', methods=['POST'])
def create_campsite():
    data = request.get_json()
    
    new_campsite = Campsite(
        campsite_id=data['campsite_id'],
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude']
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
    campsites = list(db.campsites.find({}, {"_id": 0}))
    return jsonify(campsites), 200
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