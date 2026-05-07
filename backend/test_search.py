from app.rag.search_service import search_similar_issues

results = search_similar_issues(
    "folder frames not loading"
)

for r in results:

    print("\n-------------------")

    print("Issue Key :", r.issue_key)

    print("Summary   :", r.summary)

    print("Distance  :", r.distance)