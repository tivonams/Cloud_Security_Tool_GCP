ACCESS Vector DB in manage.py shell

CMD - python manage.py shell

# ================================
# 1. Imports
# ================================
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# ================================
# 2. Load the SAME embedding model used during ingestion
# ================================
embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ================================
# 3. Load existing Chroma DB
# ================================
persist_directory = settings.VECTOR_DB_PATH   # <-- change if different

vectordb = Chroma(
    persist_directory=persist_directory,
    embedding_function=embedding
)

# ================================
# 4. Access underlying collection
# ================================
collection = vectordb.collection

# Delete the current collection
vectordb.delete_collection()


# ================================
# 5. Sanity checks
# ================================
print("Total vectors:", collection.count())

# ================================
# 6. Inspect metadata (first 10)
# ================================
data = collection.get(include=["metadatas"], limit=10)
print("Sample metadata:")
for m in data["metadatas"]:
    print(m)

# ================================
# 7. Metadata-only filter (WORKING)
# ================================
gcp_data = collection.get(
    where={"provider": "gcp"},
    limit=5
)

print("\nFiltered documents (provider=aws):")
for doc, meta in zip(aws_docs["documents"], aws_docs["metadatas"]):
    print(meta)
    print(doc[:200])
    print("-" * 50)

# ================================
# 8. Similarity search WITH metadata filter (RAG-ready)
# ================================
results = vectordb.similarity_search(
    query="IAM best practices",
    k=3,
    filter={"provider": "gcp"}
)

print("\nSimilarity search results:")
for r in results:
    print(r.metadata)
    print(r.page_content[:200])
    print("=" * 60)