"""
LTK (LikeToKnow.it) Scraper using Playwright

This module provides functionality to scrape LTK creator and category pages,
extracting post metadata and product information.
"""
import asyncio
import re
from typing import List, Dict, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
from ..utils.models import PostData, ProductData


class LTKScraper:
    """Scraper for LTK (LikeToKnow.it) pages"""

    def __init__(self, headless: bool = True):
        """
        Initialize the LTK scraper

        Args:
            headless: Whether to run browser in headless mode
        """
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.playwright = None

    async def __aenter__(self):
        """Context manager entry"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def scrape_creator_page(
        self,
        url: str,
        max_posts: int = 10
    ) -> List[PostData]:
        """
        Scrape a creator's LTK page

        Args:
            url: LTK creator page URL
            max_posts: Maximum number of posts to scrape

        Returns:
            List of PostData objects
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized. Use 'async with' context manager.")

        page = await self.browser.new_page()
        posts = []

        try:
            # Navigate to the page
            await page.goto(url, wait_until="networkidle")

            # Wait for content to load
            await page.wait_for_selector('[data-testid="post-card"], .post-card, article', timeout=10000)

            # Scroll to load more content
            await self._scroll_page(page, max_scrolls=5)

            # Extract creator information
            creator_info = await self._extract_creator_info(page)

            # Extract post cards
            post_elements = await page.query_selector_all('[data-testid="post-card"], .post-card, article')

            for i, element in enumerate(post_elements[:max_posts]):
                try:
                    post_data = await self._extract_post_data(page, element, creator_info)
                    if post_data:
                        posts.append(post_data)
                except Exception as e:
                    print(f"Error extracting post {i}: {e}")
                    continue

        except Exception as e:
            print(f"Error scraping creator page: {e}")
        finally:
            await page.close()

        return posts

    async def scrape_category_page(
        self,
        url: str,
        category: str,
        max_posts: int = 10
    ) -> List[PostData]:
        """
        Scrape an LTK category page

        Args:
            url: LTK category page URL
            category: Category name
            max_posts: Maximum number of posts to scrape

        Returns:
            List of PostData objects
        """
        if not self.browser:
            raise RuntimeError("Browser not initialized. Use 'async with' context manager.")

        page = await self.browser.new_page()
        posts = []

        try:
            # Navigate to the page
            await page.goto(url, wait_until="networkidle")

            # Wait for content to load
            await page.wait_for_selector('[data-testid="post-card"], .post-card, article', timeout=10000)

            # Scroll to load more content
            await self._scroll_page(page, max_scrolls=5)

            # Extract post cards from category page
            post_elements = await page.query_selector_all('[data-testid="post-card"], .post-card, article')

            for i, element in enumerate(post_elements[:max_posts]):
                try:
                    post_data = await self._extract_category_post_data(page, element, category)
                    if post_data:
                        posts.append(post_data)
                except Exception as e:
                    print(f"Error extracting category post {i}: {e}")
                    continue

        except Exception as e:
            print(f"Error scraping category page: {e}")
        finally:
            await page.close()

        return posts

    async def _scroll_page(self, page: Page, max_scrolls: int = 5):
        """
        Scroll the page to load dynamic content

        Args:
            page: Playwright page object
            max_scrolls: Maximum number of scrolls
        """
        for _ in range(max_scrolls):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)  # Wait for content to load

    async def _extract_creator_info(self, page: Page) -> Dict[str, str]:
        """
        Extract creator information from the page

        Args:
            page: Playwright page object

        Returns:
            Dictionary with creator info
        """
        creator_info = {
            "handle": "",
            "profile_url": page.url
        }

        try:
            # Try to find creator handle in various selectors
            handle_selectors = [
                '[data-testid="creator-handle"]',
                '.creator-handle',
                '.profile-username',
                'h1',
                '.creator-name'
            ]

            for selector in handle_selectors:
                element = await page.query_selector(selector)
                if element:
                    handle = await element.inner_text()
                    creator_info["handle"] = handle.strip().replace("@", "")
                    break

            # If still no handle, try to extract from URL
            if not creator_info["handle"]:
                match = re.search(r'ltk\.com/([^/]+)', page.url)
                if match:
                    creator_info["handle"] = match.group(1)

        except Exception as e:
            print(f"Error extracting creator info: {e}")

        return creator_info

    async def _extract_post_data(
        self,
        page: Page,
        element,
        creator_info: Dict[str, str]
    ) -> Optional[PostData]:
        """
        Extract post data from a post element

        Args:
            page: Playwright page object
            element: Post element
            creator_info: Creator information dictionary

        Returns:
            PostData object or None
        """
        try:
            # Extract post URL
            post_link = await element.query_selector('a[href*="/post/"], a[href*="/p/"]')
            post_url = ""
            if post_link:
                href = await post_link.get_attribute("href")
                if href:
                    post_url = href if href.startswith("http") else f"https://www.shopltk.com{href}"

            # Extract caption
            caption_elem = await element.query_selector('[data-testid="caption"], .caption, .post-caption')
            caption = ""
            if caption_elem:
                caption = await caption_elem.inner_text()

            # Extract products
            products = await self._extract_products(element)

            if not caption and not products:
                return None

            return PostData(
                creator_handle=creator_info.get("handle", "unknown"),
                creator_profile_url=creator_info.get("profile_url", ""),
                post_url=post_url or page.url,
                original_caption=caption.strip(),
                products=products,
                category=None
            )

        except Exception as e:
            print(f"Error extracting post data: {e}")
            return None

    async def _extract_category_post_data(
        self,
        page: Page,
        element,
        category: str
    ) -> Optional[PostData]:
        """
        Extract post data from a category page post element

        Args:
            page: Playwright page object
            element: Post element
            category: Category name

        Returns:
            PostData object or None
        """
        try:
            # Extract creator handle
            creator_elem = await element.query_selector('[data-testid="creator-name"], .creator-name, .username')
            creator_handle = "unknown"
            if creator_elem:
                creator_text = await creator_elem.inner_text()
                creator_handle = creator_text.strip().replace("@", "")

            # Extract post URL
            post_link = await element.query_selector('a[href*="/post/"], a[href*="/p/"]')
            post_url = ""
            if post_link:
                href = await post_link.get_attribute("href")
                if href:
                    post_url = href if href.startswith("http") else f"https://www.shopltk.com{href}"

            # Extract caption
            caption_elem = await element.query_selector('[data-testid="caption"], .caption, .post-caption')
            caption = ""
            if caption_elem:
                caption = await caption_elem.inner_text()

            # Extract products
            products = await self._extract_products(element)

            if not caption and not products:
                return None

            return PostData(
                creator_handle=creator_handle,
                creator_profile_url=f"https://www.shopltk.com/{creator_handle}",
                post_url=post_url or page.url,
                original_caption=caption.strip(),
                products=products,
                category=category
            )

        except Exception as e:
            print(f"Error extracting category post data: {e}")
            return None

    async def _extract_products(self, element) -> List[ProductData]:
        """
        Extract product information from a post element

        Args:
            element: Post element

        Returns:
            List of ProductData objects
        """
        products = []

        try:
            # Find product elements
            product_elements = await element.query_selector_all('[data-testid="product-card"], .product-card, .product-item')

            for prod_elem in product_elements:
                try:
                    # Extract product title
                    title_elem = await prod_elem.query_selector('[data-testid="product-title"], .product-title, .product-name')
                    title = ""
                    if title_elem:
                        title = await title_elem.inner_text()

                    # Extract merchant
                    merchant_elem = await prod_elem.query_selector('[data-testid="merchant"], .merchant, .brand')
                    merchant = ""
                    if merchant_elem:
                        merchant = await merchant_elem.inner_text()

                    # Extract product URL
                    product_link = await prod_elem.query_selector('a[href]')
                    product_url = ""
                    if product_link:
                        href = await product_link.get_attribute("href")
                        if href:
                            product_url = href if href.startswith("http") else f"https://www.shopltk.com{href}"

                    # Extract image URL
                    image_elem = await prod_elem.query_selector('img')
                    image_url = None
                    if image_elem:
                        image_url = await image_elem.get_attribute("src")

                    if title and product_url:
                        products.append(ProductData(
                            title=title.strip(),
                            merchant=merchant.strip() or "Unknown",
                            product_url=product_url,
                            image_url=image_url
                        ))

                except Exception as e:
                    print(f"Error extracting product: {e}")
                    continue

        except Exception as e:
            print(f"Error extracting products: {e}")

        return products


async def scrape_ltk_url(
    url: str,
    category: Optional[str] = None,
    max_posts: int = 10
) -> List[PostData]:
    """
    Convenience function to scrape an LTK URL

    Args:
        url: LTK URL to scrape
        category: Category name (if scraping a category page)
        max_posts: Maximum number of posts to scrape

    Returns:
        List of PostData objects
    """
    async with LTKScraper(headless=True) as scraper:
        if category:
            return await scraper.scrape_category_page(url, category, max_posts)
        else:
            return await scraper.scrape_creator_page(url, max_posts)
