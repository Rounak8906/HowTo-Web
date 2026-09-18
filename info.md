# Dynamic Presentation Platform

## 1. Project Overview

Build a modern web-based **presentation creation, sharing, and versioning platform**.

The platform works like a presentation/PPT maker, but introduces a unique presentation format:

> Every slide has a **70% main presentation area** and a **30% interactive resource panel on the right**.

The resource panel allows the creator to attach **multiple files, notes, images, links, videos, documents, code files, and other resources to each individual slide**.

The platform should also use a **GitHub-inspired Fork/Pull model** for editing and versioning.

A user viewing someone else's presentation **cannot directly edit the original**.

Instead, they can **Fork** the presentation to create their own editable copy. If the original presentation is later updated, the fork owner can **Pull the latest changes** from the original.

Presentations can be:

* 🔒 Private
* 🌎 Public

The platform should also provide a dedicated **Presentation Mode** designed for teaching and screen sharing.

---

# 2. Core Concept

A traditional presentation often requires switching between multiple applications:

```text
PPT
 ↓
Explain
 ↓
Open VS Code
 ↓
Open Image
 ↓
Open PDF
 ↓
Return to PPT
```

This platform keeps everything related to a topic inside the presentation.

```text
                 ONE PRESENTATION

┌──────────────────────────────╱──────────────────────┐
│                              ╱                      │
│                              ╱  📝 Notes            │
│        MAIN SLIDE            ╱                      │
│             70%              ╱  📄 index.html       │
│                              ╱  🖼 diagram.jpg      │
│                              ╱  📄 example.py       │
│                              ╱  📕 reference.pdf   │
│                              ╱                      │
└──────────────────────────────╱──────────────────────┘
                               30%
```

Every resource belongs to the specific slide where it was added.

---

# 3. Main UI Layout

## Left — 70%

The main presentation area.

It should support normal presentation elements such as:

* Text
* Images
* Shapes
* Diagrams
* Backgrounds
* Videos
* Basic presentation elements
* Basic animations/transitions where practical

## Right — 30%

The interactive resource/context panel.

It can contain:

* Notes
* Files
* Images
* Links
* Documents
* Code files
* Videos
* Other attachments

---

# 4. Creative Diagonal Divider

The boundary between the presentation and resource panel should NOT be a normal straight vertical line.

Use a creative diagonal `/`-style divider.

Example:

```text
70% PRESENTATION
                  ╲
                   ╲
                    ╲
                     ╲
                      ╲
                       30% RESOURCES
```

The divider should become one of the visual identities of the platform.

It should be:

* Modern
* Creative
* Clean
* Stylish
* Smooth
* Interactive

---

# 5. Resizable 70/30 Layout

The default layout must be:

```text
70% / 30%
```

The divider should be draggable.

Users can resize the layout:

```text
70 / 30 ← Default

60 / 40
80 / 20
65 / 35
```

The panels should resize smoothly.

Provide a **Reset to 70/30** option.

### Important

The resizing should work in:

* Editor
* Presentation Mode
* While screen sharing

A viewer changing the divider should only affect **their own view** and must not modify the presentation's stored layout.

---

# 6. Slide-Specific Resources

Every slide has its own independent resource collection.

Example:

## Slide 1 — HTML Introduction

```text
Main Slide:
"What is HTML?"

Resources:

📝 Note
📄 index.html
🖼 html-diagram.jpg
📕 html-reference.pdf
```

## Slide 2 — CSS

```text
Main Slide:
"What is CSS?"

Resources:

📝 Note
📄 style.css
📄 example.html
🖼 css-example.jpg
```

## Slide 3 — JavaScript

```text
Main Slide:
"What is JavaScript?"

Resources:

📝 Note
📄 script.js
📄 example.html
🎥 javascript-demo.mp4
```

When the user changes slides, the resource panel must automatically display the resources belonging to that slide.

There should be **no fixed limit such as one note or one file per slide**.

A slide can contain multiple resources.

---

# 7. File Attachments

The attachment system should be generic.

Users should be able to attach different types of files.

Examples:

```text
.jpg
.jpeg
.png
.gif
.webp

.pdf
.txt
.doc
.docx

.html
.css
.js
.py
.c
.cpp
.java

.mp4
.mp3

.zip

and other common file types
```

The system should detect the file type and provide appropriate actions.

Examples:

```text
📄 index.html
[Open] [Run]

🖼 diagram.jpg
[View]

📕 notes.pdf
[Open]

🎥 demo.mp4
[Play]

📄 example.py
[View]
```

Do not pretend that every file can be executed.

Only files that can safely be previewed or executed in the browser should have a Run/Preview action.

---

# 8. HTML/CSS/JavaScript Live Preview

Support safe browser-based execution/preview for web files.

Example:

```text
📄 index.html
📄 style.css
📄 script.js

[ ▶ Run ]
```

Clicking Run should open a live preview without requiring the presenter to leave the platform.

Example:

```text
Code:

<h1>Hello World</h1>

       ↓

    [ RUN ]

       ↓

┌──────────────────────────┐
│                          │
│      Hello World         │
│                          │
└──────────────────────────┘
```

Use a sandboxed environment.

Do NOT execute arbitrary uploaded Python, C, C++, Java, or other programs on the server.

Those files can be stored and viewed as code.

---

# 9. Notes

Each slide can contain multiple notes.

Notes should be visually different from the main slide content.

Example:

```text
📝 Teacher Note

Think of HTML as the skeleton
of a website.
```

Notes should have a creative, possibly **comic-style** appearance.

Creators can:

* Add notes
* Edit notes
* Delete notes
* Reorder notes

---

# 10. Presentation Mode

Provide a dedicated:

## ▶ Present

mode.

Presentation Mode should:

* Hide/minimize editing controls
* Focus on the presentation
* Keep the 70/30 layout
* Keep the resource panel accessible
* Allow slide navigation
* Allow resource interaction

Basic controls:

```text
← Previous       3 / 12       Next →
```

Include:

* Exit Presentation
* Fullscreen where supported

Controls should be unobtrusive and may automatically hide when not being used.

---

# 11. Screen Sharing

Presentation Mode must be designed to work naturally during screen sharing.

The platform itself does NOT need to implement video conferencing.

The teacher can share the browser window through:

* Google Meet
* Zoom
* Microsoft Teams
* Discord
* Other screen-sharing applications

Everything inside the presentation should continue working while the window is being shared.

The teacher should be able to:

* Navigate slides
* Drag the diagonal divider
* Resize 70/30
* Open notes
* Open resources
* View images
* Open PDFs
* Play media
* Run supported HTML/CSS/JS previews

without leaving the presentation.

Example:

```text
Teacher shares screen
        ↓
Presentation visible
        ↓
Drag divider
        ↓
70/30 → 60/40
        ↓
Shared screen updates
```

---

# 12. Public and Private Presentations

Each presentation has a visibility setting.

## 🔒 Private

Only the creator and explicitly authorized users can access it.

## 🌎 Public

Anyone can view it using its public URL.

The creator can change:

```text
Private ↔ Public
```

at any time.

---

# 13. Creator and Viewer Permissions

Permissions must be strictly separated.

## Creator / Owner

The creator owns the original presentation.

Can:

* Create presentation
* Edit presentation
* Add/delete/reorder slides
* Edit slide content
* Add/edit/delete notes
* Upload/delete/replace resources
* Change presentation settings
* Change visibility
* Delete presentation
* Present
* Share
* Create versions/updates

## Viewer

A viewer can:

* View presentation
* Navigate slides
* Read visible notes
* Open resources
* View images
* View documents
* Play supported media
* Run supported previews
* Resize the divider for their own view
* Present/view in Presentation Mode
* Fork the presentation

A viewer CANNOT:

* Edit the original
* Add slides to the original
* Delete slides from the original
* Modify original notes
* Upload resources to the original
* Change visibility
* Delete the original

---

# 14. GitHub-Style Fork System

The platform should use a **Fork model** for editing someone else's presentation.

A viewer does NOT receive direct editing access to the original presentation.

Instead:

```text
Original Presentation
        │
        │ FORK
        ↓
Viewer's Copy
        │
        ↓
Viewer can edit freely
```

Example:

```text
Teacher's Presentation
"Web Development"

[ View ]

[ 🍴 Fork ]
```

After clicking Fork:

```text
Original:
Web Development
Owner: Teacher

        ↓ Fork

Your Presentation:
Web Development — Rounak's Fork
Owner: Rounak
Based on: Teacher's Web Development
```

The fork becomes an independent editable presentation.

---

# 15. Fork Relationship

A fork should maintain a relationship with its original presentation.

Store information such as:

```text
Original Presentation ID
Fork Presentation ID
Original Owner
Fork Owner
Base Version
Current Synced Version
```

Example:

```text
Teacher's Web Development
        │
        ├── Rounak's Fork
        ├── Alex's Fork
        └── Priya's Fork
```

Each fork can evolve independently.

---

# 16. Pull Updates

If the original creator updates their presentation, fork owners should be able to see that updates are available.

Example:

```text
Original version: v1.4
Your fork:        v1.2

⚡ Updates available

[ Pull Updates ]
```

When the fork owner selects Pull Updates:

```text
Original
v1.2 → v1.4
        │
        ↓
Pull Updates
        │
        ↓
Your Fork
v1.2 → v1.4
```

The system should preserve the fork owner's own changes where possible.

If both the original and fork modified the same content, the system should detect a conflict rather than silently overwriting the fork owner's work.

Example:

```text
⚠ Conflict detected

Original changed:
Slide 4 → Text

Your fork changed:
Slide 4 → Text

[ Review Changes ]
[ Keep Original ]
[ Keep Mine ]
```

For the MVP, a simple conflict-resolution system is acceptable.

---

# 17. Fork Editing Rules

Once a presentation is forked:

The fork owner can independently:

* Edit slides
* Add/delete slides
* Change text
* Change images
* Add/delete notes
* Add/delete resources
* Change layout
* Change presentation settings

Changes to the fork must NOT automatically modify the original.

Likewise, changes to the original must NOT automatically modify the fork.

Synchronization happens only through the Pull Updates mechanism.

---

# 18. Public Presentation Viewer

A public presentation should have a dedicated viewer page.

Example:

```text
Presentation Title
Created by: Username

[ ▶ Present ]

┌──────────────────────────────╱──────────────────────┐
│                              ╱                      │
│                              ╱ Resources            │
│       Slide Content          ╱                      │
│                              ╱ 📄 file.html         │
│                              ╱ 🖼 image.jpg         │
│                              ╱ 📝 Note              │
└──────────────────────────────╱──────────────────────┘

[ 🍴 Fork ]
```

The viewer should not see editing controls for the original.

---

# 19. Presentation Editor

The editor should provide a familiar presentation-building experience.

Suggested layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Toolbar                                                    │
├────────────┬──────────────────────────────╱───────────────┤
│            │                              ╱                │
│ Slide 1    │                              ╱ Resources      │
│            │                              ╱                │
│ Slide 2    │          Slide               ╱                │
│            │                              ╱                │
│ Slide 3    │                              ╱                │
│            │                              ╱                │
└────────────┴──────────────────────────────╱───────────────┘
```

### Left

* Slide thumbnails
* Add slide
* Delete slide
* Reorder slides

### Center

* Main slide editor

### Right

* Notes
* Attachments
* Resources

---

# 20. Resource Management

The right panel should contain:

```text
+ Add Resource
```

Options:

```text
Upload File
Add Image
Add Video
Add Link
Add Note
```

Multiple resources must be supported.

Example:

```text
Slide 2 Resources

📝 HTML explanation
📄 index.html
📄 style.css
🖼 diagram.png
📕 reference.pdf

+ Add Resource
```

Resources should be reorderable where practical.

Creators can remove or edit resources.

---

# 21. Dashboard

The dashboard should show presentations owned by the user.

Example:

```text
My Presentations

+ Create Presentation

┌────────────────┐
│ HTML Basics    │
│ 12 Slides      │
│ 🔒 Private     │
│ Updated today  │
└────────────────┘

┌────────────────┐
│ AI Introduction│
│ 18 Slides      │
│ 🌎 Public      │
│ Updated 2 days │
└────────────────┘

┌────────────────┐
│ Web Course Fork│
│ 15 Slides      │
│ 🍴 Fork        │
└────────────────┘
```

Actions:

* Create
* Edit
* Delete
* Duplicate
* Present
* Share
* Change visibility
* View fork information
* Pull updates when available

---

# 22. Versioning

Presentations should have versions.

Example:

```text
Web Development

v1.0
v1.1
v1.2
v1.3
```

Every meaningful update should be capable of creating a new version.

Forks should remember which version they originated from.

This allows the platform to determine whether updates are available.

---

# 23. User Flow

## Creating

```text
Sign Up / Login
      ↓
Dashboard
      ↓
Create Presentation
      ↓
Add Slides
      ↓
Design Slides
      ↓
Add Notes / Resources
      ↓
Save
      ↓
Choose Private / Public
```

## Viewing

```text
Open Presentation
      ↓
Viewer Mode
      ↓
Navigate Slides
      ↓
Open Resources
      ↓
Present
      ↓
Optional Fork
```

## Forking

```text
Public Presentation
      ↓
Fork
      ↓
Create Independent Copy
      ↓
Edit Freely
      ↓
Save
```

## Updating a Fork

```text
Original Updated
      ↓
Fork detects new version
      ↓
"Updates Available"
      ↓
Pull Updates
      ↓
Resolve conflicts if necessary
      ↓
Updated Fork
```

---

# 24. Security

Because users can upload arbitrary files, implement:

* Authentication
* Authorization
* Owner/viewer access control
* Private/public access control
* File size limits
* File type validation
* Secure file storage
* Filename sanitization
* Safe previews
* Sandboxed HTML/CSS/JS execution
* Protection against malicious uploads

Never execute arbitrary uploaded programs on the server.

Python, C, C++, Java and similar files should be treated as files/code for viewing unless a future secure execution system is intentionally implemented.

---

# 25. Responsive Design

The main target is:

**Desktop/Laptop**

because the platform is designed for presentation and teaching.

Desktop:

```text
70% / 30%
```

For smaller screens, adapt intelligently instead of forcing an unusable 70/30 layout.

Possible mobile layout:

```text
Slide
  ↓
Resources
```

---

# 26. MVP

The MVP must focus on proving the core product.

### MVP Features

#### Presentation

* User authentication
* Dashboard
* Create presentation
* Add/delete/reorder slides
* Text
* Images
* Save presentation

#### Unique Layout

* 70/30 layout
* Diagonal `/` divider
* Draggable divider
* Reset to 70/30

#### Resources

* Slide-specific notes
* Multiple resources per slide
* File uploads
* Images
* PDFs
* Text/code files
* Resource preview where supported

#### Presentation

* Presentation Mode
* Slide navigation
* Interactive resource panel
* Screen-sharing-friendly layout

#### Sharing

* Private presentations
* Public presentations
* Public presentation URL
* Creator/Viewer permissions

#### Fork System

* Fork public presentation
* Create independent editable copy
* Store relationship to original
* Show original version
* Detect when original has updates
* Basic Pull Updates functionality

### Do NOT prioritize for MVP

* AI-generated presentations
* Social media/feed system
* Likes/followers
* Real-time collaboration
* Video conferencing
* Advanced analytics
* Mobile application
* Full PowerPoint import/export
* Advanced animation engine
* Arbitrary Python/C/C++ execution
* Complex enterprise permissions

---

# 27. MVP Success Test

The MVP is successful if this complete workflow works:

```text
Teacher creates presentation
        ↓
Creates 5 slides
        ↓
Adds text/images
        ↓
Adds notes to slides
        ↓
Attaches HTML, CSS, PDF, JPG, TXT, PY, etc.
        ↓
Uses 70/30 layout
        ↓
Drags diagonal divider
        ↓
Enters Presentation Mode
        ↓
Shares screen
        ↓
Opens resources while presenting
        ↓
Runs safe HTML/CSS/JS preview
        ↓
Publishes presentation
        ↓
Viewer opens public presentation
        ↓
Viewer cannot edit original
        ↓
Viewer clicks FORK
        ↓
Viewer gets independent editable copy
        ↓
Original creator updates presentation
        ↓
Fork owner sees "Updates Available"
        ↓
Fork owner clicks PULL UPDATES
```

If this workflow works smoothly, the core concept has been successfully validated.

---

# 28. Product Boundaries

Do NOT turn the project into:

* A full LMS
* Google Classroom clone
* Zoom clone
* Social network
* Full IDE
* Cloud storage replacement
* General-purpose project management system

The core product is:

> **A presentation maker and presentation-sharing platform with slide-specific interactive resources and GitHub-style Fork/Pull editing.**

---

# 29. Final Product Vision

The final experience should feel like:

> **PowerPoint + contextual resources + presentation mode + public/private sharing + GitHub-style presentation forking.**

The defining interface:

```text
                    PRESENTATION

┌──────────────────────────────╱──────────────────────┐
│                              ╱                      │
│                              ╱  📝 NOTES            │
│                              ╱                      │
│        MAIN SLIDE            ╱  📄 FILE             │
│             70%              ╱  🖼 IMAGE            │
│                              ╱  📕 PDF              │
│                              ╱  🎥 VIDEO            │
│                              ╱  🔗 LINK             │
└──────────────────────────────╱──────────────────────┘
                               30%
```

Then:

```text
                    PRESENT
                       ↓
                 SCREEN SHARE
                       ↓
                PUBLIC / PRIVATE
                       ↓
                      FORK
                       ↓
                YOUR OWN COPY
                       ↓
                  PULL UPDATES
```

## Most Important Requirements

1. **The 70/30 presentation + resource layout is the core visual identity.**
2. **The diagonal `/` divider must be stylish and draggable.**
3. **Resources belong to individual slides.**
4. **Multiple resource types and multiple resources per slide must be supported.**
5. **Presentation Mode must work naturally during screen sharing.**
6. **Viewers cannot directly edit the creator's presentation.**
7. **Editing another person's presentation happens through Fork.**
8. **Forks are independent copies connected to the original.**
9. **Fork owners can Pull Updates from the original.**
10. **Private/Public access must be enforced server-side, not just hidden in the UI.**
11. **Creator and Viewer permissions must be strictly separated.**
12. **Do not lose the core concept by adding unnecessary features.**

Build the MVP first, make the core experience polished, and only then expand the platform.
