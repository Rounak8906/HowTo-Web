# HowTo-Web

### Interactive presentations with everything you need, right where you present.

**HowTo-Web** is a web-based presentation platform built for **technical presentations, tutorials, workshops, demonstrations, and teaching**.

Instead of switching between presentation software, code editors, PDFs, browsers, file explorers, and media players, HowTo-Web brings the content and its supporting resources together in a single presentation environment.

> **Present. Explain. Explore. Reuse.**

---

## ✨ Overview

Technical presentations often require more than slides.

A presenter may need to show:

* Source code
* Documentation
* Images
* PDFs
* Videos
* Examples
* Notes
* External links
* Supporting files

HowTo-Web connects these resources directly to the slide they belong to.

This creates a presentation experience where the **slide is the central context**, while everything needed to explain it is available alongside it.

---

## 🎯 What Makes HowTo-Web Different?

### Traditional Workflow

```text
Presentation → VS Code → PDF → Browser → File Explorer → Video
       ↑__________________________________________________|
                    Constant application switching
```

### HowTo-Web Workflow

```text
                 HOWTO-WEB

┌────────────────────────────────────────────────────┐
│                                                    │
│              PRESENTATION CONTENT                  │
│                                                    │
│                     70%                            │
│                                                    │
│──────────────────────────────────────────────╱─────│
│                                            ╱       │
│              RESOURCES & CONTEXT          ╱        │
│                                          30%       │
│                                                    │
└────────────────────────────────────────────────────┘
```

The presentation remains the primary focus while the resources required for that particular slide stay immediately accessible.

---

# 🚀 Key Features

## 🖥️ Presentation Editor

Create and organize presentations with support for common presentation elements:

* Text
* Images
* Shapes
* Diagrams
* Backgrounds
* Videos
* Basic animations and transitions
* Slide creation and deletion
* Slide reordering
* Presentation saving

---

## 📐 Flexible 70/30 Presentation Layout

HowTo-Web introduces a distinctive **presentation + context** interface.

### Default Layout

**70% — Presentation**

**30% — Resources & Context**

The divider can be adjusted according to the presenter's needs.

Possible layouts include:

```text
70 / 30
60 / 40
65 / 35
80 / 20
```

The default layout can be restored at any time.

Importantly, viewer-side resizing is local to that viewer and does not modify the original presentation or affect other viewers.

---

# 📎 Slide-Specific Resources

Resources are attached to **individual slides**, rather than being treated as one global collection.

A slide can contain zero, one, or multiple resources.

For example:

```text
Presentation
│
├── Slide 1
│   ├── Notes
│   ├── introduction.pdf
│   ├── architecture.png
│   └── reference.html
│
├── Slide 2
│   ├── Notes
│   ├── example.py
│   ├── output.png
│   └── documentation.pdf
│
└── Slide 3
    ├── Notes
    ├── demo.mp4
    └── project.zip
```

Supported resource categories can include:

* Images
* PDFs
* Documents
* Text files
* Audio
* Video
* HTML
* CSS
* JavaScript
* Python
* C / C++
* Java
* ZIP archives
* External links
* Other supported formats

---

# 👀 Resource Preview

HowTo-Web provides resource-specific viewing and preview capabilities.

| Resource        | Experience          |
| --------------- | ------------------- |
| Image           | Image viewer        |
| PDF             | PDF viewer          |
| Video           | Media player        |
| Audio           | Media player        |
| Text            | Text viewer         |
| Source Code     | Code viewer         |
| HTML / CSS / JS | Sandboxed preview   |
| Link            | External navigation |

Source-code resources are intended to be **viewed rather than arbitrarily executed on the application server**.

Web previews should use appropriate sandboxing to isolate potentially unsafe content.

---

# 📝 Presenter Notes

Every slide can have its own notes.

Notes can contain:

* Explanations
* Teaching points
* Examples
* Reminders
* Additional context

Notes can also be added, edited, deleted, and reordered.

This allows presenters to keep supporting information available without overcrowding the presentation itself.

---

# 🎤 Presentation Mode

**Presentation Mode** is designed specifically for delivering presentations.

It focuses the interface on the presentation experience while keeping the supporting resources accessible.

Presenters can:

* Navigate between slides
* View notes
* Open resources
* View images and PDFs
* Play supported media
* Preview supported web content
* Resize the resource panel
* Enter fullscreen
* Exit Presentation Mode

---

# 🖥️ Built for Screen Sharing

HowTo-Web is designed to work alongside platforms such as:

**Google Meet · Zoom · Microsoft Teams · Discord**

The goal is simple:

> **Share one browser window instead of constantly switching between applications.**

```text
Presenter
    │
    ▼
┌──────────────────┐
│    HowTo-Web      │
│                  │
│  Presentation    │
│  Notes           │
│  Code            │
│  PDFs            │
│  Images          │
│  Media           │
└────────┬─────────┘
         │
         ▼
   Screen Sharing
         │
         ▼
      Audience
```

HowTo-Web complements video-conferencing platforms rather than attempting to replace them.

---

# 🔗 Sharing & Access

Presentations can support different visibility levels.

### 🔒 Private

Accessible only to the owner and explicitly authorized users.

### 🌐 Public

Accessible through a shareable URL according to the platform's permission rules.

---

# 🍴 GitHub-Inspired Fork & Pull

One of HowTo-Web's core ideas is **presentation reuse without modifying the original**.

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

The fork becomes an independent presentation owned by the user.

Changes to the fork do not modify the original.

Changes to the original do not automatically overwrite the fork.

---

# 🔄 Pull Updates

Forks can maintain a relationship with their original presentation.

For example:

```text
Original Version : 1.4
Fork Version     : 1.2

        ↓

Updates Available
```

The fork owner can use **Pull Updates** to incorporate changes from the original.

The system is designed to avoid silently overwriting changes made to the fork. Where changes conflict, the platform can identify the conflict and provide a resolution mechanism.

---

# 📊 Dashboard

The dashboard provides a focused overview of the user's presentations.

It can display:

* Presentation title
* Number of slides
* Visibility
* Last updated date
* Fork information
* Update status

Possible actions include:

`Create` · `Edit` · `Delete` · `Duplicate` · `Present` · `Share` · `Change Visibility` · `Pull Updates`

The dashboard is intended to remain focused on **presentation management**, rather than becoming a generic administrative system.

---

# 🏗️ Architecture

HowTo-Web follows a structured web application architecture.

```text
┌──────────────────────────┐
│         Frontend         │
│                          │
│  Presentation Editor     │
│  Viewer / Presenter      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       Backend / API      │
│                          │
│ Authentication           │
│ Authorization            │
│ Presentation Logic       │
│ Resource Management      │
└────────────┬─────────────┘
             │
       ┌─────┴─────┐
       ▼           ▼
┌────────────┐ ┌─────────────┐
│  Database  │ │ File Storage│
└────────────┘ └─────────────┘
```

Core relationships:

```text
User
 │
 └── Presentation
       │
       ├── Versions
       │
       └── Slides
             │
             ├── Elements
             ├── Notes
             └── Resources
```

Fork relationships connect original presentations with their independent copies.

---

# 🔐 Security

HowTo-Web involves authentication, file uploads, sharing, and web previews, making security an important part of the platform.

The application should enforce:

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

Security restrictions should be enforced on the backend and not rely solely on frontend controls.

Uploaded source-code and executable files should not be arbitrarily executed on the application server.

---

# 🛠️ Technology Stack

The project specification currently targets a modern web application stack:

| Layer           | Technology                 |
| --------------- | -------------------------- |
| Frontend        | React                      |
| Language        | TypeScript                 |
| Styling         | Modern CSS / Tailwind CSS  |
| Backend         | REST API or equivalent     |
| Database        | PostgreSQL                 |
| Storage         | Secure object/file storage |
| Version Control | Git + GitHub               |

The technology stack may evolve as development progresses without changing the core HowTo-Web concept.

---

# 🗺️ Roadmap

### Phase 1 — Presentation Foundation

* [ ] Authentication
* [ ] Dashboard
* [ ] Presentation creation
* [ ] Slide creation
* [ ] Slide deletion
* [ ] Slide reordering
* [ ] Basic editor
* [ ] Text support
* [ ] Image support
* [ ] Presentation persistence

### Phase 2 — Resource System

* [ ] 70/30 layout
* [ ] Diagonal divider
* [ ] Resizable divider
* [ ] Slide-specific notes
* [ ] Multiple resources per slide
* [ ] File uploads
* [ ] Resource preview

### Phase 3 — Presentation Mode

* [ ] Presentation Mode
* [ ] Slide navigation
* [ ] Interactive resource panel
* [ ] Image viewer
* [ ] PDF viewer
* [ ] Video playback
* [ ] Code viewer
* [ ] Sandboxed HTML/CSS/JS preview
* [ ] Screen-sharing optimization

### Phase 4 — Sharing

* [ ] Public presentations
* [ ] Private presentations
* [ ] Shareable URLs
* [ ] Viewer permissions
* [ ] Public presentation page

### Phase 5 — Fork & Pull

* [ ] Fork public presentations
* [ ] Independent editable copies
* [ ] Original/fork relationships
* [ ] Version tracking
* [ ] Update detection
* [ ] Pull Updates
* [ ] Conflict handling

---

# 🔄 Core Workflow

```text
Create Presentation
        ↓
Create Slides
        ↓
Attach Slide Resources
        ↓
Add Presenter Notes
        ↓
Enter Presentation Mode
        ↓
Present & Access Resources
        ↓
Share Presentation
        ↓
Another User Views It
        ↓
Fork Presentation
        ↓
Edit Independent Version
        ↓
Original Gets Updated
        ↓
Fork Detects Update
        ↓
Pull Updates
```

The core objective is to create a complete presentation workflow where the presenter can explain a topic and access its supporting material without repeatedly leaving the presentation environment.

---

# 🎯 Project Scope

HowTo-Web focuses on:

* Presentation creation
* Presentation delivery
* Slide-specific resources
* Presenter notes
* Public/private sharing
* Fork-based reuse
* Version tracking
* Pulling updates from original presentations

It is **not intended to become**:

* A Learning Management System
* A video-conferencing platform
* A social network
* A full-featured IDE
* A general cloud-storage platform
* A project-management system

---

# 🔮 Future Possibilities

Potential future improvements include:

* Presentation templates
* Import / export
* Advanced animations and transitions
* Additional resource formats
* Improved conflict resolution
* Detailed version history
* Collaborative editing
* AI-assisted presentation creation
* Presentation analytics

These remain secondary to the core presentation and resource workflow.

---

# 🚧 Project Status

**In Development**

HowTo-Web is being developed around a simple idea:

> **A presentation should contain everything needed to explain the topic.**

The project combines presentation content, slide-specific resources, presenter notes, presentation mode, sharing, and GitHub-inspired versioned reuse into one platform.

---

# 👨‍💻 Author

### Rounak Singh

**AI & ML Engineering Student**

[GitHub — @Rounak8906](https://github.com/Rounak8906)

---

## 🌟 Project Vision

HowTo-Web aims to transform presentations from simple sequences of slides into **self-contained learning and demonstration environments**.

Each slide can contain the content, resources, notes, examples, and interactive material needed to explain its topic.

### The goal:

> **Present the topic. Access everything related to it. Reuse and improve it without modifying the original.**
