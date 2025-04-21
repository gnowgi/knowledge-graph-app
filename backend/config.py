import os

# Load from environment variables or use defaults
DB_PATH = os.getenv("KNOWLEDGE_DB_PATH", "db/graph.db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


