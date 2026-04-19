# Docker Setup Guide — Campus Connect

## Overview
Campus Connect is fully containerized using Docker and Docker Compose, consisting of 4 services:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `frontend` | Node 20 + Nginx | 80 | React SPA served via Nginx |
| `backend` | Node 20 Alpine | 3000 | Express.js API server |
| `redis` | Redis 7 Alpine | 6379 | In-memory caching |
| `elasticsearch` | ES 8.12 | 9200 | Full-text search engine |

## Architecture

```
                     ┌──────────────────┐
                     │   Client/Browser │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │   Frontend       │
                     │   (Nginx:80)     │
                     │   React SPA      │
                     └──┬──────────┬────┘
                        │ /api/*   │ /graphql
               ┌────────▼──────────▼────┐
               │      Backend           │
               │   (Express:3000)       │
               │   REST + GraphQL       │
               └──┬─────────┬─────┬────┘
                  │         │     │
          ┌───────▼──┐ ┌────▼──┐ ┌▼──────────────┐
          │ MongoDB  │ │ Redis │ │ Elasticsearch  │
          │ (Atlas)  │ │ :6379 │ │    :9200       │
          └──────────┘ └───────┘ └────────────────┘
```

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed (v2+)

## Quick Start

### 1. Clone and Navigate
```bash
cd Campus_Connect_FSD_Project
```

### 2. Configure Environment
Create a `.env` file in the project root (or use the existing `backend/.env`):
```env
# MongoDB (Atlas - keep using cloud DB)
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/campusconnect

# JWT
JWT_SECRET=your_jwt_secret

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Razorpay (optional)
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### 3. Build and Start
```bash
# Build all images and start services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Access
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **GraphQL Playground**: http://localhost:3000/graphql
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200

## Docker Commands Reference

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend

# Restart a single service
docker-compose restart backend

# Scale a service (if needed)
docker-compose up -d --scale backend=2

# Check health status
docker-compose ps
```

## Service Details

### Frontend (Nginx)
- **Build**: Multi-stage — Node.js builds Vite app, Nginx serves static files
- **Config**: `frontend/nginx.conf` handles SPA routing + API proxying
- **Health Check**: HTTP GET on port 80

### Backend (Node.js)
- **Build**: Multi-stage — dependencies installed in build stage, slim production image
- **User**: Runs as non-root user `backend` (security)
- **Health Check**: HTTP GET on `http://localhost:3000/`
- **Volumes**: 
  - `backend-uploads` — persistent file uploads
  - `backend-logs` — log files

### Redis
- **Image**: `redis:7-alpine` (lightweight)
- **Health Check**: `redis-cli ping`
- **Volume**: `redis-data` for persistence

### Elasticsearch
- **Image**: `docker.elastic.co/elasticsearch/elasticsearch:8.12.0`
- **Config**: Single-node, security disabled (dev mode)
- **Memory**: JVM heap limited to 256MB-512MB
- **Health Check**: Cluster health endpoint
- **Volume**: `es-data` for persistent indices

## Volumes
| Volume | Purpose |
|--------|---------|
| `redis-data` | Redis data persistence |
| `es-data` | Elasticsearch index data |
| `backend-uploads` | File uploads (CSV, profile pics) |
| `backend-logs` | Application log files |

## Network
All services communicate over the `campus-network` Docker bridge network. Services can reference each other by name:
- Frontend references `backend:3000` for API proxy
- Backend references `redis:6379` for caching
- Backend references `elasticsearch:9200` for search

## Troubleshooting

### Elasticsearch won't start
```bash
# Check if host has enough virtual memory
sudo sysctl -w vm.max_map_count=262144

# Make permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### Backend can't connect to Redis
The backend gracefully falls back if Redis is unavailable. Check Redis health:
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Frontend not loading
Check if the build succeeded:
```bash
docker-compose logs frontend
```

### View running containers
```bash
docker-compose ps
```
