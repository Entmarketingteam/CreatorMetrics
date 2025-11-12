# CreatorMetrics - LTK Scraper + Caption Generator MVP

A cloud-based tool to scrape LTK (LikeToKnow.it) category and creator pages, extract top-performing post and product data, and auto-generate engaging captions using AI.

## 🚀 Features

### Frontend (React + TypeScript)
- 📊 **Dashboard**: Analytics and performance tracking
- 💰 **Earnings**: Track affiliate commissions
- 📦 **Products**: Product performance insights
- 📸 **Content**: Social media post analytics
- ✨ **LTK Scraper**: Scrape LTK posts and generate AI captions
- 💡 **Insights**: AI-powered recommendations
- 🔗 **Platforms**: Manage affiliate platform connections
- ⚙️ **Settings**: User preferences and configuration

### Backend (Python + Flask)
- 🔍 **Web Scraping**: Playwright-based LTK scraper
- 🤖 **AI Caption Generation**: OpenAI GPT-4 powered captions
- 💾 **Database**: Supabase for persistent storage
- 🔐 **Authentication**: Supabase Auth integration
- 📊 **Analytics**: Scraping statistics and metrics

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Supabase** account (free tier works)
- **OpenAI API** key

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CreatorMetrics
```

### 2. Setup Frontend

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000
```

### 3. Setup Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Create environment file
cp .env.example .env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-your-openai-api-key
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

### 4. Database Setup

Apply the Supabase migrations:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/20251016063142_create_creator_metrics_schema.sql`
   - `supabase/migrations/20251021020954_add_social_posts_and_attribution_tables.sql`
   - `supabase/migrations/20251112000000_create_ltk_scraper_tables.sql`

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
python -m main
```

The backend will start on `http://localhost:5000`

### Start Frontend Development Server

```bash
# In the root directory
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📖 Usage Guide

### 1. Create an Account

1. Navigate to `http://localhost:5173`
2. Click "Register" and create an account
3. Verify your email (if required)
4. Log in to the dashboard

### 2. Scrape LTK Posts

1. Navigate to "LTK Scraper" in the sidebar
2. Enter an LTK URL:
   - Creator page: `https://www.shopltk.com/explore/creator-handle`
   - Category page: `https://www.shopltk.com/explore/category-name`
3. Optionally set a category tag (e.g., "gift_guide", "sale_alert")
4. Choose max number of posts to scrape (1-50)
5. Click "Scrape LTK Posts"
6. Wait for the scraping to complete

### 3. Generate AI Captions

1. Click on any scraped post to view details
2. Select prompt type:
   - **Gift Guide**: Fun, upbeat gift recommendations
   - **Sale Alert**: Urgent sale announcements
   - **Product Roundup**: Product collection highlights
   - **Seasonal**: Timely, trend-focused content
   - **Lifestyle**: Story-driven, relatable content
3. Choose tone: Casual, Professional, Fun, or Upbeat
4. Set max caption length (50-500 characters)
5. Click "Generate Caption"
6. Copy and use the generated caption!

### 4. Export Data

- Click "Export JSON" to download all scraped posts
- Generated captions are saved to the database
- View statistics at the top of the LTK Scraper page

## 🏗 Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Supabase JS** - Database client
- **Lucide React** - Icons

### Backend Stack
- **Python 3.9+** - Programming language
- **Flask** - Web framework
- **Playwright** - Web scraping
- **OpenAI GPT-4** - AI captions
- **Supabase** - Database
- **Pydantic** - Data validation

### Database (Supabase)

#### Core Tables
- `profiles` - User profiles
- `platform_connections` - Affiliate platform connections
- `sales` - Affiliate sales data
- `products` - Product performance data
- `social_posts` - Social media posts
- `attributions` - Sale attribution to posts

#### LTK Scraper Tables
- `ltk_posts` - Scraped LTK posts
- `ltk_products` - Products from LTK posts
- `generated_captions` - AI-generated captions

## 📁 Project Structure

```
CreatorMetrics/
├── backend/                # Python backend
│   ├── api/               # Flask API routes
│   ├── scraper/           # Scraping & caption generation
│   ├── utils/             # Utilities and configuration
│   ├── main.py            # Entry point
│   └── requirements.txt   # Python dependencies
├── src/                   # React frontend
│   ├── components/        # Reusable components
│   ├── contexts/          # React contexts
│   ├── lib/              # Supabase client
│   ├── pages/            # Page components
│   │   └── LTKScraper.tsx # LTK Scraper page
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main app component
├── supabase/             # Database migrations
└── package.json          # Node dependencies
```

## 🔧 Development

### Frontend Development

```bash
# Run dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Run in debug mode
export FLASK_DEBUG=True
python -m main

# Test scraper
python -c "import asyncio; from scraper.ltk_scraper import scrape_ltk_url; asyncio.run(scrape_ltk_url('URL', max_posts=2))"

# Test caption generator
python -c "from scraper.caption_generator import CaptionGenerator; print('OK')"
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to Vercel or Netlify

3. Set environment variables in your hosting platform

### Backend (Replit/Railway/Heroku)

1. Push the backend code to your hosting platform

2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `CORS_ORIGINS`

3. Install dependencies and run:
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   gunicorn -w 4 -b 0.0.0.0:$PORT api.app:app
   ```

## 🐛 Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Ensure Playwright browsers are installed: `playwright install chromium`
- Verify Python version is 3.9+

### Scraping fails
- Check that the LTK URL is valid and public
- Ensure Playwright browsers are installed
- LTK may have changed their HTML structure - selectors may need updates

### Caption generation fails
- Verify OpenAI API key is valid
- Check OpenAI API usage/rate limits
- Ensure you have credits in your OpenAI account

### CORS errors
- Update `CORS_ORIGINS` in backend `.env`
- Ensure backend is running on the expected port
- Check that `VITE_API_URL` in frontend `.env` matches backend URL

## 📊 API Documentation

See `backend/README.md` for detailed API documentation.

## 🎯 Roadmap

### Week 1 ✅
- [x] Replit setup + scraping single post
- [x] Playwright installed + working
- [x] Extract metadata from one LTK post

### Week 2 ✅
- [x] Handle category pages + multiple posts
- [x] Loop through post links from category page
- [x] Store results in database

### Week 3 ✅
- [x] AI captions + Supabase upload
- [x] Use OpenAI API for captioning
- [x] Store to Supabase

### Week 4 ✅
- [x] Minimal UI + export logic
- [x] Input form for scraping
- [x] Table view of scraped content
- [x] Export JSON functionality

### Post-MVP
- [ ] Bolt/Lovable integration
- [ ] Scheduling and automation
- [ ] Caption A/B testing
- [ ] Performance analytics
- [ ] Multi-user support
- [ ] Webhook notifications

## 📝 License

MIT

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for database and auth
- Playwright for web scraping
- LTK (LikeToKnow.it) platform

## 📧 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for content creators**
