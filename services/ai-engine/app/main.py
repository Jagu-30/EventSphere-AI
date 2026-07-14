from fastapi import FastAPI
import time

app = FastAPI(
    title="EventSphere-AI - Machine Learning Service",
    description="Microservice providing event demand forecasting, pricing optimization, and recommendations.",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/predict/demand")
def predict_demand(event_id: int):
    """Predict expected bookings, sell-out probability, and expected revenue."""
    return {
        "event_id": event_id,
        "expected_bookings": 450,
        "sell_out_probability": 0.88,
        "expected_revenue": 54000.00,
        "confidence_interval": [410, 490]
    }


@app.post("/predict/price")
def predict_price(show_id: int, base_price: float, current_demand: float):
    """Compute optimal ticket price based on occupancy speed and time constraints."""
    # Example logic: bump price by 15% if demand scalar > 1.2
    multiplier = 1.0
    if current_demand > 1.2:
        multiplier = 1.15
    
    suggested_price = round(base_price * multiplier, 2)
    return {
        "show_id": show_id,
        "base_price": base_price,
        "suggested_price": suggested_price,
        "multiplier": multiplier,
        "features_applied": {
            "current_demand": current_demand,
            "holiday": False,
            "weekend": True
        }
    }


@app.post("/recommend/seats")
def recommend_seats(show_id: int, budget: float, group_size: int):
    """Suggest best physical seats for a group size within budget."""
    return {
        "show_id": show_id,
        "group_size": group_size,
        "recommended_category": "Premium",
        "recommended_seats": [f"Row G, Seat {10 + i}" for i in range(group_size)],
        "total_cost": round(45.00 * group_size, 2)
    }


@app.post("/detect/fraud")
def detect_fraud(user_id: int, booking_amount: float, ticket_count: int):
    """Evaluate fraud scores to isolate bulk booking bots or suspicious checkouts."""
    is_suspicious = False
    reasons = []
    
    if ticket_count > 10:
        is_suspicious = True
        reasons.append("bulk_booking_limit_exceeded")
    
    return {
        "user_id": user_id,
        "fraud_score": 0.95 if is_suspicious else 0.05,
        "is_suspicious": is_suspicious,
        "reasons": reasons
    }


@app.post("/predict/cancellation")
def predict_cancellation(booking_id: int):
    """Compute cancellation probability score."""
    return {
        "booking_id": booking_id,
        "cancellation_probability": 0.12,
        "risk_level": "low"
    }
