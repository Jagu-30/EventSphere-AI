import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger("auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# --- Pydantic Schemas ---
class UserRegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.CUSTOMER


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenResponseSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponseSchema(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# --- Helpers ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to retrieve the logged-in user from the JWT access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


# --- Endpoints ---
@router.post("/register", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegisterSchema, db: AsyncSession = Depends(get_db)):
    """Register a new customer, organizer, or admin."""
    # Check if user already exists
    existing_user_result = await db.execute(select(User).where(User.email == user_data.email))
    if existing_user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_pwd = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pwd,
        role=user_data.role,
        is_active=True,
        is_verified=False,
    )
    
    db.add(new_user)
    await db.flush()  # assign database primary key
    logger.info(f"Registered user: {new_user.email} (ID: {new_user.id})")
    
    # Return user model
    return new_user


@router.post("/login", response_model=TokenResponseSchema)
async def login(login_data: UserLoginSchema, db: AsyncSession = Depends(get_db)):
    """Authenticate credentials and return OAuth2 JWT Access/Refresh tokens."""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Issue tokens
    token_payload = {"sub": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_payload)
    refresh_token = create_refresh_token(data=token_payload)
    
    logger.info(f"User login successful: {user.email}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenResponseSchema)
async def refresh_tokens(refresh_token: str, db: AsyncSession = Depends(get_db)):
    """Generate a new set of Access/Refresh tokens using a valid refresh token."""
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
        
    email: str = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token is invalid",
        )
        
    token_payload = {"sub": user.email, "role": user.role.value}
    new_access = create_access_token(data=token_payload)
    new_refresh = create_refresh_token(data=token_payload)
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponseSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return current_user


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordSchema, db: AsyncSession = Depends(get_db)):
    """Request a password reset link (simulated logic)."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        # Generate token
        reset_token = create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=timedelta(hours=1))
        # Simulated dispatch
        logger.info(f"Generated password reset token for {user.email}: {reset_token}")
        print(f"[MAIL DISPATCH] Reset Link: http://localhost:3000/auth/reset-password?token={reset_token}")
        
    return {"message": "If the email exists, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordSchema, db: AsyncSession = Depends(get_db)):
    """Reset user password using the reset token."""
    payload = decode_token(data.token)
    if payload is None or payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
        
    email = payload.get("sub")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    user.password_hash = get_password_hash(data.new_password)
    await db.flush()
    logger.info(f"Password reset completed for: {user.email}")
    return {"message": "Password reset successfully."}
