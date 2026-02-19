import os
import time
import traceback
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from db import get_conn
from auth import require_auth, NAMESPACE, AUTH0_DOMAIN
from R2 import create_avatar_upload_urls

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": os.environ.get("CORS_ORIGINS", "http://localhost:8081")}},
    allow_headers=["Content-Type", "Authorization"],
)


# helper functions
_USERINFO_CACHE = {}  
_USERINFO_TTL_SECONDS = 300 


def _get_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def _fetch_userinfo(token: str) -> dict:
    now = time.time()
    cached = _USERINFO_CACHE.get(token)
    if cached and cached[0] > now:
        return cached[1]

    url = f"https://{AUTH0_DOMAIN}/userinfo"
    r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)

    if r.status_code != 200:
        raise RuntimeError(f"/userinfo failed: {r.status_code} {r.text}")

    data = r.json()
    _USERINFO_CACHE[token] = (now + _USERINFO_TTL_SECONDS, data)
    return data


def _identity_from_request() -> dict:
    # If require_auth succeeded, it set request.auth_payload
    payload = getattr(request, "auth_payload", None)
    if payload:
        sub = payload.get("sub")
        name = payload.get(f"{NAMESPACE}name") or payload.get("name")
        email = payload.get(f"{NAMESPACE}email") or payload.get("email")
        return {"sub": sub, "name": name, "email": email}

    # Otherwise use /userinfo based on the token
    token = _get_bearer_token()
    if not token:
        raise RuntimeError("Missing Bearer token")

    ui = _fetch_userinfo(token)
    # Auth0 userinfo typically returns: sub, name, nickname, email, picture, etc.
    sub = ui.get("sub")
    name = ui.get("name") or ui.get("nickname")
    email = ui.get("email")
    return {"sub": sub, "name": name, "email": email}


def upsert_user_minimal(sub: str, name: str | None, email: str | None) -> str:
    if not sub:
        raise RuntimeError("Auth identity missing sub")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                (sub, name, email),
            )
            auth0_sub = cur.fetchone()[0]
        conn.commit()

    return auth0_sub


# profile endpoint
@app.get("/api/profile")
def get_profile():
    try:
        try:
            pass
        except Exception:
            pass

        # identity via JWT, else /userinfo 
        identity = _identity_from_request()
        sub = identity["sub"]
        name = identity.get("name")
        email = identity.get("email")

        auth0_sub = upsert_user_minimal(sub, name, email)

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "select auth0_sub, name, email, avatar_url, created_at, last_login_at from users where auth0_sub=%s;",
                    (auth0_sub,),
                )
                user = cur.fetchone()

                cur.execute(
                    "select campsite_id, created_at from saved_locations where auth0_sub=%s order by created_at desc;",
                    (auth0_sub,),
                )
                saved = [{"campsite_id": r[0], "created_at": r[1].isoformat()} for r in cur.fetchall()]

                cur.execute(
                    "select id, note, created_at from user_notes where auth0_sub=%s order by created_at desc;",
                    (auth0_sub,),
                )
                notes = [{"id": r[0], "note": r[1], "created_at": r[2].isoformat()} for r in cur.fetchall()]

        return jsonify({
            "user": {
                "auth0_sub": user[0],
                "name": user[1],
                "email": user[2],
                "avatar_url": user[3],
                "created_at": user[4].isoformat(),
                "last_login_at": user[5].isoformat(),
            },
            "saved_locations": saved,
            "notes": notes
        })

    except Exception as e:
        print("/api/profile failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# avatar enpoint for uploading.
@app.post("/api/r2/avatar-upload-url")
def avatar_upload_url():
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        body = request.get_json(force=True) or {}
        content_type = body.get("content_type")
        file_size = body.get("file_size_bytes")

        if not content_type:
            return jsonify({"error": "content_type is required"}), 400

        upload_url, public_url, object_key = create_avatar_upload_urls(
            auth0_sub=auth0_sub,
            content_type=content_type,
            file_size_bytes=file_size,
        )

        return jsonify({"upload_url": upload_url, "public_url": public_url, "object_key": object_key})

    except Exception as e:
        print("/api/r2/avatar-upload-url failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.post("/api/profile/avatar")
def set_avatar_url():
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        body = request.get_json(force=True) or {}
        avatar_url = body.get("avatar_url")
        if not avatar_url:
            return jsonify({"error": "avatar_url is required"}), 400

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "update users set avatar_url = %s where auth0_sub = %s;",
                    (avatar_url, auth0_sub),
                )
            conn.commit()

        return jsonify({"ok": True, "avatar_url": avatar_url})

    except Exception as e:
        print("/api/profile/avatar failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# saved locations endpoint
@app.post("/api/saved-locations")
def add_saved_location():
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        body = request.get_json(force=True) or {}
        campsite_id = body.get("campsite_id")
        if not campsite_id:
            return jsonify({"error": "campsite_id is required"}), 400

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    insert into saved_locations (auth0_sub, campsite_id, created_at)
                    values (%s, %s, now())
                    on conflict (auth0_sub, campsite_id) do nothing;
                    """,
                    (auth0_sub, campsite_id),
                )
            conn.commit()

        return jsonify({"ok": True})

    except Exception as e:
        print("/api/saved-locations failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.delete("/api/saved-locations/<campsite_id>")
def delete_saved_location(campsite_id: str):
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "delete from saved_locations where auth0_sub = %s and campsite_id = %s;",
                    (auth0_sub, campsite_id),
                )
            conn.commit()

        return jsonify({"ok": True})

    except Exception as e:
        print("delete saved location failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# notes endpoint 
@app.post("/api/notes")
def add_note():
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        body = request.get_json(force=True) or {}
        note = body.get("note")
        if not note:
            return jsonify({"error": "note is required"}), 400

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    (auth0_sub, note),
                )
                note_id = cur.fetchone()[0]
            conn.commit()

        return jsonify({"ok": True, "note_id": note_id})

    except Exception as e:
        print("/api/notes failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.delete("/api/notes/<int:note_id>")
def delete_note(note_id: int):
    try:
        identity = _identity_from_request()
        auth0_sub = upsert_user_minimal(identity["sub"], identity.get("name"), identity.get("email"))

        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "delete from user_notes where auth0_sub = %s and id = %s;",
                    (auth0_sub, note_id),
                )
            conn.commit()

        return jsonify({"ok": True})

    except Exception as e:
        print("delete note failed:", repr(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
