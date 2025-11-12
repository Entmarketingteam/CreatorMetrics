"""
Main entry point for LTK Scraper backend

Run with: python -m backend.main
"""
from api.app import app
from utils.config import Config

if __name__ == "__main__":
    print("🚀 Starting LTK Scraper API Server...")
    print(f"📍 Environment: {Config.FLASK_ENV}")
    print(f"🔗 Port: {Config.PORT}")
    print(f"🌐 CORS Origins: {', '.join(Config.CORS_ORIGINS)}")
    print("\n✅ Server is ready!")

    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.FLASK_DEBUG
    )
