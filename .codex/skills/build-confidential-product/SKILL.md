---
name: build-confidential-product
description: Design, review, and implement products that promise strong confidentiality across all user content. Use when defining security architecture, storage rules, sync behavior, export/share controls, key management, threat models, or release gates for apps that must not expose user content to operators, cloud storage, logs, analytics, or other users.
---

# Build Confidential Product

## Purpose

Build the product as if confidential user content is the core promise, not an optional feature.

Treat every design choice as a potential data leak: storage, sync, search, exports, logs, previews, telemetry, recovery, support tooling, and admin access.

## Core Standard

Follow these rules unless the user explicitly asks for a weaker model:

- Keep user content encrypted end-to-end by default, not only in a special mode.
- Keep decryption keys on user-controlled devices only.
- Keep servers, operators, and databases unable to read user content.
- Minimize metadata. Protect content first, then reduce metadata leakage where feasible.
- Make insecure convenience opt-in, clearly labeled, and hard to trigger by accident.
- Refuse designs that market strong confidentiality while storing normal content in plaintext on the server.

## Non-Negotiable Product Rules

- Encrypt all user-generated content before it leaves the client.
- Do not persist plaintext content in browser storage, server storage, logs, analytics, crash reports, search indexes, or caches.
- Do not send passphrases, raw encryption keys, or decrypted content to backend services.
- Do not put confidential content into URLs, share links, query params, or filenames.
- Do not create plaintext previews, snippets, timeline snapshots, or exports for locked content.
- Do not rely on transport security alone. HTTPS is necessary but not sufficient.
- Do not claim end-to-end encryption if the server can decrypt content.

## Threat Model Baseline

Assume these threats matter by default:

- database breach
- cloud operator access
- log aggregation exposure
- support staff overreach
- compromised analytics or error reporting tools
- browser persistence leaks
- backup leakage
- accidental sharing through exports or published links
- shoulder-surfing and unlocked-session exposure

State explicitly when a threat is out of scope. Do not silently ignore it.

## Architecture Requirements

### Content Protection

- Encrypt note bodies, document bodies, attachments, comments, and rich content payloads client-side.
- Use authenticated encryption for stored content.
- Derive keys from user secrets or device-protected secrets with a strong KDF.
- Separate encrypted payloads from non-sensitive shell metadata.
- Version encrypted payload formats from the start.

### Key Management

- Keep master keys client-side.
- Protect local key material with OS or browser secure storage when available.
- Support passphrase-based recovery only if the server still cannot decrypt content.
- Rotate keys through explicit migration flows.
- Make key loss consequences clear: no fake recoverability claims.

### Sync Model

- Sync ciphertext, not plaintext.
- Resolve conflicts on encrypted records or on client-decrypted state, then re-encrypt before upload.
- Keep sync endpoints schema-aware but content-blind.
- Ensure import/export preserves encrypted payload integrity.

### Search and Retrieval

Pick one of these and document it clearly:

- no server-side search over confidential content
- client-side search after unlock
- carefully designed encrypted search with explicit tradeoffs

Default to client-side search after unlock. Do not add plaintext indexing to make search easier.

### Sharing and Publishing

- Disable public publishing for confidential content unless the user performs an explicit secure-share workflow.
- Treat share links as distribution of data, not harmless navigation.
- Prefer recipient-based encryption over public links for confidential sharing.
- Expiring links are not a substitute for encryption.

### Observability

- Log identifiers, state transitions, and error categories, not user content.
- Redact payload fields before logging.
- Keep analytics event schemas content-free.
- Review third-party SDKs for automatic capture of DOM text, network payloads, or breadcrumbs.

### Local State

- Store ciphertext at rest in IndexedDB, localStorage, files, and offline caches.
- Keep decrypted content only in memory for the active unlocked session.
- Auto-lock on inactivity, tab hide, sign-out, browser close when feasible, and explicit lock.
- Clear sensitive in-memory state on lock.

## UX Rules

- Make confidentiality modes clear and honest.
- Show when content is locked, unlocked, or about to be shared/exported.
- Warn before actions that reduce protection.
- Explain that unlocked sessions are readable on the device.
- Explain that forgotten secrets may make data unrecoverable.
- Never imply that encryption protects against a compromised unlocked device.

## Data Classification Rule

Classify product data into at least these buckets:

- confidential content
- sensitive metadata
- operational metadata
- public product data

Apply the strongest rules to confidential content by default. Do not let operational convenience quietly downgrade confidential data into a weaker bucket.

## Review Workflow

When designing or reviewing a feature, inspect every path below:

1. input path: where plaintext first appears
2. in-memory path: where plaintext lives while in use
3. local persistence path: what is stored on device and in what format
4. network path: what crosses the wire
5. server path: what backend systems can read
6. secondary copies: search indexes, previews, history, backups, caches, exports, links, analytics, logs
7. recovery and deletion path: how data is restored, revoked, or removed

If any step stores or transmits plaintext without a deliberate and documented reason, treat it as a design failure.

## Release Gate

Do not approve a confidentiality-sensitive feature until all are true:

- threat model is written down
- plaintext storage locations are enumerated
- telemetry/logging fields are reviewed
- export/share behavior is reviewed
- key handling is documented
- failure and recovery behavior is documented
- user-facing security copy is accurate
- manual QA covers lock, unlock, sync, export, publish, backup, and restore cases

## Red Flags

Escalate immediately if you see any of these:

- plaintext content in database rows
- plaintext content in browser storage for a feature marketed as confidential
- content embedded in published URLs
- support/admin tooling with content visibility by default
- analytics events carrying note text or document bodies
- search indexing of locked content
- server-side temporary decryption shortcuts
- hidden recovery keys that let the operator decrypt user data

## Output Style

When using this skill:

- state the confidentiality promise in one sentence
- list where plaintext exists and where ciphertext exists
- identify every secondary leak path
- classify risks as high, medium, or low
- recommend the strongest viable default, not the easiest implementation
- say plainly when the current design is not strong enough for a real confidentiality claim
