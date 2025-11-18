# Downloading dtcprophet.substack.com Content - Setup Instructions

## ✅ What's Already Configured

This repository has been set up with:
- **Substack2Markdown tool** integrated with Chrome browser support
- **Python dependencies** specified in `requirements.txt`
- **Credentials configured** in `config.py` (gitignored for security)
- **Target Substack**: dtcprophet.substack.com

## 🚀 Running Locally on Your Machine

Since the cloud environment doesn't have browser support, follow these steps to run the scraper on your local machine:

### Step 1: Prerequisites

Ensure you have installed:
- **Python 3.8+**
- **Google Chrome** browser (or Microsoft Edge)
- **Git**

### Step 2: Clone the Repository

```bash
git clone https://github.com/Entmarketingteam/CreatorMetrics.git
cd CreatorMetrics
git checkout claude/download-paid-content-018RfurwzXFrH7usPutaR27D
cd Substack2Markdown
```

### Step 3: Set Up Python Environment

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install beautifulsoup4 html2text==2020.1.16 requests==2.31.0 selenium==4.16.0 tqdm==4.66.1 webdriver_manager==4.0.1 Markdown==3.6
```

### Step 4: Configure Credentials

Create a `config.py` file in the `Substack2Markdown` directory:

```python
EMAIL = "coachethanatchley@gmail.com"
PASSWORD = "1Football"
```

### Step 5: Run the Scraper

To download **ALL** paid articles from dtcprophet:

```bash
python substack_scraper.py --url https://dtcprophet.substack.com/ --premium --headless --number 0
```

**Command Options:**
- `--url`: The Substack URL to scrape
- `--premium`: Enable authentication to download paid content
- `--headless`: Run browser in headless mode (no GUI)
- `--number 0`: Download ALL posts (use a specific number like `--number 10` for just 10 posts)

### Step 6: Access Downloaded Content

After running successfully, you'll find:

**Markdown Files** (for LLM ingestion):
```
Substack2Markdown/substack_md_files/dtcprophet/
```

**HTML Files** (for browsing):
```
Substack2Markdown/substack_html_pages/dtcprophet/
```

**Browsable Interface**:
Open `Substack2Markdown/substack_html_pages/dtcprophet.html` in your browser to browse all downloaded articles with sorting by date or likes.

## 📊 Using Content with LLMs

The Markdown files in `substack_md_files/dtcprophet/` are ready for LLM ingestion:

1. **Single Article**: Copy individual `.md` files
2. **Batch Processing**: Use the entire directory
3. **RAG Systems**: Index all markdown files for retrieval-augmented generation

## 🔧 Troubleshooting

### Chrome Driver Issues

If you encounter driver errors:
```bash
# The tool will auto-download the correct ChromeDriver
# If it fails, manually download from:
# https://googlechromelabs.github.io/chrome-for-testing/
```

### Using Microsoft Edge Instead

If you prefer Edge over Chrome, modify line 599 in `substack_scraper.py`:
```python
browser='edge'  # Change from 'chrome' to 'edge'
```

### Login Issues

If login fails:
- Verify credentials in `config.py`
- Check if Substack has 2FA enabled (may need to disable temporarily)
- Try running without `--headless` to see what's happening

## 📁 Output Structure

```
substack_md_files/
└── dtcprophet/
    ├── article-1.md
    ├── article-2.md
    └── ...

substack_html_pages/
└── dtcprophet/
    ├── article-1.html
    ├── article-2.html
    └── ...

substack_html_pages/dtcprophet.html  (browsable index)

data/
└── dtcprophet.json  (metadata)
```

## 🔐 Security Notes

- `config.py` is gitignored and won't be committed
- Keep your credentials secure
- The password in config.py is in plaintext - don't share the file

## ✨ Next Steps After Download

Once you have the Markdown files:

1. **Feed into LLM**: Use the `.md` files as context for analysis
2. **Build Knowledge Base**: Index files for semantic search
3. **Analysis**: Process content for insights, summaries, etc.
4. **Backup**: Archive the downloaded content

## 🆘 Need Help?

If you encounter issues:
1. Check Chrome/ChromeDriver version compatibility
2. Verify internet connection for downloading articles
3. Ensure Substack subscription is active
4. Try running a small test first: `--number 5`
