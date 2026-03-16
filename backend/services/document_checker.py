#this function is called in cron job

from apps.documents.models import Document
from services.ingestion import ingest_document


def check_all_documents():

    #runs every 10 mins in cron job 

    docs = Document.objects.all()

    for doc in docs:
        ingest_document(
            title=doc.title,
            url=doc.source_url,
            provider=doc.provider,
            version=doc.version,
        )


