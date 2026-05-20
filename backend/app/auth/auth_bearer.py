from fastapi import Request
from fastapi.security import HTTPBearer
from fastapi import HTTPException
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError
from dotenv import load_dotenv
import os

load_dotenv()

# BUG FIX 7: auth_bearer.py imported SECRET_KEY/ALGORITHM from auth_handler 
# but then immediately re-declared them as local vars from env — the import was dead code.
# Now only reads from env (consistent with jwt_handler).
SECRET_KEY = os.getenv("SECRET_KEY", "changeme_use_a_real_secret_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

class JWTBearer(HTTPBearer):

    async def __call__(self, request: Request):
        credentials = await super().__call__(request)
        token = credentials.credentials

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except ExpiredSignatureError:
            # BUG FIX 8: Distinguish expired vs invalid token for better UX
            raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
        except JWTError:
            raise HTTPException(status_code=403, detail="Invalid token")