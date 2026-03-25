# Stitch by Google Prompt: Note Details Panel

## Feature Description: Note Information/Details Panel

This document describes the design and functionality of the "Note Information" panel. This panel provides users with metadata about a specific note, offering insights into its history and properties.

### Invocation

The details panel is displayed when the user selects the "Note Information" or "Details" action from the note's context menu (as described in `note_selection_menu_prompt.md`).

### Visuals and Interaction

1.  **Appearance**: The panel can be implemented as either:
    *   **A Modal Dialog**: A clean, centered dialog box that overlays the current view, focusing the user's attention. This is often better for desktop interfaces.
    *   **A Slide-in Panel (Bottom Sheet)**: A panel that slides up from the bottom of the screen. This is a common and effective pattern on mobile devices.
    It should have a clear title, such as "Details" or "Note Information," and be visually distinct from the main application content.

2.  **Read-Only**: All information presented in this panel is for display purposes only. No fields should be editable from this view.

3.  **Dismissal**: The panel should be easy to close.
    *   **"Close" or "Done" Button**: A prominent button at the bottom or top-right of the panel to dismiss it.
    *   **Outside Tap (for Modals)**: Tapping the area outside the modal should close it.
    *   **Swipe Down (for Bottom Sheets)**: Swiping the panel down should dismiss it.

### Panel Content

The panel should display the following metadata in a clear, organized list format. Each item should have a descriptive label and its corresponding value.

1.  **Title**:
    *   **Label**: `Title`
    *   **Value**: The full title of the note.

2.  **Creation Date**:
    *   **Label**: `Created`
    *   **Value**: The exact date and time the note was first created. (e.g., `March 25, 2026, 10:45 AM`).

3.  **Last Modified Date**:
    *   **Label**: `Modified`
    *   **Value**: The date and time of the last edit made to the note. This should update with every change.

4.  **Content Statistics**:
    *   **Word Count**:
        *   **Label**: `Words`
        *   **Value**: The total number of words in the note's body.
    *   **Character Count**:
        *   **Label**: `Characters`
        *   **Value**: The total number of characters (including spaces) in the note's body.

5.  **Tags/Categories**:
    *   **Label**: `Tags`
    *   **Value**: A list or a series of chips displaying all the tags associated with the note. If no tags are present, it should display "None".

6.  **Sync Status**:
    *   **Label**: `Status`
    *   **Value**: Indicates the synchronization state of the note.
        *   `Synced`: The note is successfully saved to the cloud and up-to-date on all devices.
        *   `Local only`: The note has not been synced to the cloud.
        *   `Syncing...`: The note is currently being synced.
        *   `Conflict`: There is a sync conflict that requires user resolution.

7.  **Author Information (for collaborative environments)**:
    *   **Label**: `Author`
    *   **Value**: The name or email of the user who originally created the note.
    *   **Label**: `Last Edited By`
    *   **Value**: The name or email of the last user to modify the note.

This prompt provides a detailed specification for creating a comprehensive and user-friendly "Note Details" panel in the application.