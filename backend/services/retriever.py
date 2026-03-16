from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from django.conf import settings


def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    return Chroma(
        persist_directory=settings.VECTOR_DB_PATH,
        embedding_function=embeddings
    )


def semantic_search(query: str, top_k: int = 5, provider: str | None = None):
    vectorstore = get_vectorstore()

    filters = {}
    if provider:
        filters["provider"] = provider.lower()

    # ✅ IMPORTANT: get results WITH score
    results = vectorstore.similarity_search_with_score(
        query=query,
        k=top_k,
        filter=filters if filters else None
    )

    return [
        {
            "page_content": doc.page_content,
            "metadata": doc.metadata,
            "score": score
        }
        for doc, score in results
    ]