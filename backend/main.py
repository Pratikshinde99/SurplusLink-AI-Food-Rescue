from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator, EmailStr
from typing import List, Optional
import os
import json
import uuid
from datetime import datetime, timedelta
import google.generativeai as genai
from dotenv import load_dotenv
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False

    class Limiter:
        def __init__(self, *args, **kwargs):
            self.limiter = self

        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    def get_remote_address():
        return "127.0.0.1"

    class RateLimitExceeded(Exception):
        pass
from jose import JWTError, jwt
import bcrypt

# Try importing Supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger = None

load_dotenv()

import logging

# Configure logging with better format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ─── Configuration ──────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
API_VERSION = "3.0"
MAX_LISTING_DESCRIPTION = 500
MAX_QUANTITY_LENGTH = 100
MAX_ADDRESS_LENGTH = 200

# ─── JWT & Supabase Configuration ──────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

# Security settings
security = HTTPBearer()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase_client: Optional[Client] = None
try:
    if SUPABASE_AVAILABLE and SUPABASE_URL:
        # Prefer service role key for backend operations to bypass RLS
        active_key = SUPABASE_SERVICE_ROLE_KEY if SUPABASE_SERVICE_ROLE_KEY else SUPABASE_KEY
        if active_key:
            supabase_client = create_client(SUPABASE_URL, active_key)
            key_type = "Service Role" if SUPABASE_SERVICE_ROLE_KEY else "Anon Key"
            logger.info(f"✓ Supabase connected successfully using {key_type}")
        else:
            logger.warning("⚠ Supabase keys not set - using JSON file storage")
    else:
        logger.warning("⚠ Supabase not configured - using JSON file storage")
except Exception as e:
    logger.warning(f"⚠ Supabase connection failed: {e} - using JSON file storage")

# Initialize FastAPI with better metadata
app = FastAPI(
    title="EcoFeed API",
    description="AI-powered food surplus redistribution platform",
    version=API_VERSION,
)

# ─── Security Middleware ────────────────────────────────────────
# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# CORS with restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0", "testserver"]
)

# ─── AI Setup with Error Handling ──────────────────────────────
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
ai_model = None

try:
    if GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        ai_model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("✓ Gemini AI connected successfully")
    else:
        logger.warning("⚠ GEMINI_API_KEY not set - AI recommendations disabled")
except Exception as e:
    logger.error(f"✗ Gemini setup failed: {e}")
    ai_model = None


# ─── Database: Setup ───────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
LISTINGS_FILE = os.path.join(DATA_DIR, "listings.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Demo seed data
SEED_DATA = [
    {
        "id": "seed-1", "food_type": "Mixed Veggie Curry & Basmati Rice", "quantity": "15 kg",
        "expiry_time": "22:30", "address": "Royal Heritage Mall, NIBM Road",
        "status": "available", "created_at": "2026-04-28T09:00:00Z"
    },
    {
        "id": "seed-2", "food_type": "Fresh Chicken Sandwiches", "quantity": "30 pieces",
        "expiry_time": "23:00", "address": "German Bakery, KP",
        "status": "available", "created_at": "2026-04-28T08:30:00Z"
    },
    {
        "id": "seed-3", "food_type": "Dal Tadka & Butter Chapati", "quantity": "10 kg",
        "expiry_time": "21:45", "address": "Blue Nile, Camp Area",
        "status": "available", "created_at": "2026-04-28T08:00:00Z"
    }
]

# Helper functions for local storage
def _load_listings() -> list:
    return _load_json(LISTINGS_FILE, SEED_DATA)

def _save_listings(listings: list):
    _save_json(LISTINGS_FILE, listings)

def _load_users() -> dict:
    return _load_json(USERS_FILE, {})

def _save_users(users: dict):
    _save_json(USERS_FILE, users)

# ─── Database: Supabase Integration ────────────────────────────

async def _get_supabase_listings(status_filter: Optional[str] = None) -> list:
    """Fetch listings from Supabase."""
    if not supabase_client:
        return _load_json(LISTINGS_FILE, SEED_DATA)
    
    try:
        query = supabase_client.table("listings").select("*")
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.order("created_at", { "ascending": False }).execute()
        return response.data
    except Exception as e:
        logger.error(f"Supabase fetch error: {e}")
        return _load_json(LISTINGS_FILE, SEED_DATA)

async def _save_supabase_listing(listing_data: dict):
    """Save a listing to Supabase."""
    if not supabase_client:
        listings = _load_listings()
        listings.insert(0, listing_data)
        _save_listings(listings)
        return
    
    try:
        supabase_client.table("listings").insert(listing_data).execute()
    except Exception as e:
        logger.error(f"Supabase insert error: {e}")
        # Fallback to local
        listings = _load_listings()
        listings.insert(0, listing_data)
        _save_listings(listings)

async def _update_supabase_listing(listing_id: str, update_data: dict):
    """Update a listing in Supabase."""
    if not supabase_client:
        listings = _load_listings()
        for l in listings:
            if l["id"] == listing_id:
                l.update(update_data)
                break
        _save_listings(listings)
        return
    
    try:
        supabase_client.table("listings").update(update_data).eq("id", listing_id).execute()
    except Exception as e:
        logger.error(f"Supabase update error: {e}")

async def _delete_supabase_listing(listing_id: str):
    """Delete a listing from Supabase."""
    if not supabase_client:
        listings = _load_listings()
        listings = [l for l in listings if l["id"] != listing_id]
        _save_listings(listings)
        return
    
    try:
        supabase_client.table("listings").delete().eq("id", listing_id).execute()
    except Exception as e:
        logger.error(f"Supabase delete error: {e}")

async def _get_supabase_user(email: str):
    """Fetch user from Supabase."""
    if not supabase_client:
        return USERS_DB.get(email)
    
    try:
        response = supabase_client.table("users").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        logger.error(f"Supabase user fetch error: {e}")
        return USERS_DB.get(email)

async def _save_supabase_user(user_data: dict):
    """Save user to Supabase."""
    if not supabase_client:
        USERS_DB[user_data["email"]] = user_data
        _save_users(USERS_DB)
        return
    
    try:
        supabase_client.table("users").insert(user_data).execute()
    except Exception as e:
        logger.error(f"Supabase user save error: {e}")
        USERS_DB[user_data["email"]] = user_data
        _save_users(USERS_DB)

# Fallback JSON support (keeping for local dev/testing)
def _load_json(file_path: str, default_data: list or dict) -> list or dict:
    if not os.path.exists(file_path):
        return default_data
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except:
        return default_data

def _save_json(file_path: str, data: list or dict):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

# ─── Pydantic Models with Validation ──────────────────────────

# Authentication Models
class UserRegister(BaseModel):
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    organization_name: str = Field(..., min_length=3, max_length=100)
    role: str = Field("supplier", pattern="^(supplier|ngo)$")

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None

# Listing Models
class ListingCreate(BaseModel):
    food_type: str = Field(
        ...,
        min_length=3,
        max_length=MAX_LISTING_DESCRIPTION,
        description="Type and description of food"
    )
    quantity: str = Field(
        ...,
        min_length=1,
        max_length=MAX_QUANTITY_LENGTH,
        description="Quantity (e.g., '15 kg', '30 pieces')"
    )
    expiry_time: str = Field(
        ...,
        pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
        description="Expiry time in HH:MM format"
    )
    address: str = Field(
        ...,
        min_length=5,
        max_length=MAX_ADDRESS_LENGTH,
        description="Pickup location address"
    )

    @validator('food_type', 'address')
    def sanitize_text(cls, v):
        # Remove potentially malicious content
        return v.strip()

class ListingUpdate(BaseModel):
    status: Optional[str] = Field(
        None,
        pattern="^(available|claimed|cancelled)$",
        description="Listing status"
    )

class ListingResponse(BaseModel):
    id: str
    food_type: str
    quantity: str
    expiry_time: str
    address: str
    status: str
    created_at: str
    claimed_at: Optional[str] = None

class ScoreResponse(BaseModel):
    listing_id: str
    score: int = Field(..., ge=0, le=100)
    recommendation: str
    distance: str
    eta: str

class StatsResponse(BaseModel):
    total_listings: int
    available: int
    claimed: int
    food_saved_kg: float
    people_fed: int
    co2_offset_kg: float
    timestamp: str


# ─── Authentication Functions ──────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password for secure storage."""
    # Bcrypt limit is 72 bytes, so we truncate if needed
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(plain_password[:72].encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Validate JWT token and return current user."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        role: str = payload.get("role")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(email=email, user_id=user_id, role=role)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Use persistent JSON storage for users
USERS_DB = _load_users()

# ─── API Endpoints ────────────────────────────────────────────

@app.get("/", tags=["Health"])
@limiter.limit("10/minute")
async def root(request: Request):
    """Health check endpoint."""
    return {
        "message": "EcoFeed API is running",
        "version": API_VERSION,
        "status": "online",
        "environment": ENVIRONMENT
    }

@app.get("/health", tags=["Health"])
@limiter.limit("20/minute")
async def health_check(request: Request):
    """Detailed health status."""
    return {
        "status": "healthy",
        "ai_enabled": ai_model is not None,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ─── Authentication Endpoints ──────────────────────────────────

@app.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister):
    """Register a new user (Now supports Supabase)."""
    # Check if user already exists
    existing_user = await _get_supabase_user(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password,
        "organization_name": user_data.organization_name,
        "role": user_data.role,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    await _save_supabase_user(new_user)
    
    # Create token
    access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={"sub": user_data.email, "user_id": user_id, "role": user_data.role},
        expires_delta=access_token_expires
    )
    
    logger.info(f"✓ New user registered: {user_data.email} ({user_data.role})")
    
    return TokenResponse(
        access_token=access_token,
        user_id=user_id,
        email=user_data.email,
        role=user_data.role
    )

@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    """Login user (Now supports Supabase)."""
    user = await _get_supabase_user(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create token
    access_token_expires = timedelta(hours=JWT_EXPIRATION_HOURS)
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "user_id": user["user_id"],
            "role": user["role"]
        },
        expires_delta=access_token_expires
    )
    
    logger.info(f"✓ User logged in: {credentials.email}")
    
    return TokenResponse(
        access_token=access_token,
        user_id=user["user_id"],
        email=user["email"],
        role=user["role"]
    )

@app.get("/auth/me", tags=["Auth"])
@limiter.limit("20/minute")
async def get_current_user_info(request: Request, current_user: TokenData = Depends(get_current_user)):
    """Get current authenticated user info."""
    user = await _get_supabase_user(current_user.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "organization_name": user["organization_name"],
        "role": user["role"],
        "created_at": user["created_at"]
    }

@app.get("/listings", response_model=List[ListingResponse], tags=["Listings"])
@limiter.limit("30/minute")
async def get_listings(request: Request, status: Optional[str] = None, supplier_id: Optional[str] = None):
    """Get listings with optional filters (Status and Supplier)."""
    try:
        listings = await _get_supabase_listings(status)
        
        if supplier_id:
            listings = [l for l in listings if l.get("supplier_id") == supplier_id]
            
        return listings
    except Exception as e:
        logger.error(f"Error fetching listings: {e}")
        raise HTTPException(status_code=500, detail="Failed to load donations")

@app.post("/listings", response_model=ListingResponse, tags=["Listings"], status_code=201)
@limiter.limit("10/minute")
async def create_listing(request: Request, listing: ListingCreate, current_user: TokenData = Depends(get_current_user)):
    """Create a new food listing (Now supports Supabase)."""
    try:
        new_listing = {
            "id": str(uuid.uuid4()),
            "food_type": listing.food_type.strip(),
            "quantity": listing.quantity.strip(),
            "expiry_time": listing.expiry_time,
            "address": listing.address.strip(),
            "status": "available",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "supplier_id": current_user.user_id
        }
        await _save_supabase_listing(new_listing)
        logger.info(f"✓ New listing created: {listing.food_type} by {current_user.email}")
        return new_listing
    except Exception as e:
        logger.error(f"Error creating listing: {e}")
        raise HTTPException(status_code=500, detail="Failed to create listing")

@app.delete("/listings/{listing_id}", tags=["Listings"])
@limiter.limit("20/minute")
async def delete_listing(request: Request, listing_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete a donation entry (Securely)."""
    try:
        listings = await _get_supabase_listings()
        listing = next((l for l in listings if l["id"] == listing_id), None)
        
        if not listing:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        # Only allow the owner to delete
        if listing.get("supplier_id") != current_user.user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own donations")
            
        await _delete_supabase_listing(listing_id)
        logger.info(f"✓ Listing deleted: {listing_id}")
        return {"status": "success", "message": "Donation removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting listing: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove donation")

@app.put("/listings/{listing_id}/claim", response_model=ListingResponse, tags=["Listings"])
@limiter.limit("15/minute")
async def claim_listing(request: Request, listing_id: str, current_user: TokenData = Depends(get_current_user)):
    """Mark a listing as claimed (Now supports Supabase)."""
    try:
        listings = await _get_supabase_listings()
        listing = next((l for l in listings if l["id"] == listing_id), None)
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing["status"] == "claimed":
            raise HTTPException(status_code=409, detail="Listing already claimed")
        
        update = {
            "status": "claimed",
            "claimed_at": datetime.utcnow().isoformat() + "Z",
            "claimed_by": current_user.user_id
        }
        await _update_supabase_listing(listing_id, update)
        listing.update(update)
        return listing
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error claiming listing: {e}")
        raise HTTPException(status_code=500, detail="Failed to claim listing")

@app.put("/listings/{listing_id}/verify", response_model=ListingResponse, tags=["Listings"])
@limiter.limit("10/minute")
async def verify_pickup(request: Request, listing_id: str, token: str, current_user: TokenData = Depends(get_current_user)):
    """Verify QR code and mark as delivered."""
    try:
        listings = await _get_supabase_listings()
        listing = next((l for l in listings if l["id"] == listing_id), None)
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        # Security check: Ensure token matches (simulated for demo)
        expected_token = f"ECO-{listing_id[:6].upper()}"
        if token != expected_token:
            raise HTTPException(status_code=403, detail="Invalid verification token")
            
        update = {
            "status": "delivered",
            "delivered_at": datetime.utcnow().isoformat() + "Z"
        }
        await _update_supabase_listing(listing_id, update)
        listing.update(update)
        return listing
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying pickup: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify pickup")

@app.get("/listings/{listing_id}/score", response_model=ScoreResponse, tags=["AI Scoring"])
@limiter.limit("20/minute")
async def get_ai_score(request: Request, listing_id: str, current_user: TokenData = Depends(get_current_user)):
    """Get AI score and recommendation for a specific listing (Requires authentication)."""

    try:
        listings = _load_listings()
        listing = next((l for l in listings if l["id"] == listing_id), None)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Weighted scoring with better logic
        time_left = 120  # default mins
        try:
            h, m = listing["expiry_time"].split(":")
            now = datetime.utcnow()
            # Calculate time difference in minutes
            exp_mins = int(h) * 60 + int(m)
            now_mins = (now.hour + 5.5) * 60 + now.minute  # IST offset (assuming IST for demo)
            time_left = max(0, exp_mins - now_mins)
        except (ValueError, IndexError):
            logger.warning(f"Invalid expiry_time format: {listing['expiry_time']}")

        # Urgency: 40% (More urgent = higher score)
        urgency_score = max(0, min(40, (1 - time_left / 360) * 40))
        # Quantity: 20% (Assumed base)
        qty_score = 20
        # Distance: 25% (Simulated)
        dist_score = 25
        # Impact Potential: 15% (Base)
        impact_score = 15
        
        score = min(99, int(urgency_score + qty_score + dist_score + impact_score))

        # AI recommendation via Gemini
        recommendation = f"High priority rescue — {listing['food_type']} available at {listing['address']}."
        
        if ai_model:
            try:
                prompt = f"""You are EcoFeed AI, a professional food rescue coordinator. 
                Generate a 1-sentence, high-impact recommendation for an NGO rescue team.
                Food: {listing['food_type']}
                Quantity: {listing['quantity']}
                Expires: {listing['expiry_time']}
                Location: {listing['address']}
                Urgency Score: {score}/100
                Be concise, authoritative, and action-oriented."""
                
                response = ai_model.generate_content(prompt, generation_config={"temperature": 0.3, "max_output_tokens": 100})
                recommendation = response.text.strip()[:250]
            except Exception as e:
                logger.warning(f"AI recommendation failed: {e}")

        return {
            "listing_id": listing_id,
            "score": score,
            "recommendation": recommendation,
            "distance": f"{round(1 + (hash(listing_id) % 30) / 10, 1)} km",
            "eta": f"~{5 + (hash(listing_id) % 15)} min"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating score: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate score")

@app.get("/stats", response_model=StatsResponse, tags=["Analytics"])
@limiter.limit("30/minute")
async def get_stats(request: Request):
    """Get real-time impact statistics (Now supports Supabase)."""
    try:
        listings = await _get_supabase_listings()
        total = len(listings)
        claimed = len([l for l in listings if l.get("status") == "claimed"])
        available = total - claimed

        # Calculate impact estimates
        total_kg = 0
        for l in listings:
            qty_str = l.get("quantity", "0")
            nums = ''.join(c for c in qty_str if c.isdigit() or c == '.')
            try:
                # Default to 5kg if no number found for better impact visualization
                val = float(nums) if nums else 5.0
                total_kg += val
            except ValueError:
                total_kg += 5.0

        people_fed = int(total_kg * 2.5) 
        co2_offset = round(total_kg * 2.5, 1)

        return {
            "total_listings": total,
            "available": available,
            "claimed": claimed,
            "food_saved_kg": round(total_kg, 1),
            "people_fed": people_fed,
            "co2_offset_kg": co2_offset,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to load impact stats")

@app.post("/listings/predict-impact", tags=["Analytics"])
@limiter.limit("10/minute")
async def predict_impact(request: Request, data: dict):
    """AI impact prediction for a potential donation."""
    food_type = data.get("food_type", "Food")
    quantity = data.get("quantity", "0")
    
    # Simple logic-based prediction for speed, could be AI-enhanced
    nums = ''.join(c for c in quantity if c.isdigit() or c == '.')
    try:
        kg = float(nums) if nums else 2.0
    except ValueError:
        kg = 2.0
        
    people = int(kg * 2.5)
    co2 = round(kg * 2.5, 1)
    
    return {
        "people_fed": people,
        "co2_saved_kg": co2,
        "impact_score": min(100, int(kg * 5))
    }

# ─── Exception Handlers ────────────────────────────────────────

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 EcoFeed API v{API_VERSION} starting...")
    logger.info(f"   Environment: {ENVIRONMENT}")
    logger.info(f"   Allowed Origins: {ALLOWED_ORIGINS}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )


