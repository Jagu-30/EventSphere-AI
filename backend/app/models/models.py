import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Enum as SQLEnum,
    Index,
    Numeric,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ORGANIZER = "organizer"
    ADMIN = "admin"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class SeatCategory(str, enum.Enum):
    VIP = "VIP"
    PREMIUM = "Premium"
    STANDARD = "Standard"
    ECONOMY = "Economy"


class SeatState(str, enum.Enum):
    AVAILABLE = "available"
    HELD = "held"
    BOOKED = "booked"


class WaitlistStatus(str, enum.Enum):
    WAITING = "waiting"
    OFFERED = "offed"
    EXPIRED = "expired"
    BOOKED = "booked"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    events_organized = relationship("Event", back_populates="organizer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    layout_json = Column(JSON, nullable=True)  # Grid map of seat rows/columns
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    events = relationship("Event", back_populates="venue")
    seats = relationship("Seat", back_populates="venue", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    banner_image = Column(String(255), nullable=True)
    category = Column(String(50), nullable=False, index=True)  # concert, sports, conference, etc.
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # draft, active, cancelled
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="RESTRICT"), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    venue = relationship("Venue", back_populates="events")
    organizer = relationship("User", back_populates="events_organized")
    shows = relationship("Show", back_populates="event", cascade="all, delete-orphan")


class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    price_multiplier = Column(Numeric(5, 2), default=1.00, nullable=False)  # base rate scalar
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="shows")
    seat_statuses = relationship("SeatStatus", back_populates="show", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="show", cascade="all, delete-orphan")
    waitlist_entries = relationship("Waitlist", back_populates="show", cascade="all, delete-orphan")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    row_label = Column(String(10), nullable=False)
    seat_number = Column(Integer, nullable=False)
    category = Column(SQLEnum(SeatCategory), default=SeatCategory.STANDARD, nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    venue = relationship("Venue", back_populates="seats")
    statuses = relationship("SeatStatus", back_populates="seat", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_venue_row_number", "venue_id", "row_label", "seat_number", unique=True),
    )


class SeatStatus(Base):
    __tablename__ = "seat_statuses"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(SeatState), default=SeatState.AVAILABLE, nullable=False, index=True)
    held_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hold_expires_at = Column(DateTime, nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    show = relationship("Show", back_populates="seat_statuses")
    seat = relationship("Seat", back_populates="statuses")
    booking = relationship("Booking", back_populates="seats_reserved")

    __table_args__ = (
        Index("idx_show_seat_unique", "show_id", "seat_id", unique=True),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="RESTRICT"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)
    qr_code_data = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings")
    show = relationship("Show", back_populates="bookings")
    coupon = relationship("Coupon")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    seats_reserved = relationship("SeatStatus", back_populates="booking", foreign_keys=[SeatStatus.booking_id])


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    gateway = Column(String(50), nullable=False)  # stripe, razorpay
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="payments")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_percentage = Column(Integer, nullable=False)  # e.g., 20 for 20%
    max_discount = Column(Numeric(10, 2), nullable=True)
    active_until = Column(DateTime, nullable=False)
    max_uses = Column(Integer, default=100, nullable=False)
    current_uses = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False)
    seat_category = Column(SQLEnum(SeatCategory), default=SeatCategory.STANDARD, nullable=False)
    status = Column(SQLEnum(WaitlistStatus), default=WaitlistStatus.WAITING, nullable=False, index=True)
    booking_link_sent_at = Column(DateTime, nullable=True)
    booking_link_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="waitlist_entries")
    show = relationship("Show", back_populates="waitlist_entries")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(String(50), nullable=False)  # email, websocket, sms
    status = Column(String(50), default="pending", nullable=False)  # pending, sent, failed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, index=True)
    value_json = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False, index=True)  # e.g., 'demand_forecasting', 'dynamic_pricing'
    target_id = Column(Integer, nullable=True, index=True)  # ID of show, event or seat
    predictions_json = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
