import logging
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Event, Venue, User, UserRole, Show
from app.routers.auth import get_current_user

router = APIRouter(prefix="/events", tags=["Events & Venues"])
logger = logging.getLogger("events")


# --- Pydantic Schemas ---
class VenueCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=2, max_length=255)
    capacity: int = Field(..., gt=0)
    layout_json: Optional[dict[str, Any]] = None


class VenueResponseSchema(BaseModel):
    id: int
    name: str
    address: str
    capacity: int
    layout_json: Optional[dict[str, Any]]

    class Config:
        from_attributes = True


class EventCreateSchema(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    banner_image: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=50)
    start_time: datetime
    end_time: datetime
    venue_id: int
    base_price: float = Field(50.00, gt=0)


class EventResponseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str]
    banner_image: Optional[str]
    category: str
    start_time: datetime
    end_time: datetime
    status: str
    venue_id: int
    organizer_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Venue Endpoints ---
@router.get("/venues", response_model=list[VenueResponseSchema])
async def list_venues(db: AsyncSession = Depends(get_db)):
    """Retrieve list of all registered hosting venues."""
    result = await db.execute(select(Venue).order_by(Venue.name))
    return result.scalars().all()


@router.post("/venues", response_model=VenueResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_venue(
    venue_data: VenueCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Register a new venue. Requires Admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register venues"
        )
        
    new_venue = Venue(
        name=venue_data.name,
        address=venue_data.address,
        capacity=venue_data.capacity,
        layout_json=venue_data.layout_json
    )
    db.add(new_venue)
    await db.flush()
    logger.info(f"Venue created: {new_venue.name} (ID: {new_venue.id})")
    return new_venue


# --- Event Endpoints ---
@router.get("", response_model=list[EventResponseSchema])
async def list_events(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve lists of scheduled events with matching categories or title keywords."""
    query = select(Event).where(Event.status == "active")
    
    if category and category != "All":
        query = query.where(Event.category == category)
        
    if search:
        query = query.where(
            or_(
                Event.title.ilike(f"%{search}%"),
                Event.description.ilike(f"%{search}%")
            )
        )
        
    query = query.order_by(Event.start_time).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=EventResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new event and associate it with a show. Requires Organizer or Admin role."""
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only event organizers can schedule new events"
        )
        
    # Check if venue exists
    venue_result = await db.execute(select(Venue).where(Venue.id == event_data.venue_id))
    venue = venue_result.scalar_one_or_none()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hosting venue not found"
        )
        
    new_event = Event(
        title=event_data.title,
        description=event_data.description,
        banner_image=event_data.banner_image,
        category=event_data.category,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        venue_id=event_data.venue_id,
        organizer_id=current_user.id,
        status="active"
    )
    db.add(new_event)
    await db.flush() # obtain ID
    
    # Automatically schedule a default Performance Show for this event
    new_show = Show(
        event_id=new_event.id,
        start_time=event_data.start_time,
        end_time=event_data.end_time,
        price_multiplier=1.00
    )
    db.add(new_show)
    
    logger.info(f"Event created: {new_event.title} (ID: {new_event.id})")
    return new_event
