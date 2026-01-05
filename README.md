# Monotask

A minimal productivity app for tasks and habits. Built with React, TypeScript, and Supabase.

## Table of contents
- [What it does](#what-it-does)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How it’s built](#how-its-built)
- [Database](#database)
- [Auth](#auth)
- [Data + state](#data--state)
- [Security](#security)
- [Export](#export)
- [Project structure](#project-structure)
- [Setup (local dev)](#setup-local-dev)
- [Scripts](#scripts)
- [Assumptions](#assumptions)
- [Roadmap ideas](#roadmap-ideas)

---

## What it does
Monotask helps you:
- create tasks with dates, priority, and tags
- track habits on a daily/weekly/monthly schedule
- view your workload in a calendar
- see progress charts and activity history
- export your data (PDF + CSV)

---

## Features
- **Tasks**
  - create, edit, delete, complete
  - due date + optional time
  - priority + tag
  - recurring tasks (daily/weekly/monthly) with instance tracking
- **Habits**
  - define a habit schedule
  - log status as done, skipped, or missed
- **Calendar**
  - month, week, and agenda style views
- **Progress**
  - weekly completion chart
  - tag/category distribution
  - activity heatmap
- **Tags**
  - user-defined, color-coded
- **Themes**
  - light/dark
- **Guest mode**
  - anonymous session
  - upgrade to a full account without losing data

---

## Tech stack
- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Routing:** React Router DOM v6
- **Forms + validation:** React Hook Form + Zod
- **Data layer:** TanStack Query
- **Charts:** Recharts
- **Backend:** Supabase (Postgres, Auth, RLS)
- **Toasts:** Sonner
- **PDF:** jsPDF

---

## How it’s built
High-level flow:
- UI pages render views (Dashboard, Tasks, Habits, Calendar, Progress, Settings)
- Custom hooks handle reads/writes (tasks, habits, tags, settings, auth)
- TanStack Query caches results and syncs changes
- Supabase provides Auth + Postgres with Row Level Security

Provider order (simplified):
- Query client (TanStack Query)
- Tooltip provider (UI)
- Auth provider
- Settings provider
- Router + routes

---

## Database
Main tables:
- `profiles` user preferences and metadata
- `tasks` tasks with optional recurrence
- `task_instances` per-occurrence status for recurring tasks
- `habits` habit definitions
- `logs` habit/task history records
- `tags` user categories
- `goals` simple goal tracking

Relationships (simplified):
- a user owns many tasks, habits, tags, goals
- a task can reference a tag
- a habit can reference a tag
- recurring tasks create rows in `task_instances`
- `logs` can reference a habit and/or task

### Notes on recurring tasks
Recurring tasks are stored once in `tasks`, and each occurrence is tracked in `task_instances` so “complete” is accurate per day.

---

## Auth
Supported sign-in paths:
- **Email/password**
- **Anonymous (guest)**
- **Upgrade guest → full account**
  - links email/password to the existing anonymous user
  - keeps existing tasks/habits/tags

A database trigger initializes new users:
- creates a profile row with default settings
- inserts a small set of default tags

---

## Data + state
The app uses TanStack Query for:
- caching
- background refetch
- optimistic updates
- query invalidation

Common query keys:
- `['tasks', userId]`
- `['task-instances', userId]`
- `['habits', userId]`
- `['habit-logs', userId]`
- `['tags', userId]`
- `['tags-with-usage', userId]`
- analytics keys like weekly progress and heatmap

---

## Security
Row Level Security is enabled on all tables.

General rule:
- rows are only readable/writable by the owning user (`auth.uid() = user_id`)

Special case:
- `task_instances` uses the parent task’s owner to decide access.

---

## Export
- **CSV**: tasks, habits, and logs in a structured format
- **PDF**: summary report with key metrics

Utilities live in:
- `src/utils/pdfExport.ts`
- any CSV helpers (if present) live near Settings/Progress export UI

---

## Project structure
```txt
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── ui/                      # shadcn/ui
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── TaskManager.tsx
│   ├── TaskModal.tsx
│   ├── CalendarView.tsx
│   ├── HabitsView.tsx
│   ├── HabitModal.tsx
│   ├── TagsView.tsx
│   ├── ProgressView.tsx
│   ├── Settings.tsx
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   ├── ConfirmDialog.tsx
│   ├── DayTasksModal.tsx
│   ├── TagSelector.tsx
│   ├── TimeInput.tsx
│   └── UpgradeAccountModal.tsx
├── hooks/
│   ├── useAuth.tsx
│   ├── useTasks.tsx
│   ├── useHabits.tsx
│   ├── useTags.tsx
│   ├── useSettings.tsx
│   ├── useTaskInstances.tsx
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── utils/
│   ├── pdfExport.ts
│   └── recurringTasks.ts
└── lib/
    └── utils.ts

supabase/
├── config.toml
└── migrations/
