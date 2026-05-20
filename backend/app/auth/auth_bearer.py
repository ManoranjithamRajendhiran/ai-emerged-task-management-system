from fastapi import Request
from fastapi.security import HTTPBearer
from fastapi import HTTPException

from jose import jwt
from jose.exceptions import JWTError

from app.auth.auth_handler import (
    SECRET_KEY,
    ALGORITHM
)

import os
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "mysceretkey123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

class JWTBearer(HTTPBearer):

    async def __call__(
        self,
        request: Request
    ):

        credentials = await super().__call__(
            request
        )

        token = credentials.credentials

        try:

            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM]
            )

            return payload

        except JWTError:

            raise HTTPException(
                status_code=403,
                detail="Invalid or expired token"
            )