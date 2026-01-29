# flask server, Exposes profile management endpoints, uses auth and db modules, handles CORS, loads env vars. 

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
from routes.profile import profile_bp


from db import get_conn
from auth import NAMESPACE, require_auth



app = Flask(__name__)

app.register_blueprint(profile_bp)

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:8081")

CORS(
    app,
    resources={r"/*": {"origins": cors_origins}},
    allow_headers=["Content-Type", "Authorization"],
)

def upsert_user(auth0_sub: str, email: str | None):
    """
    Ensures a user exists in `users` and has a row in `user_profiles`.
    Returns internal user_id.
    """
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into users (auth0_sub, email, last_login_at)
                """,
                (auth0_sub, email),
            )
            user_id = cur.fetchone()[0]

            cur.execute("select id from user_profiles where user_id=%s;", (user_id,))
            if cur.fetchone() is None:
                cur.execute("insert into user_profiles (user_id) values (%s);", (user_id,))

            return user_id

@app.get("/authorized")
@require_auth
def authorized():
    return "Secured Resource"

@app.get("/api/profile")
@require_auth
def profile():
    payload = request.auth_payload
    auth0_sub = payload["sub"]

    email = payload.get(f"{NAMESPACE}email")
    name  = payload.get(f"{NAMESPACE}name")
    user_id = upsert_user(auth0_sub, email, name)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select display_name, avatar_url, home_city, default_lat, default_lng
                from user_profiles
                """,
                (user_id,),
            )
            p = cur.fetchone() or (None, None, None, None, None)

            cur.execute(
                """
                select campsite_id
                from saved_locations
                """,
                (user_id,),
            )
            saved_locations = [r[0] for r in cur.fetchall()]

            cur.execute(
                """
                select id, campsite_id, note, created_at
                from user_notes
                """,
                (user_id,),
            )
            notes = [
                {
                    "id": r[0],
                    "campsite_id": r[1],
                    "note": r[2],
                    "created_at": r[3].isoformat() if r[3] else None,
                }
                for r in cur.fetchall()
            ]

    return jsonify({
        "user": {"auth0_sub": auth0_sub, "email": email},
        "profile": {
            "display_name": p[0],
            "avatar_url": p[1],
            "home_city": p[2],
            "default_lat": p[3],
            "default_lng": p[4],
        },
        "saved_locations": saved_locations,
        "notes": notes,
    })

@app.post("/api/saved-locations")
@require_auth
def add_saved_location():
    payload = request.auth_payload

    email = payload.get(f"{NAMESPACE}email")
    name  = payload.get(f"{NAMESPACE}name")
    user_id = upsert_user(payload["sub"], email, name)

    body = request.get_json(force=True)
    campsite_id = body.get("campsite_id")
    if not campsite_id:
        return jsonify({"error": "campsite_id is required"}), 400

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into saved_locations (user_id, campsite_id)
                """,
                (user_id, campsite_id),
            )

    return jsonify({"ok": True})

@app.post("/api/notes")
@require_auth
def add_note():
    payload = request.auth_payload
    
    email = payload.get(f"{NAMESPACE}email")
    name  = payload.get(f"{NAMESPACE}name")
    user_id = upsert_user(payload["sub"], email, name)

    body = request.get_json(force=True)
    note = body.get("note")
    campsite_id = body.get("campsite_id")

    if not note:
        return jsonify({"error": "note is required"}), 400

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into user_notes (user_id, campsite_id, note)
                """,
                (user_id, campsite_id, note),
            )
            note_id = cur.fetchone()[0]

    return jsonify({"ok": True, "note_id": note_id})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
