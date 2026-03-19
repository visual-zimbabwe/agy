# File Conversion Tool Discovery Log

Date: 2026-03-03

## User Request

Add file conversion as a tool in Agy (Electron app):
- Add `PDF to Word`
- Add `Word to PDF`
- On click, open a popup where users can upload documents

Before implementation/build:
- Ask at least 20 questions
- Ask one question at a time
- Keep questions easy to understand and answer
- Save the Q&A conversation in this markdown file for future reference

## Q&A

### Q1
Do you want the conversion popup to open as a separate Electron window, or as an in-app modal dialog?

Answer: In-app modal dialog.

### Q2
Should `PDF to Word` and `Word to PDF` open the same modal with a mode switch, or two separate modals?

Answer: Same modal with a mode switch.

### Q3
Do you want users to convert one file at a time, or multiple files in one batch?

Answer: Both options. User can choose, or app can auto-detect single vs batch based on uploaded files.

### Q4
For upload, should users be able to use both drag-and-drop and a `Choose files` button?

Answer: Both.

### Q5
Should converted files be saved automatically to a default folder, or should we ask users where to save each time?

Answer: Ask users where to save each time.

### Q6
Do you want users to be able to change the output filename before saving?

Answer: Yes.

### Q7
For batch mode, should we allow one selected folder for all outputs, or ask save location for each file in the batch?

Answer: Allow one selected folder for all outputs.

### Q8
Should conversion start automatically right after files are selected, or only when users click a `Convert` button?

Answer: Only when users click a `Convert` button.

### Q9
Do you want a progress bar (for current file and overall batch), or just simple status text?

Answer: Progress bar.

### Q10
If one file fails during batch conversion, should we continue converting the remaining files?

Answer: Ask the user if they want to skip the failed file and continue, or cancel the batch conversion.

### Q11
Do you want a `Cancel conversion` button while conversion is running?

Answer: Yes.

### Q12
After conversion finishes, should we show buttons like `Open output folder` and `Open converted file`?

Answer: Yes.

### Q13
Should we keep a conversion history list inside the app (recent jobs with status and timestamp)?

Answer: Yes. Keep it local (not Supabase) and lightweight so it does not slow down the app.

### Q14
How many history items should we keep by default (for example: 20, 50, or 100)?

Answer: Keep only the last 7 days of history.

### Q15
When files are dropped/uploaded, should we validate file type immediately and show clear errors for unsupported files?

Answer: Yes.

### Q16
Do you want a file size limit (for example 25MB, 50MB, 100MB), or no limit?

Answer: Yes, set a 100MB limit per file.

### Q17
Should we also set a max number of files per batch (for example 20 or 50), to protect performance?

Answer: Yes. Use best judgment (set default max batch size to 20 files).

### Q18
Should we process batch files one-by-one (safer/stable) or in parallel (faster but heavier)?

Answer: One-by-one.

### Q19
For password-protected PDFs, should we prompt users to enter the password, or skip with an error?

Answer: Prompt users to enter the password. If they do not know it, ask whether they want to skip the file.

### Q20
If an output file already exists, should we ask users to `Replace`, `Keep both` (rename), or `Skip`?

Answer: Yes. Ask the user with options: `Replace`, `Keep both` (rename), or `Skip`.

### Q21
Should the modal remember the last used conversion mode (`PDF to Word` or `Word to PDF`) next time it opens?

Answer: Yes.

### Q22
Do you want a quick `Swap mode` button inside the modal so users can switch conversion direction without closing it?

Answer: Yes.

### Q23
Should we disable closing the modal while conversion is running, or allow closing with a confirmation prompt?

Answer: Allow closing while conversion is running. Ask users if they want a tiny draggable progress bar on the canvas; if not, show a completion notification by default.

### Q24
For completion notifications, do you want both success and failure notifications?

Answer: Yes.

### Q25
Should each history record include only metadata (file name, size, status, time), or also full source/output file paths?

Answer: Only metadata.

### Q26
Do you want me to start implementation now based on these answers?

Answer: Yes. Implement for both web app and Electron app so both stay up to date.

