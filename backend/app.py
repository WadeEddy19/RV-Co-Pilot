from flask import Flask
from pymongo import MongoClient
from dotenv import load_dotenv
from routes.trip_routes import trip_bp, init_trips_routes
from routes.campsite_routes import campsite_bp, init_campsites_routes
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

app = Flask(__name__)

init_trips_routes(db)
app.register_blueprint(trip_bp, url_prefix='/api')
init_campsites_routes(db)
app.register_blueprint(campsite_bp, url_prefix='/api')

# Check endpoint - http://localhost:5000/ to verify backend is running
@app.route('/')
def home():
    return {"message": "RV Co-Pilot Backend is running!"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)