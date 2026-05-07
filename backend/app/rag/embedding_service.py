from langchain_ollama import OllamaEmbeddings

# Initialize the embedding model
# all-minilm is a common model that produces 384-dimensional embeddings
embeddings = OllamaEmbeddings(model="all-minilm")

def generate_embedding(text: str):
    """
    Generates a 384-dimensional embedding for the given text using Ollama.
    Truncates text to avoid context length errors.
    """
    # Truncate to a safe limit (e.g., 4000 chars)
    # Most embedding models have a token limit, 4000 chars is usually safe
    truncated_text = text[:4000] if text else ""
    return embeddings.embed_query(truncated_text)


# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer(
#     'sentence-transformers/all-MiniLM-L6-v2'
# )

# def generate_embedding(text: str):

#     embedding = model.encode(text)

#     return embedding.tolist()