from functools import lru_cache

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from .config import SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise RuntimeError("Supabase environment variables are missing")

    return create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please sign in")

    try:
        response = get_supabase_client().auth.get_user(credentials.credentials)
        user = response.user

        if user is None:
            raise ValueError("No user returned")

        return {"id": str(user.id), "email": user.email}
    except Exception as exc:
        raise HTTPException(
            status_code=401,
            detail="Your session is invalid or expired. Please sign in again.",
        ) from exc