from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "changeme_use_a_real_secret_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def create_access_token(data: dict):
    to_encode = data.copy()
    # BUG FIX 6: Token expiry was 30 minutes (too short), now reads from env
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token