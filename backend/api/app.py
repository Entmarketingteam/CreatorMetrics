"""
Flask API server for LTK Scraper + Caption Generator

This module provides REST API endpoints for scraping LTK pages
and generating AI-powered captions.
"""
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any

from ..utils.config import Config
from ..utils.models import ScraperRequest, CaptionRequest, ScraperResponse, CaptionResponse
from ..utils.supabase_client import get_supabase_client
from ..scraper.ltk_scraper import scrape_ltk_url
from ..scraper.caption_generator import CaptionGenerator


# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS)

# Initialize caption generator
caption_generator = CaptionGenerator()


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "LTK Scraper API",
        "version": "0.1.0"
    })


@app.route("/api/scrape", methods=["POST"])
def scrape_ltk():
    """
    Scrape LTK URL and save results

    Request body:
    {
        "url": "https://www.shopltk.com/...",
        "max_posts": 10,
        "category": "gift_guide" (optional),
        "user_id": "uuid"
    }

    Response:
    {
        "success": true,
        "message": "Successfully scraped 10 posts",
        "posts_scraped": 10,
        "posts": [...]
    }
    """
    try:
        # Parse request
        data = request.get_json()
        scraper_request = ScraperRequest(**data)

        # Run scraper
        posts = asyncio.run(scrape_ltk_url(
            url=scraper_request.url,
            category=scraper_request.category,
            max_posts=scraper_request.max_posts
        ))

        # Save to database
        supabase = get_supabase_client()
        saved_posts = []

        for post_data in posts:
            try:
                saved_post = supabase.save_ltk_post(
                    user_id=scraper_request.user_id,
                    post_data=post_data
                )
                saved_posts.append(saved_post)
            except Exception as e:
                print(f"Error saving post: {e}")
                continue

        response = ScraperResponse(
            success=True,
            message=f"Successfully scraped {len(saved_posts)} posts",
            posts_scraped=len(saved_posts),
            posts=saved_posts
        )

        return jsonify(response.model_dump()), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": "Invalid request",
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to scrape LTK URL",
            "error": str(e)
        }), 500


@app.route("/api/generate-caption", methods=["POST"])
def generate_caption():
    """
    Generate AI caption for a post

    Request body:
    {
        "post_id": "uuid",
        "user_id": "uuid",
        "prompt_type": "gift_guide",
        "tone": "casual",
        "max_length": 250
    }

    Response:
    {
        "success": true,
        "message": "Caption generated successfully",
        "caption": {
            "caption": "...",
            "caption_type": "short",
            "hashtags": [...],
            "word_count": 45,
            "char_count": 230
        }
    }
    """
    try:
        # Parse request
        data = request.get_json()
        caption_request = CaptionRequest(**data)

        # Get post data
        supabase = get_supabase_client()
        post_with_products = supabase.get_post_with_products(caption_request.post_id)

        if not post_with_products:
            return jsonify({
                "success": False,
                "message": "Post not found",
                "error": "Invalid post_id"
            }), 404

        # Convert to PostData model
        from ..utils.models import PostData, ProductData
        from datetime import datetime

        products = [
            ProductData(**p) for p in post_with_products.get("products", [])
        ]

        post_data = PostData(
            creator_handle=post_with_products["creator_handle"],
            creator_profile_url=post_with_products["creator_profile_url"],
            post_url=post_with_products["post_url"],
            original_caption=post_with_products["original_caption"],
            products=products,
            category=post_with_products.get("category"),
            scraped_at=datetime.fromisoformat(post_with_products["scraped_at"])
        )

        # Generate caption
        generated_caption = caption_generator.generate_caption(
            post_data=post_data,
            prompt_type=caption_request.prompt_type,
            tone=caption_request.tone,
            max_length=caption_request.max_length
        )

        # Save caption to database
        saved_caption = supabase.save_generated_caption(
            user_id=caption_request.user_id,
            post_id=caption_request.post_id,
            caption=generated_caption,
            prompt_type=caption_request.prompt_type,
            tone=caption_request.tone
        )

        response = CaptionResponse(
            success=True,
            message="Caption generated successfully",
            caption=generated_caption
        )

        return jsonify(response.model_dump()), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "message": "Invalid request",
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to generate caption",
            "error": str(e)
        }), 500


@app.route("/api/posts", methods=["GET"])
def get_posts():
    """
    Get user's LTK posts

    Query params:
    - user_id: User ID (required)
    - limit: Max posts to return (default: 50)
    - offset: Offset for pagination (default: 0)

    Response:
    {
        "success": true,
        "posts": [...],
        "total": 123
    }
    """
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        supabase = get_supabase_client()
        posts = supabase.get_user_ltk_posts(user_id, limit, offset)

        return jsonify({
            "success": True,
            "posts": posts,
            "total": len(posts)
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to get posts",
            "error": str(e)
        }), 500


@app.route("/api/posts/<post_id>", methods=["GET"])
def get_post(post_id: str):
    """
    Get post with products and captions

    Response:
    {
        "success": true,
        "post": {...},
        "captions": [...]
    }
    """
    try:
        supabase = get_supabase_client()
        post = supabase.get_post_with_products(post_id)

        if not post:
            return jsonify({
                "success": False,
                "message": "Post not found"
            }), 404

        captions = supabase.get_post_captions(post_id)

        return jsonify({
            "success": True,
            "post": post,
            "captions": captions
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to get post",
            "error": str(e)
        }), 500


@app.route("/api/posts/<post_id>", methods=["DELETE"])
def delete_post(post_id: str):
    """
    Delete a post

    Query params:
    - user_id: User ID (required)

    Response:
    {
        "success": true,
        "message": "Post deleted successfully"
    }
    """
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        supabase = get_supabase_client()
        deleted = supabase.delete_post(post_id, user_id)

        if not deleted:
            return jsonify({
                "success": False,
                "message": "Post not found or unauthorized"
            }), 404

        return jsonify({
            "success": True,
            "message": "Post deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to delete post",
            "error": str(e)
        }), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """
    Get user statistics

    Query params:
    - user_id: User ID (required)

    Response:
    {
        "success": true,
        "stats": {
            "total_posts": 123,
            "total_captions": 45,
            "unique_creators": 12
        }
    }
    """
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        supabase = get_supabase_client()
        stats = supabase.get_user_stats(user_id)

        return jsonify({
            "success": True,
            "stats": stats
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to get stats",
            "error": str(e)
        }), 500


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "message": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.FLASK_DEBUG
    )
