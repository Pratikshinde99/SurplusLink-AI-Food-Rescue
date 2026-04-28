# EcoFeed Deployment Guide

Complete guide for deploying EcoFeed to production.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development](#local-development)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Backend `.env` file configured with all required variables
- [ ] Frontend `.env.local` file configured
- [ ] Google Gemini API key obtained and tested
- [ ] Docker & Docker Compose installed (if using containers)
- [ ] Sufficient server resources (2GB+ RAM recommended)
- [ ] SSL certificates obtained (for production)
- [ ] Domain name configured (for production)
- [ ] GitHub Actions secrets configured (if using CI/CD)
- [ ] All tests passing locally
- [ ] Backup strategy documented

---

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/ecofeed.git
cd ecofeed

# Copy environment files
cp .env.local.example .env.local
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Configure Environment

Edit `.env.local` and add your configuration:

```env
GEMINI_API_KEY=your_key_here
VITE_API_URL=http://localhost:8000
```

### Start Services

Terminal 1 (Backend):
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Staging Deployment

### Docker-Compose (Recommended)

```bash
# Prepare environment
cp .env.local.example .env.staging
# Edit .env.staging with staging values

# Start services
docker-compose -f docker-compose.yml up -d

# Verify
docker-compose ps
docker-compose logs backend
docker-compose logs frontend

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Manual Deployment

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py &

# Frontend (from frontend directory)
npm install
npm run build
npm run preview
```

---

## Production Deployment

### Option 1: Docker Compose (AWS/GCP/Azure VM)

#### Step 1: Prepare Server

```bash
# SSH into server
ssh user@your-server.com

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/ecofeed.git
cd ecofeed
```

#### Step 2: Configure Environment

```bash
# Create production environment file
cat > .env.production << EOF
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
GEMINI_API_KEY=your_production_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_key
JWT_SECRET=generate_strong_random_secret
VITE_API_URL=https://api.yourdomain.com
EOF

# Secure permissions
chmod 600 .env.production
```

#### Step 3: SSL Certificates

```bash
# Using Let's Encrypt with Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/ecofeed.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/ecofeed.key
```

#### Step 4: Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy using script
./deploy.sh production up

# Or use docker-compose directly
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 5: Verify Deployment

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl https://yourdomain.com/health
curl https://api.yourdomain.com/health
```

### Option 2: Vercel (Frontend) + Railway/Render (Backend)

#### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set Environment Variables:
   - `VITE_API_URL=https://your-backend-url.com`
4. Deploy

#### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add environment variables from `.env`
4. Deploy from GitHub

### Option 3: Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace ecofeed

# Create secrets
kubectl create secret generic ecofeed-secrets \
  --from-literal=gemini-api-key=your_key \
  --from-literal=jwt-secret=your_secret \
  -n ecofeed

# Deploy
kubectl apply -f k8s/backend-deployment.yaml -n ecofeed
kubectl apply -f k8s/frontend-deployment.yaml -n ecofeed
kubectl apply -f k8s/service.yaml -n ecofeed
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl https://yourdomain.com/health

# Check logs
docker-compose logs --tail 100

# Monitor resources
docker stats
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy.sh production rebuild
```

### Backup

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/

# Upload to S3
aws s3 cp backup-*.tar.gz s3://your-bucket/backups/
```

### SSL Certificate Renewal

```bash
# Automatic renewal (set up cron job)
sudo crontab -e

# Add: 0 0 1 * * certbot renew --quiet
```

---

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### High Memory Usage

```bash
# Check what's using memory
docker stats

# Restart services
docker-compose restart

# Increase limits in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### API Connection Issues

```bash
# Test API locally
docker exec ecofeed-backend curl http://localhost:8000/health

# Check network
docker network inspect ecofeed_ecofeed-network

# Verify environment variables
docker exec ecofeed-backend env | grep ALLOWED_ORIGINS
```

### Certificate Issues

```bash
# Check certificate expiration
openssl x509 -enddate -noout -in ssl/ecofeed.crt

# Renew certificate
sudo certbot renew --force-renewal
```

---

## Performance Optimization

### Caching

```nginx
# In nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
location /listings {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
}
```

### Database Optimization

```python
# Add database indexing
# CREATE INDEX idx_status ON listings(status);
# CREATE INDEX idx_expiry ON listings(expiry_time);
```

### CDN Integration

```bash
# Use CloudFlare or AWS CloudFront
# Update ALLOWED_ORIGINS to include CDN domain
```

---

## Scaling

For production-scale deployment:

1. **Database:** Migrate from JSON to PostgreSQL with Supabase
2. **Caching:** Add Redis for session/data caching
3. **Load Balancing:** Use multiple backend instances with load balancer
4. **File Storage:** Use S3/GCS for large files
5. **Monitoring:** Add Sentry, DataDog, or similar

---

## Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Review this guide
- Open GitHub issue with details

---

**Last Updated:** April 2026
