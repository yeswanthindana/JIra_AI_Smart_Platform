from app.rag.search_service import search_similar_issues

query = """frames folder path.
"""

results = search_similar_issues(query)

print("\n========== SEARCH RESULTS ==========\n")

for r in results:

    print(f"Issue Key : {r.issue_key}")

    print(f"Chunk Type: {r.chunk_type}")

    print(f"Distance  : {r.distance}")

    print(f"Content   :\n{r.content[:300]}")

    print("\n-----------------------------------\n")