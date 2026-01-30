# profile enpoints and helpers for user profile management 
# creates and updates user and user_profile records on login 
# returns user profile data after authentication. 
from flask import Blueprint, request, jsonify
from auth import NAMESPACE, require_auth
from db import get_conn

profile_bp = Blueprint("profile", __name__)

def upsert_user(auth0_sub: str, email: str | None, name: str | None = None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (auth0_sub, email, last_login_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (auth0_sub)
                DO UPDATE SET
                    email = COALESCE(excluded.email, users.email),
                    last_login_at = NOW()
                RETURNING id;
                """,
                (auth0_sub, email),
            )
            user_id = cur.fetchone()[0]

            # Check if profile exists
            cur.execute("SELECT id FROM user_profiles WHERE user_id = %s;", (user_id,))
            profile_exists = cur.fetchone() is not None

            if not profile_exists:
                # Create and set display name if provided
                insert_sql = "INSERT INTO user_profiles (user_id"
                values = [user_id]
                params = []
                if name:
                    insert_sql += ", display_name"
                    params.append(name)
                insert_sql += ") VALUES (%s" + (", %s" if name else "") + ");"
                values.extend(params)
                cur.execute(insert_sql, tuple(values))
            elif name:
                cur.execute(
                    "UPDATE user_profiles SET display_name = %s WHERE user_id = %s;",
                    (name, user_id)
                )

            conn.commit()
            return user_id

@profile_bp.get("/api/profile")
@require_auth
def get_profile():
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
                where user_id=%s;
                """,
                (user_id,),
            )
            profile = cur.fetchone()

    return jsonify({
        "auth0_sub": auth0_sub,
        "email": email,
        "profile": {
            "display_name": profile[0] if profile else None,
            "avatar_url": profile[1] if profile else None,
            "home_city": profile[2] if profile else None,
            "default_lat": profile[3] if profile else None,
            "default_lng": profile[4] if profile else None,
        },
    })
