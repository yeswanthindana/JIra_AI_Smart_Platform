from langchain_ollama import OllamaEmbeddings

# Initialize the embedding model
# all-minilm is a common model that produces 384-dimensional embeddings
embeddings = OllamaEmbeddings(model="all-minilm")

def generate_embedding(text: str):
    """
    Generates a 384-dimensional embedding for the given text using Ollama.
    """
    return embeddings.embed_query(text)


# from sentence_transformers import SentenceTransformer

# model = SentenceTransformer(
#     'sentence-transformers/all-MiniLM-L6-v2'
# )

# def generate_embedding(text: str):

#     embedding = model.encode(text)

#     return embedding.tolist()