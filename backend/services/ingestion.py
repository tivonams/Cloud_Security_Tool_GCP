import hashlib
from bs4 import BeautifulSoup
import urllib.parse

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_community.document_loaders import RecursiveUrlLoader
import scrapy
from scrapy.crawler import CrawlerRunner
from crochet import setup, wait_for

setup()

from apps.documents.models import Document
from django.conf import settings

class CustomSpider(scrapy.Spider):
    name = "custom_spider"

    def __init__(self, url, max_depth=2, *args, **kwargs):
        super(CustomSpider, self).__init__(*args, **kwargs)
        self.start_urls = [url]
        self.max_depth = max_depth
        self.results = []

    def parse(self, response):
        if response.status != 200:
            return

        # Extract text content (similar to the previous BeautifulSoup logic but more direct)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove non-content / UI / devsite junk
        for tag in soup([
            "script", "style", "nav", "footer", "header", "svg", "img",
            "devsite-toc", "devsite-actions", "noscript", "aside",
        ]):
            tag.decompose()

        text = soup.get_text(separator=" ")
        text = " ".join(text.split())

        if len(text) > 200:
            self.results.append(text)

        # Handle depth - this is a simplified version of recursion
        if self.max_depth > 0:
            for link in response.css('a::attr(href)').getall():
                yield response.follow(link, self.parse, cb_kwargs={'depth': 1})

@wait_for(timeout=60.0)
def run_spider(url, max_depth=2):
    runner = CrawlerRunner()
    spider_instance = CustomSpider(url=url, max_depth=max_depth)
    deferred = runner.crawl(CustomSpider, url=url, max_depth=max_depth)
    
    # This is a bit tricky with CrawlerRunner to get the instance results.
    # Alternatively, we can use a signal or a more standard Scrapy pipeline, 
    # but for simplicity in a single file:
    return deferred

# Harder to get data back from CrawlerRunner deferred directly into the return value without more boilerplate.
# Let's adjust the implementation to be more robust for getting results back.

class IngestionSpider(scrapy.Spider):
    name = "ingestion_spider"

    def __init__(self, url, max_depth=2, results_list=None, *args, **kwargs):
        super(IngestionSpider, self).__init__(*args, **kwargs)
        self.start_urls = [url]
        self.max_depth = max_depth
        self.results_list = results_list if results_list is not None else []
        
        # Keep spider on the same domain
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        if domain:
            self.allowed_domains = [domain]

    def parse(self, response):
        print(f"ℹ️ Scrapy parsing {response.url}, status: {response.status}", flush=True)
        soup = BeautifulSoup(response.text, "html.parser")

        # 1. Detect if this is an AWS landing page (uses hidden XML for content)
        xml_content = ""
        xml_input = soup.find('input', id='landing-page-xml')
        if xml_input and xml_input.get('value'):
            try:
                decoded_xml = urllib.parse.unquote(xml_input.get('value'))
                xml_soup = BeautifulSoup(decoded_xml, "xml")
                # Extract text from the decoded XML
                xml_content = xml_soup.get_text(separator=" ")
                print(f"ℹ️ Decoded AWS landing-page-xml: {len(xml_content)} characters", flush=True)
            except Exception as e:
                print(f"⚠️ Failed to decode AWS landing-page-xml: {e}", flush=True)

        # 2. Refine cleaning and extraction
        # Don't decompose all inputs, as AWS uses them for content metadata
        for tag in soup([
            "script", "style", "nav", "footer", "header", "svg", "img", 
            "devsite-toc", "devsite-actions", "noscript", "aside",
            "button", "form", "label", "textarea"
        ]):
            tag.decompose()

        # Try specific content selectors first for better precision
        main_content = soup.find(id='main-col') or soup.find(class_='awsdocs-content') or soup.find('main')
        if main_content:
            text = main_content.get_text(separator=" ")
        else:
            text = soup.get_text(separator=" ")

        # Combine with XML content if found
        if xml_content:
            text = f"{text}\n\n{xml_content}"

        text = " ".join(text.split())
        print(f"ℹ️ Extracted {len(text)} characters from {response.url}", flush=True)
        if len(text) > 200: 
            # Store as tuple (url, text) for stable sorting later
            self.results_list.append((response.url, text))

        # Follow links recursively (Scrapy handles DEPTH_LIMIT automatically)
        for href in response.css("a::attr(href)").getall():
            yield response.follow(href, self.parse)

@wait_for(timeout=900.0)
def scrape_with_scrapy(url, max_depth=2):
    results = []
    runner = CrawlerRunner(settings={
        'DEPTH_LIMIT': max_depth,
        'LOG_LEVEL': 'INFO',
        'ROBOTSTXT_OBEY': False,
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'CLOSESPIDER_PAGECOUNT': 100,
        'TWISTED_REACTOR': 'twisted.internet.epollreactor.EPollReactor',
    })
    deferred = runner.crawl(IngestionSpider, url=url, max_depth=max_depth, results_list=results)
    deferred.addCallback(lambda _: results)
    return deferred

def fetch_and_clean_text(url: str, max_depth: int = 2) -> str:
    """
    Fetched pages using Scrapy and extracts clean text.
    Old RecursiveUrlLoader logic is commented out.
    """
    # loader = RecursiveUrlLoader(
    #     url=url,
    #     max_depth=max_depth,
    # )
    # documents = loader.load()
    # cleaned_pages = []
    # for doc in documents:
    #     html = doc.page_content
    #     if not html:
    #         continue
    #     soup = BeautifulSoup(html, "html.parser")
    #     for tag in soup(["script", "style", "nav", "footer", "header", "svg", "img", "devsite-toc", "devsite-actions", "noscript", "aside"]):
    #         tag.decompose()
    #     text = soup.get_text(separator=" ")
    #     text = " ".join(text.split())
    #     if len(text) > 200:
    #         cleaned_pages.append(text)
    # return "\n\n".join(cleaned_pages)

    cleaned_pages_data = scrape_with_scrapy(url, max_depth)
    print(f"ℹ️ Scraped {len(cleaned_pages_data)} pages from {url}", flush=True)
    
    # Sort by URL to ensure stable hash regardless of Scrapy traversal order
    cleaned_pages_data.sort(key=lambda x: x[0])
    
    # Debug: Log first and last URLs to verify sorting
    if cleaned_pages_data:
        print(f"🔍 First URL: {cleaned_pages_data[0][0]}", flush=True)
        print(f"🔍 Last URL: {cleaned_pages_data[-1][0]}", flush=True)
    
    # Extract only the text for joining
    texts = [item[1] for item in cleaned_pages_data]
    return "\n\n".join(texts)

def generate_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def chunk_text(text: str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", " "],
    )
    return splitter.split_text(text)

def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    return Chroma(
        persist_directory=settings.VECTOR_DB_PATH,
        embedding_function=embeddings,
    )

def is_valid_doc_text(text: str) -> bool:
    if not text:
        return False
    # Filter out very short chunks
    if len(text) < 150: 
        return False
    # Filter out chunks that look like HTML entities or noise
    if text.count("&quot;") > 3:
        return False
    
    # Filter out common UI/Boilerplate strings
    noise_patterns = [
        "Grow your career",
        "page help you?",
        "Thanks for letting us know",
        "Was this page helpful?",
        "Tell us what we did right",
        "privacy policy",
        "terms of service",
        "cookie settings",
        "sign in",
        "sign up",
    ]
    
    for pattern in noise_patterns:
        if pattern.lower() in text.lower():
            return False
            
    return True

def ingest_document(title: str, url: str, provider: str, version: str = None):
    # 1️⃣ Fetch + clean
    raw_text = fetch_and_clean_text(url)

    if not raw_text:
        print(f"⚠️ No content fetched from {url}", flush=True)
        raise ValueError("No content fetched from the provided URL. The page might be empty, requiring JavaScript, or blocking scrapers.")


    content_hash = generate_hash(raw_text)
    print(f"ℹ️ Generated hash {content_hash} for {len(raw_text)} chars from {url}", flush=True)

    # 2️⃣ DB metadata
    doc, created = Document.objects.get_or_create(
        source_url=url,
        defaults={
            "title": title,
            "provider": provider,
            "version": version,
            "content_hash": content_hash,
        },
    )

    # 3️⃣ Skip unchanged
    if not created and doc.content_hash == content_hash and doc.is_indexed:
        print("⚠️ Document unchanged and already indexed. Skipping.")
        return

    # 4️⃣ Chunk clean text
    chunks = chunk_text(raw_text)

    # 5️⃣ Validate chunks
    valid_chunks = [
        c for c in chunks
        if is_valid_doc_text(c)
    ]

    if not valid_chunks:
        print(f"⚠️ No useful chunks found for {url}", flush=True)
        raise ValueError("No useful text chunks could be extracted from the content.")


      # 6️⃣ Embed (CLEANUP + BATCH INSERT)
    vectorstore = get_vectorstore()

    # Explicitly clear old chunks for this source to prevent "ghost" data if new scan is smaller
    try:
        print(f"🧹 Cleaning up old chunks for {url}...", flush=True)
        vectorstore.delete(where={"source": url})
    except Exception as e:
        print(f"⚠️ Cleanup failed (normal if first time): {e}", flush=True)

    try:
        BATCH_SIZE = 1000  # ✅ safe value (can keep 500 also)

        metadatas = [
            {
                "source": url,
                "provider": provider,
                "title": title,
            }
            for _ in valid_chunks
        ]

        for i in range(0, len(valid_chunks), BATCH_SIZE):
            batch_texts = valid_chunks[i:i + BATCH_SIZE]
            batch_metas = metadatas[i:i + BATCH_SIZE]

            batch_ids = [
                f"{provider}:{generate_hash(url)}:{i+j}"
                for j in range(len(batch_texts))
            ]

            vectorstore.add_texts(
                texts=batch_texts,
                metadatas=batch_metas,
                ids=batch_ids
            )


            print(f"✅ Inserted {min(i + BATCH_SIZE, len(valid_chunks))}/{len(valid_chunks)} chunks", flush=True)

    except Exception as e:
        print(f"❌ Vector insertion failed: {e}", flush=True)
        return


    # 7️⃣ Update DB state
    doc.content_hash = content_hash
    doc.is_indexed = True
    doc.save()

    print(f"✅ Ingested {len(valid_chunks)} chunks from {url}", flush=True)

def delete_document(url: str):
    """
    Deletes a document from both the database and the vector store.
    """
    # 1. Delete from Vector Store
    try:
        vectorstore = get_vectorstore()
        print(f"🧹 Deleting chunks for {url} from vector store...", flush=True)
        vectorstore.delete(where={"source": url})
    except Exception as e:
        print(f"⚠️ Vector store deletion failed for {url}: {e}", flush=True)

    # 2. Delete from Database
    try:
        deleted_count, _ = Document.objects.filter(source_url=url).delete()
        if deleted_count > 0:
            print(f"✅ Deleted document record for {url} from database.", flush=True)
        else:
            print(f"⚠️ No document record found for {url} in database.", flush=True)
    except Exception as e:
        print(f"❌ Database deletion failed for {url}: {e}", flush=True)
        raise e
