# File Conversion

## Purpose

This document describes the current file conversion workflow exposed inside the wall workspace.

## Scope

This covers the product-facing conversion feature and the server conversion route used for PDF-to-Word and Word-to-PDF flows.

## Behavior

The wall tools panel currently exposes two conversion actions:

- `PDF to Word`
- `Word to PDF`

These actions open the file conversion workflow rather than modifying wall notes directly.

## Supported Modes

Current supported conversion modes are:

- `pdf_to_word`
- `word_to_pdf`

Input validation rules:

- `pdf_to_word` accepts only `.pdf`
- `word_to_pdf` accepts only `.doc` or `.docx`
- files over 100 MB are rejected

## Server Conversion Path

Conversion is handled by `POST /api/convert`.

Current server behavior:

- runs in Node.js runtime
- writes the uploaded file to a temporary workspace
- detects a LibreOffice/soffice binary
- runs headless conversion through LibreOffice
- returns the converted file as a download
- deletes the temporary workspace afterward

The route supports `SOFFICE_PATH` environment override and also tries common binary names and Windows install paths.

## Failure Modes

Current failure cases include:

- no file uploaded
- invalid conversion mode
- unsupported file extension for the chosen mode
- file size above 100 MB
- LibreOffice not installed or not discoverable
- protected or encrypted office file
- generic conversion process failure

The route currently returns:

- `400` for invalid request/input
- `413` for oversized files
- `422` for conversion failures such as protected or invalid files
- `503` when the conversion engine is unavailable
- `500` for server-side failures

## Limitations

- Conversion depends on LibreOffice availability in the runtime environment.
- This is a server-side utility workflow, not a general document pipeline.
- The current feature is exposed from wall tools, but it is operationally separate from wall content persistence.

## Related Docs

- `docs/api/page.md`
- `docs/architecture/overview.md`
- `docs/qa.md`
