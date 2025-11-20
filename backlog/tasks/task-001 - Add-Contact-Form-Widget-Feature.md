---
id: task-001
title: Add Contact Form Widget Feature
status: To Do
assignee: []
created_date: '2025-11-18 19:30'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a pre-call contact form feature to widgets that collects user information (name, company, email) before initiating the voice call. When submitted, the form data should be emailed to a designated collector email address.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dashboard allows toggling contact form on/off per widget
- [ ] #2 Dashboard allows setting collector email address
- [ ] #3 When enabled, contact form appears before voice call starts
- [ ] #4 Form collects name, company, and email with proper validation
- [ ] #5 Form submission sends email to collector email
- [ ] #6 Voice call starts immediately after successful form submission
- [ ] #7 Feature follows all security patterns from CLAUDE.md
- [ ] #8 Uses React Hook Form + Zod for form handling
<!-- AC:END -->
