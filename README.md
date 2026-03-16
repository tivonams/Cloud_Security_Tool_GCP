# Cloud Security RAG with Multi-Agent Deliberation

A specialized Retrieval-Augmented Generation (RAG) tool designed for cloud security (AWS, GCP, Azure). It uses a local Multi-Agent System (Analyst, Architect, Reviewer, Arbiter) to deliberate and provide highly accurate, policy-compliant security advice.

## 🚀 Key Features

*   **Multi-Agent Deliberation**: Uses a council of specialized AI agents (Analyst, Architect, Reviewer, Arbiter) to refine answers.
*   **Central Dashboard**: A unified landing page providing quick access to all major tools.
*   **Real-Time Streaming**: Token-level streaming for both the agent deliberation transcript and the final synthesized response.
*   **Full-Screen Agent Feed**: Inspect the detailed reasoning process of each agent with a dedicated full-screen view.
*   **RAG Pipeline**: Ingests and indexes official cloud documentation using **ChromaDB** and **HuggingFace Embeddings**.
*   **Policy Analyzer**: Dedicated tool to scan JSON policies for security risks and propose specific inline remediations.
*   **Local LLM Support**: Fully compatible with **Ollama** (Llama 3.2, Qwen 2.5) for privacy and offline capability.
*   **Modern UI**: React + Vite frontend with **Dark Mode** support and a responsive design.

## 🛠️ Tech Stack

*   **Backend**: Django, Django REST Framework
    *   **Vector Store**: ChromaDB
    *   **LLM Interface**: LangChain + Ollama
    *   **Embeddings**: sentence-transformers/all-MiniLM-L6-v2
*   **Frontend**: React, Vite, Tailwind CSS v4
*   **Database**: SQLite (default)

---

## 📋 Prerequisites

1.  **Python 3.10+**
2.  **Node.js & npm** (v18+)
3.  **Ollama** installed and running locally.
    *   Pull the required models:
        ```bash
        ollama pull llama3.2
        ollama pull qwen2.5:1.5b
        ollama pull llama3.2:3b
        ```

---

## ⚙️ Installation & Setup

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv venv
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run database migrations:
```bash
python manage.py migrate
```

Start the backend server:
```bash
python manage.py runserver
```
*The backend will run on http://127.0.0.1:8000*

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
*The frontend will generally run on http://localhost:5173*

---

## 📖 Usage Guide

### 1. Welcome Dashboard
*   Start at the unified **Dashboard** (`/dashboard`) to get an overview of the tools and quickly navigate to the RAG Assistant, Knowledge Base, or Policy Analyzer.

### 2. RAG Assistant
*   Navigate to the **RAG Assistant** page.
*   Select your target **Cloud Provider** and desired **Context Depth**.
*   Type your security question (e.g., *"How do I secure an S3 bucket with public access blocked?"*).
*   Watch the **Agent Protocol Feed** on the right sidebar as agents analyze, draft, critique, and finalize the answer.
*   Click the **Expand** button in the sidebar to see the full deliberation transcript in full-screen mode.

### 3. Knowledge Base
*   Navigate to the **Knowledge Base** page to manage indexed documentation.
*   Enter a **Title** (e.g., "AWS IAM Guide") and the **URL** to the official documentation.
*   Select the **Provider** (AWS, GCP, Azure).
*   Click **Start Ingestion**. The system will recursively scrape, clean, chunk, and index the content into ChromaDB for the RAG Assistant to query against.

### 4. Policy Analyzer
*   Navigate to the **Policy Analyzer** page.
*   Paste your raw IAM or bucket **Policy JSON** into the editor.
*   Select the relevant **Cloud Provider**.
*   Click **Analyze Policy** to detect misconfigurations, security vulnerabilities, and compliance issues.
*   Review the generated risk level, detailed markdown findings, and a fully remediated JSON policy ready for deployment.

---

## 🔧 Configuration

Custom environment variables can be set in `backend/.env` (create if needed):

```env
# Optional overrides
OLLAMA_BASE_URL=http://localhost:11434
VECTOR_DB_PATH=vectorstore
RAG_SIMILARITY_THRESHOLD=0.8
```

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.
