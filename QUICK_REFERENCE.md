# EcoFeed Quick Reference Guide

Fast access to common commands and information.

---

## 🚀 Start Application

### Development
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm run dev

# Access: http://localhost:5173
```

### Production (Docker)
```bash
# Unix/Linux
chmod +x deploy.sh
./deploy.sh production up

# Windows
deploy.bat production up

# Access: http://localhost:3000
```

---

## 🔧 Common Commands

### Backend

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run with uvicorn
python main.py

# Check API health
curl http://localhost:8000/health

# View API docs
# Open browser to http://localhost:8000/docs
```

### Frontend

```bash
# Install dependencies
cd frontend
npm install

# Development server
npm run dev

# Production build
npm run build

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

---

## 📝 Environment Configuration

### Backend (.env)

```env
ENVIRONMENT=development
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
GEMINI_API_KEY=your_key_here
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 🌐 API Endpoints

### Listings
- `GET /listings` - Get all listings
- `GET /listings?status=available` - Filter by status
- `POST /listings` - Create listing
- `DELETE /listings/{id}` - Delete listing
- `PUT /listings/{id}/claim` - Claim listing

### AI Scoring
- `GET /listings/{id}/score` - Get AI score

### Analytics
- `GET /stats` - Get impact statistics

### Health
- `GET /health` - Health check
- `GET /` - Root endpoint

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Dependencies Not Found
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm cache clean --force
rm -rf node_modules
npm install
```

### Docker Issues
```bash
# Rebuild
docker-compose build --no-cache
docker-compose up -d

# View error logs
docker-compose logs backend
docker-compose logs frontend
```

---

## 📁 Project Structure

```
ecofeed/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python deps
│   ├── .env.example         # Config template
│   ├── Dockerfile           # Container config
│   └── data/                # Data storage
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities
│   ├── package.json         # NPM config
│   ├── vite.config.js      # Vite config
│   └── Dockerfile          # Container config
├── docker-compose.yml       # Dev orchestration
├── docker-compose.prod.yml  # Prod orchestration
├── deploy.sh               # Unix deploy script
├── deploy.bat              # Windows deploy script
├── README.md               # Main documentation
├── DEPLOYMENT_GUIDE.md     # Deployment guide
├── SECURITY.md             # Security guide
└── .env.local.example      # Dev config template
```

---

## 🎯 Feature Checklist

### Backend ✅
- [x] CORS security
- [x] Rate limiting
- [x] Input validation
- [x] Error handling
- [x] Logging
- [x] Health checks
- [x] API documentation

### Frontend ✅
- [x] Form validation
- [x] Error notifications
- [x] Loading states
- [x] Network monitoring
- [x] API interceptors
- [x] Environment config
- [x] Responsive design

### DevOps ✅
- [x] Docker setup
- [x] CI/CD pipeline
- [x] Deployment scripts
- [x] Documentation
- [x] Security docs
- [x] Nginx config
- [x] Health checks

---

## 📊 Monitoring

### Backend Health
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "ai_enabled": true,
  "timestamp": "2026-04-28T10:30:00Z"
}
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend -f
docker-compose logs frontend -f
```

### Performance Metrics
```bash
# Docker resource usage
docker stats

# Container info
docker-compose ps
```

---

## 🔐 Security

### Generate JWT Secret
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Update Secrets
```bash
# Edit .env file with new secrets
nano .env

# Restart services
docker-compose restart
```

---

## 📱 API Client Usage

### Python
```python
import requests

api_url = "http://localhost:8000"

# Get listings
response = requests.get(f"{api_url}/listings")
listings = response.json()

# Create listing
data = {
    "food_type": "Fresh Salad",
    "quantity": "10 kg",
    "expiry_time": "22:30",
    "address": "Main St"
}
response = requests.post(f"{api_url}/listings", json=data)
```

### JavaScript
```javascript
const api_url = "http://localhost:8000";

// Get listings
fetch(`${api_url}/listings`)
  .then(r => r.json())
  .then(data => console.log(data));

// Create listing
fetch(`${api_url}/listings`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    food_type: "Fresh Salad",
    quantity: "10 kg",
    expiry_time: "22:30",
    address: "Main St"
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

### cURL
```bash
# Get listings
curl http://localhost:8000/listings

# Create listing
curl -X POST http://localhost:8000/listings \
  -H "Content-Type: application/json" \
  -d '{
    "food_type": "Fresh Salad",
    "quantity": "10 kg",
    "expiry_time": "22:30",
    "address": "Main St"
  }'

# Claim listing
curl -X PUT http://localhost:8000/listings/{id}/claim

# Delete listing
curl -X DELETE http://localhost:8000/listings/{id}
```

---

## 🎓 Learning Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Docker Docs](https://docs.docker.com/)
- [GitHub Actions](https://github.com/features/actions)

---

## 📞 Support

- **Docs**: README.md
- **Deployment**: DEPLOYMENT_GUIDE.md
- **Security**: SECURITY.md
- **Issues**: GitHub Issues
- **Email**: support@ecofeed.io

---

**Last Updated:** April 28, 2026
