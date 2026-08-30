---
id: doc-4
title: Task Taxonomy and Structured Sections
type: guide
created_date: '2026-08-30 16:36'
updated_date: '2026-08-30 16:37'
---
# Task Taxonomy and Structured Sections

## Record model

A task has metadata plus structured Markdown sections.

### Metadata

- Identity and workflow: ID, title, status, assignees, labels, priority, type, created/updated dates, optional due date, and ordinal.
- Relationships: milestone, dependencies, and an optional parent task ID.
- Type is descriptive. It is selected from the project configuration's `types` list and is not a relationship.

### Epic hierarchy

An Epic is an ordinary task whose configured type is `epic`. It does not automatically collect other tasks.

Associate a newly-created child with an Epic by setting the child's parent task ID:

```bash
backlog task create "Rebuild navigation" --parent back-123 --plain
```

List the Epic's direct children:

```bash
backlog task list --parent back-123 --plain
```

The CLI exposes `--parent` on `task create`, not on `task edit`; existing tasks cannot currently be attached, detached, or reassigned through `task edit`.

### Due dates

A due date is optional task metadata. The terminal board renders it when present. Clearing the due date hides it for that task:

```bash
backlog task edit back-123 --clear-due-date --plain
```

There is no board-wide hide-due-date setting; `dateFormat` changes presentation only.

## Structured task sections

| Exact heading | Opening sentinel | Closing sentinel |
| --- | --- | --- |
| `## Description` | `<!-- SECTION:DESCRIPTION:BEGIN -->` | `<!-- SECTION:DESCRIPTION:END -->` |
| `## Acceptance Criteria` | `<!-- AC:BEGIN -->` | `<!-- AC:END -->` |
| `## Definition of Done` | `<!-- DOD:BEGIN -->` | `<!-- DOD:END -->` |
| `## Implementation Plan` | `<!-- SECTION:PLAN:BEGIN -->` | `<!-- SECTION:PLAN:END -->` |
| `## Implementation Notes` | `<!-- SECTION:NOTES:BEGIN -->` | `<!-- SECTION:NOTES:END -->` |
| `## Comments` | `<!-- COMMENTS:BEGIN -->` | `<!-- COMMENTS:END -->` |
| `## Final Summary` | `<!-- SECTION:FINAL_SUMMARY:BEGIN -->` | `<!-- SECTION:FINAL_SUMMARY:END -->` |

### Accepted heading aliases

| Canonical heading | Accepted aliases |
| --- | --- |
| `## Acceptance Criteria` | `## Acceptance Criteria (Optional)` |
| `## Implementation Plan` | `## Implementation Plan (Optional)` |
| `## Implementation Notes` | `## Implementation Notes (Optional)`, `## Notes`, `## Notes & Comments (Optional)` |

`Comments` has an outer sentinel pair. The current writer formats each comment with optional `author:` and `created:` metadata plus standalone `---` delimiters. It does not emit `<!-- COMMENT:BEGIN -->` / `<!-- COMMENT:END -->`, although the parser recognises them.

## Section roles

| Section | Purpose |
| --- | --- |
| Description | Context, problem, and desired outcome. |
| Acceptance Criteria | Observable scope and behaviour to verify. |
| Definition of Done | Completion-hygiene checklist, such as tests and documentation. |
| Implementation Plan | Technical approach recorded after the task is taken up. |
| Implementation Notes | Progress, decisions, blockers, and validation evidence. |
| Comments | Discussion, review questions, handoffs, and collaboration notes. |
| Final Summary | PR-style completion summary, including verification. |
