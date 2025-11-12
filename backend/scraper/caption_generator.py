"""
AI-powered Caption Generator using OpenAI GPT-4

This module provides functionality to generate engaging social media captions
based on LTK post data and product information.
"""
import re
from typing import List, Optional
from openai import OpenAI
from ..utils.config import Config
from ..utils.models import PostData, ProductData, GeneratedCaption


# Prompt templates for different caption types
PROMPT_TEMPLATES = {
    "gift_guide": """Create a fun, upbeat caption for a gift guide post featuring these products:
{products}

Original caption context: {caption}

Requirements:
- Write a punchy hook with an emoji
- Highlight the top 3 products
- Keep it casual and friendly
- Maximum {max_length} characters
- Include relevant hashtags
- Focus on gifting angle and value

Tone: {tone}""",

    "sale_alert": """Write a punchy caption about these sale items:
{products}

Original caption context: {caption}

Requirements:
- Create urgency and excitement
- Mention price/deal if visible
- Add a strong call-to-action (shop fast!)
- Use emojis strategically
- Maximum {max_length} characters
- Include relevant hashtags

Tone: {tone}""",

    "product_roundup": """Create an engaging caption for this product roundup:
{products}

Original caption context: {caption}

Requirements:
- Start with an attention-grabbing hook
- Showcase product variety
- Keep it conversational and relatable
- Maximum {max_length} characters
- Include relevant hashtags
- Make it shoppable and actionable

Tone: {tone}""",

    "seasonal": """Write a seasonal/trending caption for these featured products:
{products}

Original caption context: {caption}

Requirements:
- Connect to current season/trend
- Create FOMO (fear of missing out)
- Use trending phrases naturally
- Maximum {max_length} characters
- Include relevant hashtags
- Make it timely and relevant

Tone: {tone}""",

    "lifestyle": """Create a lifestyle-focused caption for these products:
{products}

Original caption context: {caption}

Requirements:
- Tell a relatable story or scenario
- Focus on lifestyle benefits
- Keep it authentic and personal
- Maximum {max_length} characters
- Include relevant hashtags
- Make readers envision using the products

Tone: {tone}""",
}


class CaptionGenerator:
    """AI-powered caption generator using OpenAI"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the caption generator

        Args:
            api_key: OpenAI API key (uses config if not provided)
        """
        self.api_key = api_key or Config.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OpenAI API key is required")

        self.client = OpenAI(api_key=self.api_key)

    def generate_caption(
        self,
        post_data: PostData,
        prompt_type: str = "gift_guide",
        tone: str = "casual",
        max_length: int = 250,
        caption_type: str = "short"
    ) -> GeneratedCaption:
        """
        Generate a caption for a post

        Args:
            post_data: Post data to generate caption for
            prompt_type: Type of prompt template to use
            tone: Tone of the caption (casual, professional, fun, upbeat)
            max_length: Maximum character length
            caption_type: Type of caption (short, long, alt_text)

        Returns:
            GeneratedCaption object
        """
        # Get prompt template
        template = PROMPT_TEMPLATES.get(prompt_type, PROMPT_TEMPLATES["product_roundup"])

        # Format products for prompt
        products_text = self._format_products(post_data.products)

        # Build prompt
        prompt = template.format(
            products=products_text,
            caption=post_data.original_caption[:200],  # Limit context
            max_length=max_length,
            tone=tone
        )

        # Generate caption using GPT-4
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert social media caption writer for influencer marketing. You create engaging, authentic captions that drive clicks and sales."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=max_length * 2,  # Roughly 2 chars per token
            temperature=0.8,  # Creative but controlled
        )

        # Extract generated caption
        caption_text = response.choices[0].message.content.strip()

        # Extract hashtags
        hashtags = self._extract_hashtags(caption_text)

        # Calculate metrics
        word_count = len(caption_text.split())
        char_count = len(caption_text)

        return GeneratedCaption(
            caption=caption_text,
            caption_type=caption_type,
            hashtags=hashtags,
            word_count=word_count,
            char_count=char_count
        )

    def generate_multiple_variants(
        self,
        post_data: PostData,
        prompt_type: str = "gift_guide",
        tone: str = "casual",
        num_variants: int = 3
    ) -> List[GeneratedCaption]:
        """
        Generate multiple caption variants

        Args:
            post_data: Post data to generate captions for
            prompt_type: Type of prompt template to use
            tone: Tone of the caption
            num_variants: Number of variants to generate

        Returns:
            List of GeneratedCaption objects
        """
        variants = []

        for i in range(num_variants):
            try:
                caption = self.generate_caption(
                    post_data=post_data,
                    prompt_type=prompt_type,
                    tone=tone,
                    max_length=250 if i == 0 else 150 if i == 1 else 100,
                    caption_type="short" if i == 0 else "long" if i == 1 else "alt_text"
                )
                variants.append(caption)
            except Exception as e:
                print(f"Error generating variant {i}: {e}")

        return variants

    def _format_products(self, products: List[ProductData]) -> str:
        """
        Format products for inclusion in prompt

        Args:
            products: List of product data

        Returns:
            Formatted string of products
        """
        if not products:
            return "No specific products mentioned"

        formatted = []
        for i, product in enumerate(products[:5], 1):  # Limit to top 5
            formatted.append(
                f"{i}. {product.title} from {product.merchant}"
            )

        return "\n".join(formatted)

    def _extract_hashtags(self, text: str) -> List[str]:
        """
        Extract hashtags from text

        Args:
            text: Text to extract hashtags from

        Returns:
            List of hashtags (without # symbol)
        """
        hashtags = re.findall(r'#(\w+)', text)
        return hashtags

    def generate_hashtags(
        self,
        post_data: PostData,
        category: Optional[str] = None,
        max_hashtags: int = 10
    ) -> List[str]:
        """
        Generate relevant hashtags for a post

        Args:
            post_data: Post data
            category: Category of the post
            max_hashtags: Maximum number of hashtags

        Returns:
            List of hashtag strings (without #)
        """
        prompt = f"""Generate {max_hashtags} relevant Instagram hashtags for a post about:

Products: {self._format_products(post_data.products)}
Category: {category or 'general shopping'}
Original caption: {post_data.original_caption[:100]}

Requirements:
- Mix of popular and niche hashtags
- Relevant to products and category
- Include shopping/affiliate related tags
- Format: Return only hashtags separated by commas, without # symbol
"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a social media hashtag expert."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=200,
            temperature=0.7,
        )

        # Parse hashtags from response
        hashtags_text = response.choices[0].message.content.strip()
        hashtags = [
            tag.strip().replace("#", "")
            for tag in hashtags_text.split(",")
        ]

        return hashtags[:max_hashtags]


def generate_caption_from_post(
    post_data: PostData,
    prompt_type: str = "gift_guide",
    tone: str = "casual",
    max_length: int = 250
) -> GeneratedCaption:
    """
    Convenience function to generate a caption from post data

    Args:
        post_data: Post data
        prompt_type: Type of prompt template
        tone: Tone of caption
        max_length: Maximum character length

    Returns:
        GeneratedCaption object
    """
    generator = CaptionGenerator()
    return generator.generate_caption(
        post_data=post_data,
        prompt_type=prompt_type,
        tone=tone,
        max_length=max_length
    )
