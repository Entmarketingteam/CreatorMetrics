"""
Configuration management for LTK Scraper backend
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration"""

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # Flask
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
    PORT = int(os.getenv("PORT", 5000))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    @classmethod
    def validate(cls):
        """Validate that all required environment variables are set"""
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_KEY",
            "OPENAI_API_KEY"
        ]

        missing = []
        for var in required_vars:
            if not getattr(cls, var):
                missing.append(var)

        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Please check your .env file."
            )


# Validate configuration on import
try:
    Config.validate()
except ValueError as e:
    print(f"⚠️  Configuration Warning: {e}")
