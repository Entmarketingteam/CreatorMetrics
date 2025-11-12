"""
Supabase client for LTK Scraper data persistence

This module provides functions to interact with Supabase database
for storing and retrieving LTK posts, products, and generated captions.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from supabase import create_client, Client
from .config import Config
from .models import PostData, ProductData, GeneratedCaption


class SupabaseClient:
    """Client for interacting with Supabase database"""

    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """
        Initialize Supabase client

        Args:
            url: Supabase URL (uses config if not provided)
            key: Supabase anon key (uses config if not provided)
        """
        self.url = url or Config.SUPABASE_URL
        self.key = key or Config.SUPABASE_KEY

        if not self.url or not self.key:
            raise ValueError("Supabase URL and key are required")

        self.client: Client = create_client(self.url, self.key)

    def save_ltk_post(
        self,
        user_id: str,
        post_data: PostData
    ) -> Dict[str, Any]:
        """
        Save LTK post to database

        Args:
            user_id: User ID who initiated the scrape
            post_data: Post data to save

        Returns:
            Saved post record
        """
        # Prepare post data
        post_record = {
            "user_id": user_id,
            "creator_handle": post_data.creator_handle,
            "creator_profile_url": post_data.creator_profile_url,
            "post_url": post_data.post_url,
            "original_caption": post_data.original_caption,
            "category": post_data.category,
            "scraped_at": post_data.scraped_at.isoformat()
        }

        # Insert post
        result = self.client.table("ltk_posts").insert(post_record).execute()

        if not result.data:
            raise Exception("Failed to save LTK post")

        post_id = result.data[0]["id"]

        # Save associated products
        if post_data.products:
            self._save_products(post_id, post_data.products)

        return result.data[0]

    def _save_products(
        self,
        post_id: str,
        products: List[ProductData]
    ) -> List[Dict[str, Any]]:
        """
        Save products associated with a post

        Args:
            post_id: Post ID
            products: List of product data

        Returns:
            List of saved product records
        """
        product_records = [
            {
                "post_id": post_id,
                "title": product.title,
                "merchant": product.merchant,
                "product_url": product.product_url,
                "image_url": product.image_url
            }
            for product in products
        ]

        if not product_records:
            return []

        result = self.client.table("ltk_products").insert(product_records).execute()

        return result.data if result.data else []

    def save_generated_caption(
        self,
        user_id: str,
        post_id: str,
        caption: GeneratedCaption,
        prompt_type: str,
        tone: str
    ) -> Dict[str, Any]:
        """
        Save generated caption to database

        Args:
            user_id: User ID
            post_id: Post ID
            caption: Generated caption data
            prompt_type: Prompt type used
            tone: Tone used

        Returns:
            Saved caption record
        """
        caption_record = {
            "user_id": user_id,
            "post_id": post_id,
            "caption": caption.caption,
            "caption_type": caption.caption_type,
            "prompt_type": prompt_type,
            "tone": tone,
            "hashtags": caption.hashtags,
            "word_count": caption.word_count,
            "char_count": caption.char_count
        }

        result = self.client.table("generated_captions").insert(caption_record).execute()

        if not result.data:
            raise Exception("Failed to save generated caption")

        return result.data[0]

    def get_user_ltk_posts(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get LTK posts for a user

        Args:
            user_id: User ID
            limit: Maximum number of posts to return
            offset: Offset for pagination

        Returns:
            List of post records
        """
        result = (
            self.client.table("ltk_posts")
            .select("*")
            .eq("user_id", user_id)
            .order("scraped_at", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )

        return result.data if result.data else []

    def get_post_with_products(
        self,
        post_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get post with associated products

        Args:
            post_id: Post ID

        Returns:
            Post record with products, or None
        """
        # Get post
        post_result = (
            self.client.table("ltk_posts")
            .select("*")
            .eq("id", post_id)
            .execute()
        )

        if not post_result.data:
            return None

        post = post_result.data[0]

        # Get products
        products_result = (
            self.client.table("ltk_products")
            .select("*")
            .eq("post_id", post_id)
            .execute()
        )

        post["products"] = products_result.data if products_result.data else []

        return post

    def get_post_captions(
        self,
        post_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get generated captions for a post

        Args:
            post_id: Post ID

        Returns:
            List of caption records
        """
        result = (
            self.client.table("generated_captions")
            .select("*")
            .eq("post_id", post_id)
            .order("created_at", desc=True)
            .execute()
        )

        return result.data if result.data else []

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get statistics for a user's LTK scraping activity

        Args:
            user_id: User ID

        Returns:
            Dictionary with stats
        """
        # Count posts
        posts_result = (
            self.client.table("ltk_posts")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total_posts = posts_result.count if posts_result.count else 0

        # Count captions
        captions_result = (
            self.client.table("generated_captions")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total_captions = captions_result.count if captions_result.count else 0

        # Get unique creators
        creators_result = (
            self.client.table("ltk_posts")
            .select("creator_handle")
            .eq("user_id", user_id)
            .execute()
        )

        unique_creators = set()
        if creators_result.data:
            unique_creators = {post["creator_handle"] for post in creators_result.data}

        return {
            "total_posts": total_posts,
            "total_captions": total_captions,
            "unique_creators": len(unique_creators)
        }

    def delete_post(self, post_id: str, user_id: str) -> bool:
        """
        Delete a post and its associated data

        Args:
            post_id: Post ID
            user_id: User ID (for authorization)

        Returns:
            True if deleted successfully
        """
        result = (
            self.client.table("ltk_posts")
            .delete()
            .eq("id", post_id)
            .eq("user_id", user_id)
            .execute()
        )

        return len(result.data) > 0 if result.data else False

    def search_posts(
        self,
        user_id: str,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search posts by creator handle or caption

        Args:
            user_id: User ID
            query: Search query
            limit: Maximum results

        Returns:
            List of matching posts
        """
        result = (
            self.client.table("ltk_posts")
            .select("*")
            .eq("user_id", user_id)
            .or_(f"creator_handle.ilike.%{query}%,original_caption.ilike.%{query}%")
            .limit(limit)
            .execute()
        )

        return result.data if result.data else []


# Convenience function to get a client instance
def get_supabase_client() -> SupabaseClient:
    """
    Get a Supabase client instance

    Returns:
        SupabaseClient instance
    """
    return SupabaseClient()
