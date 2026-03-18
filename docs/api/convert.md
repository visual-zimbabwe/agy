# Convert API

## Purpose

This document describes the current server-side file conversion API used by the file conversion workflow.

## Scope

This is a current-state summary of `POST /api/convert`, including supported modes, validation, runtime requirements, and failure behavior.

## Route

### `POST /api/convert`

Accepts multipart form-data with:

- `file`
- `mode`

Supported modes:

- `pdf_to_word`
- `word_to_pdf`

## Validation Rules

Current validation includes:

- file must be present
- mode must be valid
- file size must not exceed 100 MB
- `pdf_to_word` only accepts `.pdf`
- `word_to_pdf` only accepts `.doc` or `.docx`

## Runtime Behavior

Current behavior:

- route runs in Node.js runtime
- writes the uploaded file to a temporary workspace
- detects a LibreOffice/soffice binary
- invokes headless conversion through LibreOffice
- reads the converted output from the temp workspace
- returns the converted file as an attachment
- removes the temporary workspace in a `finally` block

## Binary Detection

The route currently detects LibreOffice through:

- `SOFFICE_PATH` environment override
- common binary names such as `soffice` and `libreoffice`
- common Windows install paths
- `where.exe` lookup on Windows when needed

## Success Response

Successful conversion returns the converted file body directly with headers including:

- `content-type`
- `content-disposition`
- `x-converted-filename`

## Failure Modes

Current failure responses include:

- `400` for missing file, invalid mode, or invalid extension
- `413` for oversized files
- `422` for failed conversion, including protected or encrypted files
- `503` when no conversion engine is available
- `500` for server-side failures

## Constraints

- Conversion depends on LibreOffice availability in the runtime environment.
- This route is operational and stateless; it does not persist converted output.
- Large files increase runtime and operational risk even within the 100 MB limit.

## Related Docs

- `docs/features/file-conversion.md`
- `docs/contributing/development-workflow.md`
