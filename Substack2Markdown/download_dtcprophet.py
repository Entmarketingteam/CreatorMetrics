#!/usr/bin/env python
"""
Quick runner script for downloading dtcprophet.substack.com content
"""
import subprocess
import sys

def main():
    print("=" * 60)
    print("Downloading paid content from dtcprophet.substack.com")
    print("=" * 60)
    print()

    # Ask user how many posts to download
    while True:
        num_posts = input("How many posts to download? (0 for ALL, or enter a number): ").strip()
        try:
            num_posts = int(num_posts)
            if num_posts >= 0:
                break
            print("Please enter a non-negative number")
        except ValueError:
            print("Please enter a valid number")

    # Ask if headless mode
    headless = input("Run in headless mode (no browser window)? (y/n): ").strip().lower()
    headless_flag = "--headless" if headless == 'y' else ""

    print()
    print("Starting download...")
    print("This may take a while depending on the number of posts.")
    print()

    # Build command
    cmd = [
        sys.executable,  # Use the same Python interpreter
        "substack_scraper.py",
        "--url", "https://dtcprophet.substack.com/",
        "--premium",
        "--number", str(num_posts)
    ]

    if headless_flag:
        cmd.append(headless_flag)

    try:
        # Run the scraper
        result = subprocess.run(cmd, check=True)

        print()
        print("=" * 60)
        print("✅ Download completed successfully!")
        print("=" * 60)
        print()
        print("Your files are located at:")
        print("  Markdown: substack_md_files/dtcprophet/")
        print("  HTML:     substack_html_pages/dtcprophet/")
        print()
        print("To browse articles, open: substack_html_pages/dtcprophet.html")
        print()

    except subprocess.CalledProcessError as e:
        print()
        print("=" * 60)
        print("❌ Download failed!")
        print("=" * 60)
        print()
        print("Common issues:")
        print("  1. Chrome/Edge browser not installed")
        print("  2. ChromeDriver version mismatch")
        print("  3. Invalid credentials in config.py")
        print("  4. Network issues")
        print()
        print("See SETUP_INSTRUCTIONS.md for troubleshooting help.")
        print()
        sys.exit(1)
    except KeyboardInterrupt:
        print()
        print("Download cancelled by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()
