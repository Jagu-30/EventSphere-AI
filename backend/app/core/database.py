from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
import redis.asyncio as aioredis
from app.core.config import settings

# Async engine for PostgreSQL / SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
    )
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        future=True,
        pool_size=20,
        max_overflow=10,
    )

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Relational base mapper class
Base = declarative_base()


# Database session dependency for FastAPI endpoints
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# In-memory Redis fallback mock for development environments without running Redis servers
class MockRedis:
    def __init__(self):
        self.store = {}
        
    async def get(self, key: str):
        return self.store.get(key)
        
    async def set(self, key: str, value: str, ex=None, px=None, nx=False, xx=False):
        if nx and key in self.store:
            return False
        if xx and key not in self.store:
            return False
        self.store[key] = str(value)
        return True
        
    async def delete(self, *keys):
        count = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                count += 1
        return count
        
    async def aclose(self):
        pass


# Async Redis pool connection client setup
async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    try:
        client = aioredis.from_url(
            settings.REDIS_URL, 
            decode_responses=True, 
            socket_connect_timeout=2.0
        )
        # Ping connection to verify it's active
        await client.ping()
        yield client
        await client.aclose()
    except Exception:
        # Fallback to local MockRedis if active Redis connection fails
        yield MockRedis()

