# LTK Scraper + Caption Generator Backend

A Python-based backend service for scraping LTK (LikeToKnow.it) posts and generating AI-powered captions using OpenAI GPT-4.

## Features

- 🔍 **Web Scraping**: Playwright-based scraper for LTK creator and category pages
- 🤖 **AI Caption Generation**: OpenAI GPT-4 powered caption generation with customizable prompts
- 💾 **Persistent Storage**: Supabase integration for storing posts, products, and captions
- 🚀 **RESTful API**: Flask-based API with CORS support
- 📊 **Analytics**: Track scraping statistics and performance

## Tech Stack

- **Python 3.9+**
- **Flask** - Web framework
- **Playwright** - Web scraping
- **OpenAI GPT-4** - AI caption generation
- **Supabase** - Database and authentication
- **Pydantic** - Data validation

## Installation

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# CORS Settings
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Run Database Migrations

Make sure you've applied the Supabase migrations:

```sql
-- Run the migration file:
supabase/migrations/20251112000000_create_ltk_scraper_tables.sql
```

## Usage

### Start the API Server

```bash
cd backend
python -m main
```

The server will start on `http://localhost:5000`

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Scrape LTK URL
```bash
POST /api/scrape
Content-Type: application/json

{
  "url": "https://www.shopltk.com/explore/creator-handle",
  "max_posts": 10,
  "category": "gift_guide",
  "user_id": "uuid"
}
```

#### Generate Caption
```bash
POST /api/generate-caption
Content-Type: application/json

{
  "post_id": "uuid",
  "user_id": "uuid",
  "prompt_type": "gift_guide",
  "tone": "casual",
  "max_length": 250
}
```

#### Get User Posts
```bash
GET /api/posts?user_id=uuid&limit=50&offset=0
```

#### Get Post Details
```bash
GET /api/posts/{post_id}
```

#### Delete Post
```bash
DELETE /api/posts/{post_id}?user_id=uuid
```

#### Get User Statistics
```bash
GET /api/stats?user_id=uuid
```

## Prompt Templates

The caption generator includes several pre-built prompt templates:

- **gift_guide**: Fun, upbeat captions for gift guides
- **sale_alert**: Urgent, exciting captions for sales
- **product_roundup**: Engaging captions for product collections
- **seasonal**: Timely captions connected to seasons/trends
- **lifestyle**: Story-driven, relatable captions

### Example: Using Different Prompts

```python
from scraper.caption_generator import CaptionGenerator

generator = CaptionGenerator()

# Gift guide caption
caption = generator.generate_caption(
    post_data=post,
    prompt_type="gift_guide",
    tone="casual",
    max_length=250
)

# Sale alert caption
caption = generator.generate_caption(
    post_data=post,
    prompt_type="sale_alert",
    tone="upbeat",
    max_length=150
)
```

## Architecture

```
backend/
├── api/                    # Flask API
│   ├── __init__.py
│   └── app.py             # API routes and endpoints
├── scraper/               # Scraping and generation
│   ├── __init__.py
│   ├── ltk_scraper.py     # Playwright scraper
│   └── caption_generator.py  # OpenAI caption generator
├── utils/                 # Utilities
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   ├── models.py          # Pydantic models
│   └── supabase_client.py # Database client
├── main.py                # Entry point
├── requirements.txt       # Python dependencies
└── .env.example          # Environment template
```

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
export FLASK_DEBUG=True
python -m main
```

### Testing the Scraper

```python
import asyncio
from scraper.ltk_scraper import scrape_ltk_url

async def test():
    posts = await scrape_ltk_url(
        url="https://www.shopltk.com/explore/creator",
        max_posts=5
    )
    print(f"Scraped {len(posts)} posts")

asyncio.run(test())
```

### Testing Caption Generation

```python
from scraper.caption_generator import CaptionGenerator
from utils.models import PostData, ProductData

generator = CaptionGenerator()

post = PostData(
    creator_handle="test_creator",
    creator_profile_url="https://...",
    post_url="https://...",
    original_caption="Check out these amazing finds!",
    products=[
        ProductData(
            title="Amazing Product",
            merchant="Amazon",
            product_url="https://..."
        )
    ]
)

caption = generator.generate_caption(post, prompt_type="gift_guide")
print(caption.caption)
```

## Deployment

### Using Gunicorn (Production)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium

COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "api.app:app"]
```

## Troubleshooting

### Playwright Issues

If you encounter Playwright errors:

```bash
# Reinstall browsers
playwright install chromium --force

# Check browser installation
playwright install --help
```

### OpenAI Rate Limits

If you hit OpenAI rate limits, consider:
- Adding retry logic with exponential backoff
- Implementing request queuing
- Upgrading your OpenAI plan

### CORS Errors

Update `CORS_ORIGINS` in `.env` to include your frontend URL:

```env
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
