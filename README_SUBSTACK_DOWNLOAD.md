# Substack Content Download Setup

## Overview

This repository now includes the **Substack2Markdown** tool configured to download your paid subscription content from **dtcprophet.substack.com** for LLM ingestion and analysis.

## 🎯 What's Been Set Up

### 1. Substack2Markdown Tool
- **Location**: `Substack2Markdown/` directory
- **Source**: Fork from [timf34/Substack2Markdown](https://github.com/timf34/Substack2Markdown)
- **Enhanced**: Added Chrome browser support alongside Edge

### 2. Authentication Configured
- Email: `coachethanatchley@gmail.com`
- Password: Configured in `config.py` (gitignored for security)
- Target: https://dtcprophet.substack.com/

### 3. Python Dependencies
All required packages are ready to install:
- beautifulsoup4
- selenium 4.16.0
- html2text
- requests
- tqdm
- webdriver_manager
- Markdown

## 🚀 Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
cd Substack2Markdown
python download_dtcprophet.py
```

This interactive script will:
- Ask how many posts you want to download (0 for all)
- Ask if you want headless mode
- Run the scraper with optimal settings
- Show you where the files are saved

### Option 2: Direct Command

Download ALL paid articles:
```bash
cd Substack2Markdown
python substack_scraper.py --url https://dtcprophet.substack.com/ --premium --headless --number 0
```

Download specific number of articles (e.g., 10):
```bash
python substack_scraper.py --url https://dtcprophet.substack.com/ --premium --headless --number 10
```

## 📂 Output Location

After successful download:

**Markdown Files (for LLM):**
```
Substack2Markdown/substack_md_files/dtcprophet/
├── article-1.md
├── article-2.md
└── ...
```

**HTML Files (for browsing):**
```
Substack2Markdown/substack_html_pages/dtcprophet/
├── article-1.html
├── article-2.html
└── ...
```

**Browsable Index:**
```
Substack2Markdown/substack_html_pages/dtcprophet.html
```

## 📖 Detailed Instructions

See **[Substack2Markdown/SETUP_INSTRUCTIONS.md](Substack2Markdown/SETUP_INSTRUCTIONS.md)** for:
- Complete setup guide
- Troubleshooting tips
- Browser configuration options
- Security notes
- LLM usage examples

## 🔧 Requirements

**Must Have:**
- Python 3.8+
- Google Chrome or Microsoft Edge browser
- Active internet connection
- Active Substack subscription to dtcprophet

**Operating Systems:**
- ✅ Windows
- ✅ macOS
- ✅ Linux

## ⚠️ Important Notes

### Browser Requirement
This tool requires a browser (Chrome or Edge) to handle authentication and download paid content. It cannot run in headless server environments without a browser installed.

### Credentials Security
- Your Substack credentials are stored in `Substack2Markdown/config.py`
- This file is gitignored and will NOT be committed to the repository
- Never share or commit this file

### Subscription Status
- You must have an active paid subscription to dtcprophet.substack.com
- The tool will only download content your account has access to

## 🎯 Using Downloaded Content with LLMs

The Markdown files are optimized for LLM consumption:

### 1. Direct Context
Copy entire articles into LLM prompts:
```python
with open('substack_md_files/dtcprophet/article.md', 'r') as f:
    article_content = f.read()
    # Use with your LLM API
```

### 2. RAG (Retrieval-Augmented Generation)
Index all articles for semantic search and retrieval.

### 3. Batch Analysis
Process multiple articles for:
- Topic clustering
- Sentiment analysis
- Content summarization
- Trend identification

### 4. Knowledge Base
Build a searchable knowledge base of all dtcprophet content.

## 🆘 Troubleshooting

### Common Issues

**"Chrome binary not found"**
- Install Google Chrome: https://www.google.com/chrome/
- Or use Edge by modifying the script (see SETUP_INSTRUCTIONS.md)

**"SessionNotCreatedException"**
- ChromeDriver version mismatch
- Tool will auto-download the correct version
- Ensure Chrome is updated to latest version

**"403 Forbidden" on sitemap/feed**
- This is normal for paid content
- The tool will authenticate and access content directly

**Login Fails**
- Verify credentials in `config.py`
- Check if 2FA is enabled (may need to disable temporarily)
- Try running without `--headless` to see login process

## 📊 Repository Structure

```
CreatorMetrics/
├── README_SUBSTACK_DOWNLOAD.md  (this file)
└── Substack2Markdown/
    ├── SETUP_INSTRUCTIONS.md     (detailed guide)
    ├── download_dtcprophet.py    (helper script)
    ├── substack_scraper.py       (main scraper)
    ├── config.py                 (credentials - gitignored)
    ├── requirements.txt          (dependencies)
    └── [output directories created after run]
```

## ✅ Next Steps

1. **Clone this repository**
   ```bash
   git clone https://github.com/Entmarketingteam/CreatorMetrics.git
   cd CreatorMetrics
   git checkout claude/download-paid-content-018RfurwzXFrH7usPutaR27D
   ```

2. **Install dependencies**
   ```bash
   cd Substack2Markdown
   pip install beautifulsoup4 html2text==2020.1.16 requests==2.31.0 selenium==4.16.0 tqdm==4.66.1 webdriver_manager==4.0.1 Markdown==3.6
   ```

3. **Create config.py**
   ```bash
   # File is already set up, but you can verify:
   cat config.py
   ```

4. **Run the downloader**
   ```bash
   python download_dtcprophet.py
   ```

5. **Use the content**
   - Feed Markdown files into your LLM
   - Build your knowledge base
   - Analyze the content

## 🔗 Resources

- **Substack2Markdown Original**: https://github.com/timf34/Substack2Markdown
- **dtcprophet Substack**: https://dtcprophet.substack.com/
- **Chrome WebDriver**: https://googlechromelabs.github.io/chrome-for-testing/

## 📝 License

This tool uses Substack2Markdown which is licensed under its original license. See `Substack2Markdown/LICENSE` for details.

---

**Ready to download your Substack content!** 🚀
