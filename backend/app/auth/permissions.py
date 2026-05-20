from fastapi import HTTPException


def require_role(
    current_user,
    allowed_roles
):

    if current_user["role"] not in allowed_roles:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )