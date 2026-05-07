from dotenv import load_dotenv

load_dotenv()

from jira import JIRA

import os

from app.rag.advanced_index_jira import store_chunk

# ------------------------------------------------
# JIRA CONNECTION
# ------------------------------------------------

jira = JIRA(
    server=os.getenv("JIRA_URL"),
    basic_auth=(
        os.getenv("JIRA_EMAIL"),
        os.getenv("JIRA_API_TOKEN")
    )
)

# ------------------------------------------------
# CONFIG
# ------------------------------------------------

PROJECT_KEY = "EVR"

MAX_RESULTS = 50

NEXT_PAGE_TOKEN = None

# ------------------------------------------------
# MAIN LOOP
# ------------------------------------------------

while True:

    print("\nFetching Jira tickets...")

    try:

        # ----------------------------------------
        # FETCH ISSUES
        # ----------------------------------------

        issues_response = jira.enhanced_search_issues(
            jql_str=f'project={PROJECT_KEY} ORDER BY created DESC',
            maxResults=MAX_RESULTS,
            nextPageToken=NEXT_PAGE_TOKEN
        )

        # Handle different return types (dict vs list)
        if isinstance(issues_response, dict):
            issues = issues_response.get("issues", [])
        elif isinstance(issues_response, list):
            issues = issues_response
        else:
            print(f"Unexpected response type: {type(issues_response)}")
            issues = []

        # ----------------------------------------
        # STOP IF EMPTY
        # ----------------------------------------

        if not issues:

            print("\nNo more Jira tickets.")

            break

        print(f"Fetched {len(issues)} issues")

        # ----------------------------------------
        # PROCESS EACH ISSUE
        # ----------------------------------------

        for issue in issues:

            try:

                issue_key = issue.key

                print(f"\nProcessing {issue_key}")

                # --------------------------------
                # BASIC FIELDS
                # --------------------------------

                summary = str(
                    issue.fields.summary or ""
                )

                description = str(
                    issue.fields.description or ""
                )

                status = str(
                    issue.fields.status or ""
                )

                assignee = str(
                    issue.fields.assignee or ""
                )

                priority = str(
                    issue.fields.priority or ""
                )

                labels = ", ".join(
                    issue.fields.labels or []
                )

                # --------------------------------
                # STORE SUMMARY
                # --------------------------------

                store_chunk(
                    issue_key,
                    "summary",
                    summary
                )

                # --------------------------------
                # STORE DESCRIPTION
                # --------------------------------

                store_chunk(
                    issue_key,
                    "description",
                    description
                )

                # --------------------------------
                # STORE METADATA
                # --------------------------------

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

                # --------------------------------
                # STORE COMMENTS
                # --------------------------------

                try:

                    comments = (
                        issue.fields.comment.comments
                    )

                    for c in comments:

                        comment_body = str(
                            c.body or ""
                        )

                        store_chunk(
                            issue_key,
                            "comment",
                            comment_body
                        )

                except Exception as comment_error:

                    print(
                        f"Comment fetch failed "
                        f"for {issue_key}"
                    )

                    print(comment_error)

            except Exception as issue_error:

                print(
                    f"Failed processing "
                    f"{issue.key}"
                )

                print(issue_error)

        # ----------------------------------------
        # NEXT PAGE TOKEN
        # ----------------------------------------

        if isinstance(issues_response, dict):
            NEXT_PAGE_TOKEN = issues_response.get("nextPageToken")
        else:
            # It's a ResultList or list
            print(f"DEBUG: issues_response properties: {dir(issues_response)}")
            # Try to see if it has a nextPageToken attribute
            NEXT_PAGE_TOKEN = getattr(issues_response, "nextPageToken", None)
            if not NEXT_PAGE_TOKEN:
                # If we still don't have it, we might be done or need another way
                print("DEBUG: nextPageToken not found in ResultList attributes")

        # ----------------------------------------
        # STOP IF NO MORE PAGES
        # ----------------------------------------

        if not NEXT_PAGE_TOKEN:

            print("\nReached final page.")

            break

    except Exception as fetch_error:

        print("\nJira fetch failed")

        print(fetch_error)

        break

# ------------------------------------------------
# DONE
# ------------------------------------------------

print("\nAdvanced Jira indexing completed.")