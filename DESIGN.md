# Questify — Design & Architecture Reference

> Complete reference for rebuilding or extending the app. Covers stack, design system, routing, state, API, and per-page patterns.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Routing | react-router-dom v6 |
| Styling | Tailwind CSS v3 + tailwindcss-animate |
| UI Components | shadcn/ui (Radix UI primitives) |
| Icons | @phosphor-icons/react |
| Animations | framer-motion |
| Charts | Recharts + D3 |
| Forms | react-hook-form + zod |
| Server state | @tanstack/react-query |
| Toasts | sonner |
| Theme | next-themes (light/dark) |
| HTTP | Native fetch (custom `api` wrapper in `src/lib/api.ts`) |
| Auth token | `localStorage` key `questify-token` |
| Build | Vite, `npm run dev` / `npm run build` |

---

## 2. Design System

### 2.1 Color Tokens (CSS variables in `src/index.css`)

**Light mode**
```
--background:        225 100% 99%   (near-white blue tint)
--foreground:        230 25% 10%    (near-black)
--card:              0 0% 100%
--primary:           228 91% 59%    (electric blue)
--primary-foreground: 0 0% 100%
--secondary:         263 70% 58%    (soft violet)
--muted:             225 30% 96%
--muted-foreground:  225 15% 50%
--accent:            174 62% 47%    (teal)
--destructive:       0 84% 60%
--success:           142 70% 45%
--warning:           38 92% 50%
--border:            225 20% 92%
--radius:            0.3rem          (small, near-square)
--sidebar-background: 0 0% 100%     (pure white)
```

**Dark mode**
```
--background:        222 47% 4%     (deep midnight blue)
--card:              222 35% 8%
--primary:           228 91% 65%    (slightly lighter blue)
--secondary:         263 70% 65%
--muted:             222 20% 12%
--sidebar-background: 222 47% 2%   (absolute deep midnight)
```

**Custom semantic tokens**
```
--confidence-low:    0 70% 55%      (red)
--confidence-medium: 38 92% 50%     (amber)
--confidence-high:   142 70% 45%    (green)
```

### 2.2 Typography

- Font family: `Inter` (sans), `Cal Sans` (display/headings)
- Heading scale: `text-3xl font-bold` (page titles), `text-xl font-bold` (section), `text-sm font-bold uppercase tracking-wider` (labels)
- Body: `text-sm` / `text-base`, `text-muted-foreground` for secondary text
- Monospace: `font-mono` for OTP inputs, code blocks

### 2.3 Border Radius

`--radius: 0.3rem` — intentionally small/square feel.
- Cards: `rounded-lg` (= 0.3rem) or `rounded-2xl` / `rounded-3xl` for feature cards
- Buttons: `rounded-full` (pill) for primary CTAs, `rounded-xl` for secondary
- Inputs: `rounded-lg`
- Badges: `rounded-full`

### 2.4 Spacing & Layout

- Page max-width: `max-w-5xl` (exam/notes), `max-w-7xl` (dashboard)
- Page padding: `p-4 md:p-6 lg:p-8` (via Layout)
- Card padding: `p-5` (stat cards), `p-6 md:p-8` (content cards)
- Grid gaps: `gap-4` (tight), `gap-6` (standard), `gap-8` (sections)

### 2.5 Utility Classes (defined in `index.css`)

```css
.glass              /* glassmorphism: backdrop-blur-20px + glass-background */
.gradient-text      /* primary→secondary gradient clipped to text */
.gradient-primary   /* background: linear-gradient(135deg, primary→secondary) */
.gradient-hero      /* page hero background */
.shadow-glow        /* box-shadow: 0 0 40px primary/25 */
.neural-pattern     /* radial gradient background decoration */
.animate-float      /* 6s float up/down */
.animate-pulse-slow /* 4s pulse */
.animate-fade-in    /* 0.5s fade + slide up */
.animate-scale-in   /* 0.3s scale from 0.95 */
.hover-lift         /* -translate-y-1 + shadow-lg on hover */
```

### 2.6 Shadows

```
--shadow-sm:  0 2px 8px  primary/8%
--shadow-md:  0 4px 20px primary/12%
--shadow-lg:  0 8px 40px primary/15%
--shadow-glow: 0 0 40px  primary/25%
```

### 2.7 Animations (Tailwind keyframes)

`fade-in`, `scale-in`, `slide-in-right`, `slide-out-right`, `pulse-slow`, `bounce-slow`, `accordion-down/up`

---

## 3. File Structure

```
src/
├── App.tsx                    # Router + provider tree
├── index.css                  # Design tokens + utilities
├── lib/
│   ├── api.ts                 # Fetch wrapper (api.get/post/patch/put/delete/postForm/putForm)
│   └── utils.ts               # cn() helper
├── contexts/
│   ├── AuthContext.tsx         # Token, user profile, auth methods
│   ├── GlobalStateContext.tsx  # Profile, collections, materials (bootstrapped on login)
│   └── AppContext.tsx          # UI preferences (sidebarCollapsed)
├── services/
│   ├── apiClient.ts            # Axios-compatible fetch wrapper (for authService)
│   ├── authService.ts          # Auth API calls (register/verify/login/etc.)
│   ├── collectionsService.ts   # GET /collections/
│   ├── noteService.ts          # Notes CRUD (getNotes/generateNote/deleteNote)
│   └── studyService.ts         # Study methods (pomodoro/feynman/leitner/sq3r/active-recall)
├── pages/
│   ├── Landing.tsx
│   ├── Auth.tsx                # All auth flows in one page (login/register/verify-otp/forgot/reset)
│   ├── VerifyOTP.tsx           # Standalone /verify-otp route
│   ├── ForgotPassword.tsx      # Standalone /forgot-password route
│   ├── ResetPassword.tsx       # Standalone /reset-password route
│   ├── Dashboard.tsx
│   ├── Upload.tsx
│   ├── Exam.tsx                # Exam configuration
│   ├── ExamRoomPage.tsx        # Active exam session
│   ├── ExamResultPage.tsx      # Post-submit graded results
│   ├── ExamHistory.tsx         # Past submissions list
│   ├── Notes.tsx               # Cognitive Studio (collection + method selector)
│   ├── NoteRoom.tsx            # Note viewer/renderer
│   ├── StudyRoom.tsx           # Study method session
│   ├── QuestyChat.tsx          # AI chat
│   ├── Planner.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── Notifications.tsx
│   ├── Billing.tsx
│   └── AdminDashboard.tsx
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Shell: sidebar + sticky header + main
│   │   ├── DashboardLayout.tsx # Thin wrapper around Layout
│   │   ├── AppSidebar.tsx      # Collapsible desktop sidebar + mobile Sheet
│   │   └── Navbar.tsx
│   ├── exam/
│   │   ├── QuestionRenderer.tsx
│   │   ├── MCQRenderer.tsx
│   │   ├── TFRenderer.tsx
│   │   ├── MatchingRenderer.tsx
│   │   ├── FillBlankRenderer.tsx
│   │   └── CodeRenderer.tsx
│   ├── notes/
│   │   ├── CornellNote.tsx
│   │   ├── OutlineNote.tsx
│   │   ├── MindMapNote.tsx
│   │   ├── ChartingNote.tsx
│   │   ├── BoxingNote.tsx
│   │   ├── SentenceNote.tsx
│   │   └── NotesListSheet.tsx  # Slide-in sheet for listing/generating notes
│   ├── study/
│   │   ├── BookSelector.tsx    # Collection picker (real API)
│   │   ├── StudyMethodSelector.tsx
│   │   ├── StudySessionLayout.tsx
│   │   └── methods/
│   │       ├── PomodoroMethod.tsx
│   │       ├── FeynmanMethod.tsx
│   │       ├── LeitnerSystem.tsx
│   │       ├── SQ3RMethod.tsx
│   │       └── ActiveRecall.tsx
│   ├── ai/
│   │   └── AIAssistantButton.tsx
│   ├── walkthrough/
│   │   ├── WalkthroughContext.tsx
│   │   ├── WalkthroughManager.tsx
│   │   └── WalkthroughTooltip.tsx
│   └── ui/                    # shadcn/ui components (button, card, input, etc.)
```

---

## 4. Routing

```
/                   Landing
/auth               Auth (login + register + verify-otp + forgot + reset — all in one page via flow state)
/verify-otp         Standalone OTP verification (navigated to from register)
/forgot-password    Standalone forgot password
/reset-password     Standalone reset password (receives email via location.state)
/dashboard          Dashboard
/upload             Upload & preprocess materials
/exam               Exam configuration
/exam-room          Active exam (receives exam data via location.state.exam)
/exam-result        Graded result (receives result + questions via location.state)
/exam-history       Past submissions
/notes              Cognitive Studio (Notes hub)
/study-room         Study method session
/questy-chat        AI chat
/planner            Study planner
/profile            User profile
/settings           Settings
/notifications      Notifications
/billing            Billing
/admin              Admin dashboard
```

---

## 5. Layout System

### Shell (`Layout.tsx`)
- Sticky top header: `h-14`, `bg-background/80 backdrop-blur-md`, `border-b`, `z-30`
- Header contains: page title, search bar (hidden on mobile), theme toggle, notifications bell (badge=3), user avatar + name
- Sidebar offset: `pl-64` (expanded) / `pl-[72px]` (collapsed) on desktop; `pl-0` on mobile
- Main content: `flex-1 p-4 md:p-6 lg:p-8`
- `AIAssistantButton` floats globally

### Sidebar (`AppSidebar.tsx`)
- Desktop: fixed left, `w-64` expanded / `w-[72px]` collapsed, `z-40`
- Mobile: Sheet overlay triggered by hamburger button (`fixed top-4 left-4 z-50`)
- Logo: `w-8 h-8 rounded-lg bg-primary` with `GraduationCap` icon
- Active nav item: `bg-primary/10 text-primary font-bold` + small dot indicator
- Collapsed state: icons only with Tooltip on hover
- Bottom: Sign Out button
- Nav sections: Main (8 items) + Account (3 items)

**Nav items:**
```
Dashboard       /dashboard
Upload Material /upload
Exam Room       /exam
Note Room       /notes
Study Room      /study-room
Questy AI       /questy-chat
Exam History    /exam-history
Study Planner   /planner
---
Profile         /profile
Notifications   /notifications
Settings        /settings
```

---

## 6. API Layer

### Base client (`src/lib/api.ts`)
```
BASE_URL = "http://0.0.0.0:8000/api"
Token: localStorage.getItem("questify-token")
Header: Authorization: Bearer <token>
Response envelope: { success, message, data }
```

Methods: `api.get<T>(path)`, `api.post<T>(path, body)`, `api.patch`, `api.put`, `api.delete`, `api.postForm`, `api.putForm`

### Secondary client (`src/services/apiClient.ts`)
Axios-compatible fetch wrapper used by `authService.ts`. Strips `/api` prefix from paths, throws on `!success`, returns `{ data: envelope }`.

### Services
- `collectionsService.getCollections()` → `GET /collections/`
- `noteService.getNotes(methodId, collectionId)` → `GET /notes/{type}/{collection_id}`
- `noteService.generateNote(methodId, collectionId)` → `POST /notes/{type}`
- `noteService.deleteNote(methodId, noteId)` → `DELETE /notes/{type}/{note_id}`
- Method ID → API path: `mindmap` → `mind-map`, others match
- `studyService.generate*/get*` → `POST/GET /study/{method}` (pomodoro, feynman, leitner, sq3r, active-recall)

---

## 7. State Management

### AuthContext
- `user: UserProfile | null`, `token: string | null`, `loading: boolean`
- Methods: `signIn`, `signUp`, `verifyOtp`, `resendOtp`, `forgotPassword`, `resetPassword`, `signOut`
- Token stored in `localStorage` as `questify-token`
- On mount: if token exists, fetches `GET /auth/user/profile` to hydrate user

### GlobalStateContext
Bootstrapped on login (when `token` changes). Provides:
- `profile: FullProfile | null` — from `GET /auth/user/profile/full`
- `avatarUrl: string | null` — blob URL from `GET /auth/user/avatar`
- `collections: Collection[]` — from `GET /collections/`
- `materials: Material[]` — from `GET /material/`
- Mutation methods: `updateProfile`, `uploadAvatar`, `deleteAvatar`, `deleteCollection`, `uploadMaterial`, `deleteMaterial`

### AppContext
- `preferences.sidebarCollapsed: boolean`
- `setSidebarCollapsed()`

---

## 8. Auth Flow

### Single-page flow (`/auth`)
State machine with `flow` variable: `"login" | "register" | "verify-otp" | "forgot-password" | "reset-password"`
- Register → OTP sent → transitions to `verify-otp`
- Login with unverified account → transitions to `verify-otp`
- Forgot password → transitions to `reset-password`
- All flows share the same left-panel branding layout

### Standalone pages
- `/verify-otp` — receives `email` via `location.state.email`, 60s resend cooldown
- `/forgot-password` — navigates to `/reset-password` with `{ email }` state on success
- `/reset-password` — receives `email` via `location.state.email`

---

## 9. Page Patterns

### Exam Flow
1. `/exam` — configure: collection, chapters, question count (5–50), difficulty (Easy/Medium/Hard/Mixed), question types
2. `POST /exam/generate-exam` → navigate to `/exam-room` with `location.state.exam`
3. `/exam-room` — sticky progress bar + timer (1.5 min/question), question navigator, question cards
4. `POST /exam/submit` → navigate to `/exam-result` with `{ result, questions, examTitle }`
5. `/exam-result` — score circle, per-question breakdown with feedback

**Answer serialization:**
- Multiple Choice: `String(0-based-index)` e.g. `"2"`
- True/False: `"True"` or `"False"`
- Fill in Blank / Short Answer / Coding: raw string
- Matching: `JSON.stringify({ leftLabel: rightValue })` e.g. `'{"A":"1","B":"2"}'`

**Matching question bugs fixed:**
- Deselect propagation: store as `Record<string, string>` (not array), parse back from JSON on render
- Blur styling: selected dropdown gets `opacity-50`, unselected gets `font-bold text-foreground`

### Notes Flow (Cognitive Studio)
1. `/notes` — left: collection list with search; right: method tabs (6 methods)
2. Select collection + method tab → notes list loads via `GET /notes/{type}/{collection_id}`
3. "Launch Studio" → generates new note via `POST /notes/{type}` → opens NoteRoom
4. Click existing note → opens NoteRoom with mapped content
5. `NotesListSheet` — slide-in panel (right side) for listing/generating notes per method

**Supported note methods:** `cornell`, `outline`, `mindmap` (→ `mind-map`), `boxing`, `charting`, `sentence`

**API → NoteContent mapping (`toNoteContent`):**
- cornell: `{ cues: [{keyword, content}], summary }`
- outline: `{ sections: [{heading, level:1, bullets}] }`
- mindmap: `{ center: root.label, branches: [{title, color, items}] }`
- boxing: `{ boxes: [{title, color, items}] }`
- charting: `{ headers: columns, rows }`
- sentence: `{ sections: [{content}] }`

### Study Room Flow
1. `BookSelector` — fetches real collections from `GET /collections/`
2. `StudyMethodSelector` — 11 method cards (5 API-backed: pomodoro, feynman, leitner, sq3r, active_recall)
3. On method select: `GET /study/{method}/{collection_id}` to fetch existing data
4. If no data: "Initialize" button → `POST /study/{method}` then re-fetch
5. Method components receive `studyData` prop; fall back to mock data if null

### Chat Flow (`/questy-chat`)
- On mount: `GET /api/chat/sessions` → populate sidebar
- Select session: `GET /api/chat/sessions/{id}/messages`
- Send: `POST /api/chat/ask` with `{ question, session_id? }`
  - No `session_id` → new session created by API; returned `session_id` stored
  - Optimistic user message added immediately
- Session list updated with new session after first message

### Exam History (`/exam-history`)
- `GET /api/exam/results` on mount
- Stats: total exams, average score %, best score %
- Trend chart (LineChart) shown when ≥2 results
- Per-result: score circle (green ≥80%, yellow ≥60%, red <60%), title, date, score/max, progress bar, status badge

---

## 10. Component Patterns

### Cards
```tsx
// Stat card pattern
<Card className="rounded-lg border-none shadow-sm">
  <CardContent className="p-5">...</CardContent>
</Card>

// Feature card with gradient overlay
<div className="relative overflow-hidden rounded-3xl border bg-card p-8 group cursor-pointer hover:-translate-y-1 transition-all">
  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 bg-gradient-to-br from-blue-500 to-cyan-500" />
  ...
</div>
```

### Buttons
```tsx
// Primary CTA
<Button className="rounded-full px-10 h-12 font-bold shadow-lg shadow-primary/20">

// Icon button
<Button variant="ghost" size="icon" className="rounded-full h-9 w-9">

// Destructive
<Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
```

### Loading states
- Skeleton: `<Skeleton className="h-{n} rounded-{x}" />` from shadcn
- Spinner: `<CircleNotch className="w-5 h-5 animate-spin" />` from phosphor
- Page-level: centered flex column with spinner + text

### Empty states
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center gap-3">
  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">{icon}</div>
  <p className="font-semibold text-sm">No items yet</p>
  <p className="text-xs text-muted-foreground">Descriptive message</p>
</div>
```

### Error states
```tsx
<div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground text-sm">
  <Warning className="w-5 h-5 shrink-0" />{errorMessage}
</div>
```

### Score/percentage circles
```tsx
<div className={cn(
  "w-24 h-24 rounded-full flex items-center justify-center mx-auto text-3xl font-bold",
  pct >= 80 ? "bg-green-100 text-green-600 dark:bg-green-900/30"
    : pct >= 60 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
      : "bg-red-100 text-red-600 dark:bg-red-900/30"
)}>
  {pct}%
</div>
```

### Tabs (method selector pattern)
```tsx
<Tabs value={selectedMethodId} onValueChange={setSelectedMethodId}>
  <TabsList className="grid grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
    <TabsTrigger value={m.id} className="rounded-xl py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg">{m.icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-tighter">{m.name.split(' ')[0]}</span>
      </div>
    </TabsTrigger>
  </TabsList>
</Tabs>
```

---

## 11. Dashboard Design

- Title: "NeuroLearning Command Center"
- 4-column stat grid: Mastery Score, Learning Streak, Deep Focus, Retention
- Charts: AreaChart (performance trends), BarChart (subject proficiency), LineChart (daily engagement), RadarChart (cognitive profile), RadialBarChart (learning distribution)
- Action grid: 4 FocusCards with gradient overlays
- Week overview: dual progress bars per day
- All chart data is currently mock-generated (no API integration yet)
- Chart tooltip style: `backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem'`

---

## 12. Theme

- Provider: `next-themes` with `defaultTheme="light"`, `storageKey="questify-theme"`, `attribute="class"`
- Toggle: Sun/Moon icons in header, also in sidebar
- Dark mode class applied to `<html>`

---

## 13. Notifications & Toasts

- `sonner` for toast notifications (`toast.success`, `toast.error`, `toast.info`)
- shadcn `Toaster` also present (legacy)
- Notification bell in header shows hardcoded badge `3`

---

## 14. Walkthrough System

- `WalkthroughProvider` + `WalkthroughManager` + `WalkthroughTooltip`
- Nav items have `id` attributes (`nav-dashboard`, `nav-upload`, etc.) for targeting
- Walkthrough steps defined in `src/data/walkthroughSteps.ts`

---

## 15. Key Data Interfaces

```typescript
// Auth
interface UserProfile { user_id, full_name, email, avatar_url, is_verified, created_at, updated_at }
interface FullProfile extends UserProfile { peak_performance_time, total_study_hours, exams_completed, average_score, current_streak, longest_streak }

// Collections & Materials
interface Collection { collection_id, user_id, title, description, confidence, created_at }
interface Material { material_id, file_name, file_type, file_size, status, collection_id, created_at }

// Exam
interface Question { question_id, question_type, question_text, difficulty, content, explanation? }
interface ExamData { exam_id, exam_title, questions: Question[] }
interface GradedItem { graded_item_id, question_id, user_answer, is_correct, score_attained, feedback_note, graded_by }
interface SubmitResult { submission_id, exam_id, total_score, max_score, status, created_at, graded_items }
interface ExamResult { submission_id, exam_id, exam_title, total_score, max_score, status, created_at }

// Chat
interface ChatSession { session_id, title, created_at }
interface Message { message_id (or id), role: 'user'|'assistant', content, created_at }

// Notes (NoteContent from src/data/mockNotes.ts)
interface NoteContent { id, courseId, title, date, method, cues?, summary?, sections?, center?, branches?, boxes?, headers?, rows? }
```

---

## 16. Mock Data Still In Use

- `Dashboard.tsx` — all chart data is mock-generated (no API)
- `ExamRoom.tsx` (old, unused route) — uses mock questions
- `ActiveRecall.tsx` — uses `MOCK_FLASHCARDS` as fallback
- `LeitnerSystem.tsx` — uses `MOCK_FLASHCARDS` as fallback when no `studyData`
- `SQ3RMethod.tsx` — uses `MOCK_CHAPTERS` as fallback when no `studyData`
- `FeynmanMethod.tsx` — fully mock (no `studyData` integration yet)
- `PomodoroMethod.tsx` — timer is self-contained, no API data needed

---

## 17. jsPDF Integration

Used in `Notes.tsx` and `NoteRoom.tsx` for PDF download of notes. Not in `package.json` — added as `jspdf` (check if installed). Download button in NoteRoom header.

---

## 18. Framer Motion Usage

- `AnimatePresence` + `motion.div` for page/panel transitions
- Chat welcome screen ↔ message stream transition
- Leitner card flip and slide animations
- `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}`

---

## 19. Responsive Breakpoints

- Mobile: `< 1024px` — sidebar becomes Sheet overlay, hamburger button shown
- `useIsMobile()` hook: `window.innerWidth < 1024`
- Grid patterns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Sidebar: `hidden lg:block` (desktop), mobile trigger: `lg:hidden`
