from app.rag.index_jira import store_jira_issue

store_jira_issue(
    issue_key="EVR-631",
    summary="Frames continue to be stored in old folder path after updating GPU node storage path until camera is manually updated",
    description="""
    When the frames storage path is updated in the GPU node configuration, existing cameras linked to that node continue to store frames in the old folder path.

The updated storage path is not applied dynamically to already configured cameras.
Only after manually updating the camera configuration do the frames start getting stored in the new folder path.

Preconditions:
GPU node is configured with a frames storage path

Cameras are already linked to the GPU node

Frame capture/storage is active

Steps to Reproduce:
Configure a GPU node with an initial frames storage path (e.g., /path/old_frames/)

Link one or more cameras to this GO node

Verify frames are being stored in the configured path

Update the frames storage path in GO node (e.g., /path/new_frames/)

Observe frame storage behavior without modifying camera configuration

Actual Result:
Frames continue to be stored in the old folder path

Change in GPU node configuration is not reflected automatically

Only after manually updating the camera does the new path take effect

Expected Result:
Once GPU node storage path is updated, all associated cameras should immediately start storing frames in the new path

No manual camera update should be required
    """
)