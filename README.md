# Dot X Library — Learn • Connect • Grow

**Dot X Library** is a complete, production-ready, scalable digital academic platform designed for higher education institutions, universities, students, educators, and library administrators.

---

## 🌟 Key Features

### 1. Curated Academic Repositories & Advanced PDF Reader
- **Textbook Browsing & Filtering**: Filter by category, author, newest, popular, and featured titles.
- **Embedded WebGL/HTML5 PDF Reader**:
  - Two-page and single-page reading modes
  - Zoom in/out, fit to screen, fullscreen reading
  - Bookmarking chapters and reading position memory
  - Chapter navigation drawer and search inside text
  - Granular RBAC-enforced download permissions (watermarked and encrypted protection)

### 2. Live Virtual Classrooms & WebRTC Lectures
- **Synchronous Audio/Video Lecture Sessions**: Real-time video grid with host spotlight and student participant streams.
- **Classroom Controls**: Mute/unmute microphone, toggle video camera, screen sharing (IDE and lecture slides).
- **Interactive Hand-Raise**: Real-time inquiry queue notifying professors and moderators.
- **Live Class Chat & Attendee Roster**: Moderated real-time discussion thread.

### 3. Collaborative Academic Whiteboard
- Freehand pen, highlighter, and eraser with stroke width selector.
- Geometric shapes (rectangles, circles, lines, vectors, coordinate arrows).
- Mathematical proof annotations and algorithm trees.
- Full undo/redo stack, canvas clear, cloud synchronization, and PNG export.
- Host privilege controls to lock whiteboard canvas for student view-only mode during lectures.

### 4. Pedagogical AI Academic Assistant
- Powered by **Google Gemini 2.5 Flash** via `@google/genai`.
- Tuned specifically for university-level computer science, calculus, physics, and literature.
- Step-by-step mathematical proofs, syntax-highlighted code blocks, and academic citations.
- Subject-based prompts and conversation history memory.
- Decoupled architecture allowing model swaps without application rebuilding.

### 5. Role-Based Access Control (RBAC) & Administrative Control Center
- **4 Primary Security Profiles**:
  1. `superadmin`: Master institutional authority (manage admins, RBAC matrix, system settings).
  2. `admin` (Academic Dean): Book publishing, category governance, lecture scheduling.
  3. `teacher` (Professor): Lecture hosting, whiteboard moderation, course student chat.
  4. `student`: Textbook reading, downloads (where authorized), inquiry submissions, classroom attendance.
- **Interactive RBAC Permission Matrix**: Super Admins can toggle granular capabilities (`manage_books`, `manage_users`, `manage_meetings`, etc.) per role in real-time.
- **Security Audit Logs**: Immutable activity trail recording user actions, timestamps, and IP addresses.
- **Campus Bulletin Dispatch**: Broadcast urgent notices targeted to all users, students, or faculty.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express, tsx.
- **AI Engine**: Google Gemini API (`@google/genai`).
- **Security**: SHA-256 cryptographic password hashing, JWT-compatible session tokens, brute-force rate limiting, and RBAC middleware.
- **Real-Time Communication**: In-memory WebRTC state synchronization and live chat event queues.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/dotxlibrary/dot-x-library.git
cd dot-x-library

# Install dependencies
npm install

# Start the full-stack development server (Express + Vite)
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## 🔐 Demo Accounts

Dot X Library comes preloaded with four distinct demo personas switchable with one click in the top navigation bar:

| Role | Username / Email | Password | Primary Capabilities |
|---|---|---|---|
| **Super Admin** | `admin@dotxlibrary.com` | `password123` | Full system control, RBAC matrix, admin provisioning |
| **Dean / Admin** | `zain@dotxlibrary.com` | `password123` | Book CRUD, category management, lecture scheduling |
| **Professor / Host** | `sarah@dotxlibrary.com` | `password123` | Classroom hosting, whiteboard lock, student messaging |
| **Student** | `jawadhassan5464@gmail.com` | `password123` | Textbook reading, AI assistant, classroom attendance |

---

## 📄 License
Academic Open Source License - Designed for global university collaboration.
