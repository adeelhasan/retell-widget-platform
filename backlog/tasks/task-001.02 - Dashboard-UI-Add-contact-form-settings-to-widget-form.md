---
id: task-001.02
title: 'Dashboard UI: Add contact form settings to widget form'
status: Done
assignee: []
created_date: '2025-11-18 19:34'
updated_date: '2025-11-19 21:07'
labels: []
dependencies:
  - task-001.01
parent_task_id: task-001
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update WidgetForm component to include toggle for contact_form_enabled and input for collector_email. Must follow React Hook Form + Zod pattern.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Toggle switch for enabling/disabling contact form
- [ ] #2 Email input field for collector email with validation
- [ ] #3 Form schema updated with .trim() on email field
- [ ] #4 UI follows shadcn/ui patterns
<!-- AC:END -->
