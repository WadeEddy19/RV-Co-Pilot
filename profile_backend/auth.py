# Auth0 JWT verification helpers
# Provides a Flask decorator (require_auth) to protect routes using Auth0 JWT authentication
import os
import time
import requests
from functools import wraps
from jose import jwt
from jose.utils import base64url_decode

AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]     
NAMESPACE = "https://rv-copilot-api/"
AUTH0_AUDIENCE = os.environ["AUTH0_AUDIENCE"] 
ALGORITHMS = ["RS256"]

_JWKS_CACHE = {"jwks": None, "fetched_at": 0}
JWKS_TTL_SECONDS = 3600  # refresh hourly

def _fetch_jwks(force_refresh: bool = False):
    now = time.time()

    if (
        not force_refresh
        and _JWKS_CACHE["jwks"] is not None
        and (now - _JWKS_CACHE["fetched_at"]) < JWKS_TTL_SECONDS
    ):
        return _JWKS_CACHE["jwks"]

    jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    r = requests.get(jwks_url, timeout=10)
    r.raise_for_status()

    _JWKS_CACHE["jwks"] = r.json()
    _JWKS_CACHE["fetched_at"] = now
    return _JWKS_CACHE["jwks"]

def _build_rsa_key_from_jwk(jwk: dict) -> dict:
    return {
        "kty": jwk["kty"],
        "kid": jwk.get("kid"),
        "use": jwk.get("use", "sig"),
        "n": jwk["n"],
        "e": jwk["e"],
    }

def require_auth(fn):
    @wraps(fn)
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

        # Try cached JWKS
        jwks = _fetch_jwks(force_refresh=False)
        jwk = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        #If not found, refresh JWKS
        if not jwk:
            jwks = _fetch_jwks(force_refresh=True)
            jwk = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        if not jwk:
            return jsonify({"error": "Unable to find signing key"}), 401

        rsa_key = _build_rsa_key_from_jwk(jwk)

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
        return fn(*args, **kwargs)

    return wrapper
