# HowTo-Web

A web-based platform for creating, presenting, sharing, and reusing interactive technical presentations with slide-specific resources.

## Overview

**HowTo-Web** is a web-based presentation platform designed for teaching, technical demonstrations, workshops, tutorials, and project presentations.

Traditional presentations often require presenters to switch between multiple applications such as PowerPoint, VS Code, PDF viewers, browsers, file explorers, and media players.

HowTo-Web brings these resources together within the presentation itself.

Each slide can contain its own supporting resources, allowing the presenter to access relevant files, documentation, code, media, and notes without leaving the platform.

The platform combines this resource-based presentation model with a **GitHub-inspired Fork and Pull workflow**, allowing users to reuse and independently modify public presentations.

---

## Core Concept

HowTo-Web uses a split-screen presentation interface:

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                 Presentation Content                         │
│                                                              │
│                         70%                                  │
│                                                              │
│───────────────────────╱──────────────────────────────────────│
│                       ╱                                      │
│              Resources / Context                             │
│                       30%                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

The default layout is **70/30**, with the presentation occupying the primary area and a contextual resource panel alongside it.

The divider can be dragged to adjust the layout according to the presenter's requirements.

---

# Features

## Presentation Editor

HowTo-Web provides a presentation editor for creating and organizing slides.

Supported elements include:

* Text
* Images
* Shapes
* Diagrams
* Backgrounds
* Videos
* Basic animations and transitions

Users can:

* Create presentations
* Add slides
* Delete slides
* Reorder slides
* Edit slide content
* Save presentations

---

## Dynamic 70/30 Layout

Every presentation uses a default **70/30 split layout**.

The divider between the presentation and resource panel is draggable.

Supported layouts can include:

* 70/30
* 60/40
* 65/35
* 80/20

A reset option returns the layout to the default 70/30 configuration.

The diagonal divider is a core visual element of HowTo-Web and provides a distinct interface for separating presentation content from contextual resources.

### Viewer-Side Resizing

A viewer can resize the divider according to their own preference.

This change is local to that viewer and does not modify:

* The original presentation
* The stored presentation layout
* Other viewers' layouts

---

# Slide-Specific Resources

Each slide can have its own collection of resources.

A slide may contain zero, one, or multiple resources.

Supported resource types can include:

* Images
* PDFs
* Text files
* Documents
* Videos
* Audio
* Links
* HTML
* CSS
* JavaScript
* Python
* C
* C++
* Java
* ZIP archives
* Other supported file formats

For example:

```text
Slide 1
├── Notes
├── introduction.pdf
├── architecture.png
└── reference.html

Slide 2
├── Notes
├── example.py
├── output.png
└── documentation.pdf

Slide 3
├── Notes
├── demo.mp4
└── project.zip
```

Resources are associated with their respective slides rather than being stored as one global presentation collection.

---

# Resource Preview

HowTo-Web provides resource-specific actions where supported.

| Resource Type | Action            |
| ------------- | ----------------- |
| Image         | View              |
| PDF           | View              |
| Video         | Play              |
| Audio         | Play              |
| Text          | View              |
| Source Code   | Code Viewer       |
| HTML/CSS/JS   | Sandboxed Preview |
| Link          | Open              |

Source-code files such as Python, C, C++, and Java are treated as code resources and can be viewed within the platform.

They are **not arbitrarily executed on the application server**.

HTML, CSS, and JavaScript previews should use an appropriate sandboxed environment.

---

# Slide Notes

Each slide can contain multiple notes.

Notes provide additional information for the presenter, such as:

* Explanations
* Teaching points
* Examples
* Reminders
* Additional context

Notes can be:

* Added
* Edited
* Deleted
* Reordered

The notes interface is designed to be visually engaging while remaining useful during presentations.

---

# Presentation Mode

HowTo-Web includes a dedicated **Presentation Mode** for delivering presentations.

Presentation Mode minimizes editing-related controls and focuses on the presentation experience.

The presenter can:

* Navigate between slides
* View slide notes
* Open slide resources
* View images and PDFs
* Play supported media
* Preview supported web content
* Resize the resource panel
* Enter fullscreen mode
* Exit Presentation Mode

The 70/30 presentation-resource layout remains available during presentation.

---

# Screen Sharing

HowTo-Web is designed to work alongside existing screen-sharing platforms.

Examples include:

* Google Meet
* Zoom
* Microsoft Teams
* Discord

The platform does not attempt to replace video-conferencing software.

Instead, the presenter can share the HowTo-Web browser window and interact with slides and resources from a single interface.

For example:

```text
Presenter
    │
    ▼
HowTo-Web
    │
    ├── Presentation
    ├── Notes
    ├── Code
    ├── PDF
    ├── Images
    └── Media
    │
    ▼
Screen Sharing
    │
    ▼
Audience
```

---

# Sharing

Presentations can have different visibility levels.

## Private

Private presentations are accessible only to the owner and explicitly authorized users.

## Public

Public presentations can be accessed through a shareable URL.

Public presentations can be viewed and presented by other users according to the platform's permission rules.

---

# Permission Model

HowTo-Web uses ownership and fork-based editing instead of allowing users to directly modify another person's presentation.

| Capability        | Owner | Viewer | Fork Owner |
| ----------------- | ----: | -----: | ---------: |
| View presentation |   Yes |    Yes |        Yes |
| Present           |   Yes |    Yes |        Yes |
| Open resources    |   Yes |    Yes |        Yes |
| Resize divider    |   Yes |    Yes |        Yes |
| Edit original     |   Yes |     No |         No |
| Delete original   |   Yes |     No |         No |
| Fork              |   Yes |    Yes |        Yes |
| Edit fork         |     — |      — |        Yes |
| Pull Updates      |     — |      — |        Yes |

The fundamental rule is:

> **Users do not directly edit another person's original presentation. They Fork it, make their own changes, and maintain their own version.**

---

# Fork Workflow

HowTo-Web uses a workflow inspired by GitHub.

A user viewing a public presentation can create a **Fork**.

```text
Original Presentation
        │
        ▼
      Fork
        │
        ▼
Independent Presentation
        │
        ▼
       Edit
```

The fork becomes an independent presentation owned by the user who created it.

Changes to the fork do not modify the original presentation.

Similarly, changes made to the original do not automatically overwrite the fork.

---

# Fork Relationship

The platform maintains the relationship between the original presentation and its forks.

Relevant metadata can include:

* Original presentation ID
* Fork presentation ID
* Original owner ID
* Fork owner ID
* Base version
* Last synchronized version

Conceptually:

```text
                 Original Presentation
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       Fork A         Fork B         Fork C
          │              │              │
          ▼              ▼              ▼
       User A          User B          User C
```

Each fork can evolve independently.

---

# Pull Updates

When the original presentation is updated after a fork is created, the fork can detect that a newer version is available.

Example:

```text
Original Version: 1.4
Fork Version:     1.2

Status: Updates Available
```

The fork owner can use **Pull Updates** to incorporate changes from the original presentation.

Pulling updates should not silently destroy modifications made by the fork owner.

If both the original and fork contain conflicting changes, the system should identify the conflict and provide an appropriate resolution mechanism.

---

# Version Tracking

Presentation versions are maintained to support the Fork and Pull workflow.

A fork records the version of the original presentation from which it was created.

This allows HowTo-Web to determine:

* Whether the original has changed
* Which version the fork is based on
* Whether updates are available
* Which changes need to be synchronized

---

# Dashboard

The dashboard provides an overview of the user's presentations.

Each presentation can display information such as:

* Title
* Number of slides
* Visibility
* Last updated date
* Fork information
* Update status

Available actions can include:

* Create
* Edit
* Delete
* Duplicate
* Present
* Share
* Change visibility
* Pull Updates

The dashboard should remain focused on presentation management rather than becoming a generic administrative interface.

---

# Architecture

HowTo-Web follows a structured web application architecture.

```text
┌─────────────────────┐
│      Frontend       │
│ Presentation Editor │
│ Viewer / Presenter  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Backend / API   │
│ Auth / Permissions  │
│ Presentation Logic  │
└───────┬───────┬─────┘
        │       │
        ▼       ▼
   Database   File Storage
```

The application should maintain structured relationships between its core entities.

```text
User
 │
 └── Presentation
       │
       ├── Versions
       │
       └── Slides
             │
             ├── Slide Elements
             ├── Notes
             └── Resources
```

Fork relationships connect original presentations with their independent copies.

---

# Data Model

The core data model can include:

### User

Stores authentication and account information.

### Presentation

Stores presentation-level information such as:

* Title
* Description
* Owner
* Visibility
* Current version

### PresentationVersion

Stores version information required for tracking presentation changes.

### Slide

Stores individual slides belonging to a presentation.

### SlideElement

Stores elements placed on a slide.

### Note

Stores slide-specific presenter notes.

### Resource

Stores information about files, links, and other resources associated with a slide.

### ForkRelationship

Maintains the relationship between an original presentation and a fork.

---

# Security

Security is an important part of the platform because HowTo-Web supports user authentication, file uploads, sharing, and web previews.

The application should implement:

* Authentication
* Authorization
* Server-side permission validation
* Public/private access control
* File type validation
* File size restrictions
* Secure file storage
* Filename sanitization
* Safe resource previews
* Sandboxed HTML/CSS/JavaScript execution

The backend must enforce access and editing permissions rather than relying only on frontend restrictions.

Uploaded executable or source-code files must not be arbitrarily executed on the application server.

---

# Responsive Design

Desktop and laptop screens are the primary target because HowTo-Web is designed around presentation and screen-sharing workflows.

The interface should still adapt to smaller screens.

For mobile and tablet layouts, the presentation and resource areas can transition into a more suitable stacked interface rather than forcing the desktop 70/30 layout.

---

# Technology Stack

The initial implementation is intended to use a modern web application stack.

### Frontend

* React
* TypeScript
* Modern CSS / Tailwind CSS

### Backend

* REST API or equivalent API architecture
* Authentication
* Authorization
* Presentation management
* Resource management

### Database

* PostgreSQL

### File Storage

* Secure object/file storage

### Development

* Git
* GitHub

The technology stack may evolve during development without changing the core product concept.

---

# Development Roadmap

## Phase 1 — Presentation Foundation

* [ ] Authentication
* [ ] Dashboard
* [ ] Presentation creation
* [ ] Slide creation
* [ ] Slide deletion
* [ ] Slide reordering
* [ ] Basic slide editor
* [ ] Text support
* [ ] Image support
* [ ] Presentation persistence

## Phase 2 — Resource System

* [ ] 70/30 layout
* [ ] Diagonal divider
* [ ] Resizable divider
* [ ] Slide-specific notes
* [ ] Multiple resources per slide
* [ ] File uploads
* [ ] Resource preview

## Phase 3 — Presentation Mode

* [ ] Presentation Mode
* [ ] Slide navigation
* [ ] Interactive resource panel
* [ ] Image viewer
* [ ] PDF viewer
* [ ] Video playback
* [ ] Code viewer
* [ ] Sandboxed HTML/CSS/JS preview
* [ ] Screen-sharing optimization

## Phase 4 — Sharing

* [ ] Public presentations
* [ ] Private presentations
* [ ] Shareable URLs
* [ ] Viewer permissions
* [ ] Public presentation page

## Phase 5 — Fork and Pull

* [ ] Fork public presentations
* [ ] Independent editable copies
* [ ] Original/fork relationships
* [ ] Version tracking
* [ ] Update detection
* [ ] Pull Updates
* [ ] Basic conflict handling

---

# MVP Workflow

The MVP should demonstrate the complete core workflow:

```text
Create Presentation
        │
        ▼
Create Slides
        │
        ▼
Attach Slide-Specific Resources
        │
        ▼
Add Notes
        │
        ▼
Enter Presentation Mode
        │
        ▼
Interact With Resources
        │
        ▼
Share Presentation
        │
        ▼
Another User Views Presentation
        │
        ▼
Viewer Forks Presentation
        │
        ▼
Fork Owner Edits Their Version
        │
        ▼
Original Presentation Is Updated
        │
        ▼
Fork Detects Available Updates
        │
        ▼
Fork Owner Pulls Updates
```

A successful MVP should prove that HowTo-Web can function as a complete presentation and resource workflow without requiring the presenter to constantly switch between external applications.

---

# Project Scope

HowTo-Web is focused specifically on:

* Presentation creation
* Presentation delivery
* Slide-specific resources
* Presenter notes
* Public/private sharing
* Fork-based reuse
* Version tracking
* Pulling updates from original presentations

The project is **not** intended to become:

* A Learning Management System
* A video-conferencing platform
* A social network
* A full-featured IDE
* A general cloud-storage platform
* A project-management system

---

# Future Improvements

Potential future improvements include:

* Presentation templates
* Presentation import/export
* Advanced animations and transitions
* Additional resource formats
* Improved conflict resolution
* Detailed version history
* Collaborative editing
* AI-assisted presentation creation
* Presentation analytics

These features remain secondary to the core HowTo-Web workflow.

---

# Project Status

**In Development**

HowTo-Web is being developed as a presentation platform that combines presentation content, contextual resources, and version-controlled reuse within a single web application.

---

# Author

**Rounak Singh**

AI & ML Engineering Student

GitHub: [Rounak8906](https://github.com/Rounak8906)

---

## Project Vision

HowTo-Web aims to make technical and educational presentations more than a sequence of slides.

Instead, each slide can become a **self-contained learning or demonstration environment**, containing the presentation content, supporting resources, notes, examples, and interactive material required to explain the topic.

The goal is simple:

> **Present the topic. Access everything related to it. Reuse and improve it without modifying the original.**
