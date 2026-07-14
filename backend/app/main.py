import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.models import User, UserRole, Venue, Event, Show
from app.core.security import get_password_hash
from app.routers import auth, events
from sqlalchemy import select
from datetime import datetime, timedelta

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("main")


async def seed_database():
    """Seed initial demo users, venues, and events if database is empty."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # 1. Seed Roles/Users
            user_check = await session.execute(select(User).limit(1))
            if user_check.scalar_one_or_none():
                logger.info("Database already seeded, skipping seed step.")
                return

            logger.info("Database is empty. Seeding initial development values...")
            
            admin_pwd = get_password_hash("adminpassword")
            org_pwd = get_password_hash("organizerpassword")
            cust_pwd = get_password_hash("customerpassword")

            admin_user = User(name="System Admin", email="admin@eventsphere.ai", password_hash=admin_pwd, role=UserRole.ADMIN, is_verified=True)
            org_user = User(name="Metro Events", email="organizer@eventsphere.ai", password_hash=org_pwd, role=UserRole.ORGANIZER, is_verified=True)
            cust_user = User(name="John Doe", email="customer@eventsphere.ai", password_hash=cust_pwd, role=UserRole.CUSTOMER, is_verified=True)

            session.add_all([admin_user, org_user, cust_user])
            await session.flush() # get user IDs

            # 2. Seed Venues
            v1 = Venue(name="Metro Arena", address="Metro Arena, San Francisco", capacity=15000)
            v2 = Venue(name="Convention Center", address="Convention Center, Austin", capacity=5000)
            v3 = Venue(name="Stadium of Light", address="Stadium of Light, Los Angeles", capacity=50000)
            v4 = Venue(name="Palace Theater", address="Palace Theater, New York", capacity=2500)

            session.add_all([v1, v2, v3, v4])
            await session.flush() # get venue IDs

            # 3. Seed Events & Shows
            now = datetime.utcnow()
            e1 = Event(
                title="Neon Horizon Music Festival 2026",
                description="The ultimate outdoor visual and audio electronic dance experience.",
                banner_image="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
                category="Concerts",
                start_time=now + timedelta(days=30),
                end_time=now + timedelta(days=30, hours=8),
                venue_id=v1.id,
                organizer_id=org_user.id,
                status="active"
            )
            e2 = Event(
                title="Global AI Developer Summit",
                description="Annual gathering of engineers shaping tomorrow's artificial intelligence systems.",
                banner_image="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
                category="Conferences",
                start_time=now + timedelta(days=45),
                end_time=now + timedelta(days=47),
                venue_id=v2.id,
                organizer_id=org_user.id,
                status="active"
            )
            e3 = Event(
                title="World Football Championship Final",
                description="Clash of the continental giants for the ultimate football trophy.",
                banner_image="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
                category="Sports",
                start_time=now + timedelta(days=60),
                end_time=now + timedelta(days=60, hours=3),
                venue_id=v3.id,
                organizer_id=org_user.id,
                status="active"
            )
            e4 = Event(
                title="Vanguard Cinema Premiere: Shadows in the Grid",
                description="Independent sci-fi film premiere screening and exclusive Q&A session.",
                banner_image="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
                category="Cinema",
                start_time=now + timedelta(days=12),
                end_time=now + timedelta(days=12, hours=2.5),
                venue_id=v4.id,
                organizer_id=org_user.id,
                status="active"
            )

            session.add_all([e1, e2, e3, e4])
            await session.flush() # get event IDs

            # Add Shows
            s1 = Show(event_id=e1.id, start_time=e1.start_time, end_time=e1.end_time, price_multiplier=1.00)
            s2 = Show(event_id=e2.id, start_time=e2.start_time, end_time=e2.end_time, price_multiplier=1.00)
            s3 = Show(event_id=e3.id, start_time=e3.start_time, end_time=e3.end_time, price_multiplier=1.00)
            s4 = Show(event_id=e4.id, start_time=e4.start_time, end_time=e4.end_time, price_multiplier=1.00)
            
            session.add_all([s1, s2, s3, s4])

            logger.info("Database seeding completed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events to handle DB initialization and teardown pools."""
    logger.info("Initializing database schemas...")
    async with engine.begin() as conn:
        if settings.ENVIRONMENT in ["development", "testing"]:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified.")
    
    if settings.ENVIRONMENT in ["development", "testing"]:
        await seed_database()
        
    yield
    logger.info("Cleaning up resource connections...")
    await engine.dispose()
    logger.info("Shutdown sequence complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Event Ticket Booking & Management Platform API Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend domains in staging/production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rate Limiting Middleware (Simple Redis-backed Rate Limiter placeholder)
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Custom middleware monitoring request traffic for rate-limit rules."""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} finished in {duration:.4f}s with status {response.status_code}"
    )
    return response


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Attach routers under the /api namespaces
app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    """System health endpoint verifying API operation."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "project": settings.PROJECT_NAME,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
