# EventSphere-AI

Intelligent Event Ticket Booking & Management Platform. EventSphere-AI is a next-generation ticketing system designed to provide real-time seats locking, dynamic ticket pricing, smart seat recommendations, demand forecasting, and robust fraud prevention.

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Zustand.
- **Main Backend**: FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Redis, JWT.
- **AI Service**: FastAPI, LightGBM, Prophet, Scikit-learn.
- **Realtime Sync**: Socket.IO, Redis.
- **Search & Caching**: Elasticsearch, Redis.
- **Containers & DevOps**: Docker, Docker Compose.

---

## Directory Structure

```
EventSphere-AI/
├── frontend/             # Next.js 15 dashboard and booking site
├── backend/              # FastAPI main service (authentication, users, booking, core db)
├── services/
│   ├── ai-engine/        # FastAPI model training and prediction service
│   ├── booking-service/  # Async queue handlers / distributed locking
│   ├── payment-service/  # Stripe and Razorpay integrations
│   ├── notification/     # SMTP / Sendgrid templates & dispatch
│   └── analytics/        # Time-series databases aggregation and report builder
├── database/             # Relational schema scripts & migration tracks
├── docker/               # Dockerfiles and network configuration
├── docs/                 # OpenAPI specs and architecture drawings
└── tests/                # System integrations, end-to-end specs, & unit suites
```

---

## Getting Started

1. **Clone & Set Up active workspace:**
   Ensure your code editor is pointed at the root of `EventSphere-AI/` (e.g. `D:\Download\Qoder\EventSphere-AI`).

2. **Run via Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Verify Interactive API documentation:**
   - Main Backend: [http://localhost:8000/docs](http://localhost:8000/docs)
   - AI Engine Service: [http://localhost:8001/docs](http://localhost:8001/docs)

4. **Verify Frontend:**
   - Portal: [http://localhost:3000](http://localhost:3000)
