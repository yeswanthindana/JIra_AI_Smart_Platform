from dotenv import load_dotenv

load_dotenv()

from jira import JIRA

import os

from app.rag.advanced_index_jira import store_chunk

# ------------------------------------------------

jira = JIRA(
    server=os.getenv("JIRA_URL"),
    basic_auth=(
        os.getenv("JIRA_EMAIL"),
        os.getenv("JIRA_API_TOKEN")
    )
)

# ------------------------------------------------

PROJECT_KEY = "EVR"

START_AT = 0
MAX_RESULTS = 200

# ------------------------------------------------

while True:

    print(f"\nFetching Jira tickets from {START_AT}")

    issues = jira.search_issues(
        f'project={PROJECT_KEY}',
        maxResults=MAX_RESULTS
    )

    if not issues:
        print("No more tickets.")
        break

    for issue in issues:

        try:

            issue_key = issue.key

            summary = str(issue.fields.summary)

            description = str(issue.fields.description)

            status = str(issue.fields.status)

            assignee = str(issue.fields.assignee)

            priority = str(issue.fields.priority)

            labels = ", ".join(issue.fields.labels)

            # ------------------------------------------------
            # STORE SUMMARY
            # ------------------------------------------------

            store_chunk(
                issue_key,
                "summary",
                summary
            )

            # ------------------------------------------------
            # STORE DESCRIPTION
            # ------------------------------------------------

            store_chunk(
                issue_key,
                "description",
                description
            )

            # ------------------------------------------------
            # STORE METADATA
            # ------------------------------------------------

            metadata = f"""
            Status: {status}

            Assignee: {assignee}

            Priority: {priority}

            Labels: {labels}
            """

            store_chunk(
                issue_key,
                "metadata",
                metadata
            )

            # ------------------------------------------------
            # STORE COMMENTS
            # ------------------------------------------------

            comments = issue.fields.comment.comments

            for c in comments:

                comment_body = str(c.body)

                store_chunk(
                    issue_key,
                    "comment",
                    comment_body
                )

        except Exception as e:

            print(f"Failed: {issue.key}")

            print(e)

    START_AT += MAX_RESULTS

print("\nAdvanced Jira indexing completed.")