import os
import time
import requests
from functools import wraps
from jose import jwt

AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]
AUTH0_AUDIENCE = os.environ["AUTH0_AUDIENCE"]
ALGORITHMS = ["RS256"]

NAMESPACE = os.environ.get("AUTH0_NAMESPACE", "https://rv-copilot-api/")

_JWKS_CACHE = {"jwks": None, "fetched_at": 0}
JWKS_TTL_SECONDS = 3600

def _fetch_jwks(force_refresh: bool = False):
    now = time.time()
    if (
        not force_refresh
        and _JWKS_CACHE["jwks"] is not None
        and (now - _JWKS_CACHE["fetched_at"]) < JWKS_TTL_SECONDS
    ):
        return _JWKS_CACHE["jwks"]

    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    _JWKS_CACHE["jwks"] = r.json()
    _JWKS_CACHE["fetched_at"] = now
    return _JWKS_CACHE["jwks"]

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        from flask import request, jsonify

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing Bearer token"}), 401

        token = auth_header.split(" ", 1)[1].strip()

        try:
            unverified_header = jwt.get_unverified_header(token)
        except Exception:
            return jsonify({"error": "Invalid token header"}), 401

        kid = unverified_header.get("kid")
        if not kid:
            return jsonify({"error": "Token missing kid"}), 401

        jwks = _fetch_jwks(False)
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        if not key:
            jwks = _fetch_jwks(True)
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        if not key:
            return jsonify({"error": "Unable to find signing key"}), 401

        rsa_key = {"kty": key["kty"], "kid": key.get("kid"), "n": key["n"], "e": key["e"]}

        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=AUTH0_AUDIENCE,
                issuer=f"https://{AUTH0_DOMAIN}/",
            )
        except Exception as e:
            return jsonify({"error": "Invalid token", "details": str(e)}), 401

        request.auth_payload = payload
        return f(*args, **kwargs)

    return wrapper
