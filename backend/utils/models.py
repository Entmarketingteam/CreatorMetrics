"""
Pydantic models for data validation and serialization
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl, Field


class ProductData(BaseModel):
    """Model for scraped product information"""
    title: str
    merchant: str
    product_url: str
    image_url: Optional[str] = None


class PostData(BaseModel):
    """Model for scraped LTK post information"""
    creator_handle: str
    creator_profile_url: str
    post_url: str
    original_caption: str
    products: List[ProductData] = []
    category: Optional[str] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)


class GeneratedCaption(BaseModel):
    """Model for AI-generated caption"""
    caption: str
    caption_type: str  # 'short', 'long', 'alt_text'
    hashtags: List[str] = []
    word_count: int
    char_count: int


class ScraperRequest(BaseModel):
    """Request model for scraping endpoint"""
    url: str
    max_posts: int = Field(default=10, ge=1, le=50)
    category: Optional[str] = None
    user_id: str


class CaptionRequest(BaseModel):
    """Request model for caption generation endpoint"""
    post_id: str
    user_id: str
    prompt_type: str = "gift_guide"  # gift_guide, sale_alert, product_roundup, etc.
    tone: str = "casual"  # casual, professional, fun, upbeat
    max_length: int = 250


class ScraperResponse(BaseModel):
    """Response model for scraping endpoint"""
    success: bool
    message: str
    posts_scraped: int
    posts: List[Dict[str, Any]] = []
    error: Optional[str] = None


class CaptionResponse(BaseModel):
    """Response model for caption generation endpoint"""
    success: bool
    message: str
    caption: Optional[GeneratedCaption] = None
    error: Optional[str] = None
