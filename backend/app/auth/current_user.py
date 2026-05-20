from fastapi import Depends

from app.auth.auth_bearer import JWTBearer


def get_current_user(
    user=Depends(JWTBearer())
):

    return user