
from functools import lru_cache

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from .config import SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in backend/.env"
        )

    return create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is missing. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        response = get_supabase_client().auth.get_user(token)
        user = response.user

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid session. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {"id": str(user.id), "email": user.email}

    except HTTPException:
        raise
    except Exception as exc:
        # Log the underlying exception on the backend during debugging,
        # but do not expose token or provider internals to the browser.
        print(f"Supabase token verification failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=401,
            detail="Supabase rejected your session. Sign out and sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
