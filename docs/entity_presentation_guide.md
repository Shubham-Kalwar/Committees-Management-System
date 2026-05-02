# Entity Architecture & Presentation Guide (Enhanced)

This guide provides a comprehensive, end-to-end breakdown of all 13 core entities in the CommitteeOS project. It covers the backend flow, frontend Angular architecture, relational database schema, and specific "talking points" to impress your professor.

---

## 1. Authentication & Identity Management

### `Roles`
- **What it does**: Defines the authorization level of a user (`ADMIN`, `FACULTY`, `STUDENT`).
- **Database Details**: 
  - Table: `roles`
  - Columns: `role_id` (PK), `role_name` (UNIQUE).
  - Relationships: One-to-Many with `Users` (a role can belong to many users).
- **Backend Flow**: Spring Security queries `RolesRepository` to assign GrantedAuthorities during the JWT generation phase. Controller: `RolesController`.
- **Frontend Details**: 
  - Handled implicitly via `auth.service.ts` decoding the JWT payload. The UI uses route guards (e.g., `AdminGuard`, `FacultyGuard`) to hide elements based on the decoded role.
- **What to tell your professor**: "We implemented a strict Role-Based Access Control (RBAC) system. The `Roles` table is a normalized lookup table. During the JWT authentication flow, Spring Security extracts these roles to ensure, for example, that only Admins and Faculty can approve event registrations."

### `Login`
- **What it does**: Securely stores authentication credentials.
- **Database Details**: 
  - Table: `login`
  - Columns: `login_id` (PK), `email` (UNIQUE), `password_hash`.
  - Relationships: Strict One-to-One with `Users`.
- **Backend Flow**: `AuthController` hits `LoginRepository` to find the user by email. Passwords are hashed using BCrypt before saving.
- **Frontend Details**: 
  - Models: `LoginRequest` in `auth.model.ts`.
  - Components: `LoginComponent`, `RegisterComponent`.
  - Flow: Submits credentials via `auth.service.ts`, receives a JWT, and stores it in `localStorage`.
- **What to tell your professor**: "To strictly separate authentication concerns from profile data, we isolated credentials into the `Login` table. Passwords are encrypted using BCrypt, and it's the primary table hit when generating stateless JWTs, keeping our security logic modular."

### `Users`
- **What it does**: The central profile entity storing personal details and onboarding tracking fields.
- **Database Details**: 
  - Table: `users`
  - Columns: `user_id` (PK), `name`, `phone`, `roll_number`, `onboarding_completed`, `login_id` (FK, UNIQUE), `role_id` (FK).
- **Backend Flow**: `UsersController` manages profile updates. `CustomUserDetailsService` loads this entity into the Security Context.
- **Frontend Details**: 
  - Models: `User` in `user.model.ts`.
  - Services: `user.service.ts`, `student-onboarding.service.ts`.
  - Components: `ProfileComponent`, `OnboardingComponent`. Uses state management (`UserStateService`) to broadcast profile updates across the app.
- **What to tell your professor**: "The `Users` entity is the heart of the system. It maps One-to-One with `Login` to keep profiles clean. We recently added boolean flags here to track if a student has completed their onboarding flow, which our Angular frontend uses to conditionally lock the workspace."

---

## 2. Core Organization

### `Committee`
- **What it does**: Represents the different groups or clubs within the college. Events are hosted under the umbrella of a committee.
- **Database Details**: 
  - Table: `committee`
  - Columns: `committee_id` (PK), `name`, `description`, `created_at`.
- **Backend Flow**: `CommitteeController` exposes basic CRUD operations restricted primarily to Admins.
- **Frontend Details**: 
  - Services: `committee.service.ts`.
  - Components: `CommitteeListComponent` (grid view of clubs), `CommitteeDetailComponent`. 
- **What to tell your professor**: "The `Committee` entity acts as our primary grouping mechanism. While currently simple, the schema is designed to scale so that we can easily add foreign keys to assign specific faculty advisors or budget constraints in future iterations."

---

## 3. Event Management

### `EventCategory`
- **What it does**: A standardized lookup table for event types (e.g., Workshop, Seminar, Hackathon).
- **Database Details**: 
  - Table: `event_category`
  - Columns: `category_id` (PK), `category_name` (UNIQUE).
- **Backend Flow**: `EventCategoryController` allows dynamic addition of categories.
- **Frontend Details**: Fetched in the dropdowns of the `EventCreateComponent` allowing faculty to properly tag new events.
- **What to tell your professor**: "Instead of hardcoding event types as strings or Java enums, we normalized this into the `EventCategory` table. This allows admins to dynamically add new event types via the UI without requiring a backend code redeployment."

### `Events`
- **What it does**: The central pillar for activities. Stores the event details and links back to the `Committee` and `EventCategory`.
- **Database Details**: 
  - Table: `events`
  - Columns: `event_id` (PK), `name`, `description`, `event_date`, `location`, `max_participants`, `committee_id` (FK), `category_id` (FK).
- **Backend Flow**: `EventsController` handles complex search queries (filtering by upcoming dates, categories) via `EventsRepository`.
- **Frontend Details**: 
  - Models: `Event` in `event.model.ts`.
  - Components: `EventListComponent` (shows upcoming event cards), `EventDetailComponent` (displays full info, media, and triggers the registration flow).
- **What to tell your professor**: "The `Events` table holds the ecosystem together. It acts as the parent for registrations, attendance, and feedback. We implemented `max_participants` capacity limits here, which the backend transactionally validates before inserting new registrations."

### `EventMedia`
- **What it does**: Handles file attachments, such as event banners or gallery photos. 
- **Database Details**: 
  - Table: `event_media`
  - Columns: `media_id` (PK), `file_url`, `media_type`, `event_id` (FK).
- **Backend Flow**: `MediaUploadController` handles multipart file uploads to the server/cloud, and `EventMediaController` saves the resulting URL to the database.
- **Frontend Details**: Angular uses `FormData` in the `EventCreateComponent` to upload files, displaying them later using standard `<img>` tags bound to the `file_url`.
- **What to tell your professor**: "To keep the main `Events` table lightweight and performant, we offloaded file paths to the `EventMedia` table in a One-to-Many relationship. This architecture allows a single event to have an unlimited, scalable number of gallery photos."

---

## 4. Workflows: Registration & Attendance

### `EventParticipants` (Registrations)
- **What it does**: Resolves the Many-to-Many relationship between `Users` and `Events` through an associative entity.
- **Database Details**: 
  - Table: `event_registrations` *(renamed from event_participants)*
  - Columns: `registration_id` (PK), `status` (PENDING, APPROVED, REJECTED), `registered_at`, `user_id` (FK), `event_id` (FK).
- **Backend Flow**: `EventRegistrationsController` handles the workflow. Default status is `PENDING` upon creation.
- **Frontend Details**: 
  - Models: `EventRegistration` in `registration.model.ts`.
  - Components: `RegistrationManagementComponent` (Admin table with Approve/Reject buttons).
- **What to tell your professor**: "We didn't just use a simple Many-to-Many join table; we promoted it to a full entity called `event_registrations`. This associative table carries a state machine (`PENDING`, `APPROVED`). A student registers, and a faculty member must approve it before they are officially on the roster."

### `EventQrSession`
- **What it does**: Manages live, rotating QR codes projected by faculty during an event for secure check-ins.
- **Database Details**: 
  - Table: `event_qr_session`
  - Columns: `session_id` (PK), `qr_token` (Encrypted string), `expires_at`, `is_active`, `event_id` (FK).
- **Backend Flow**: `QrAttendanceServiceImpl` generates short-lived UUID tokens, updates the DB, and validates incoming scans against the expiration time.
- **Frontend Details**: 
  - Components: `QrProjectorComponent` (Faculty side, polls backend for new tokens), `QrScannerComponent` (Student side, uses device camera to read and POST the token).
- **What to tell your professor**: "To solve the problem of proxy attendance (students sending QR codes to friends in dorms), we built a dynamic session table. The `event_qr_session` table tracks short-lived tokens. Faculty project this token, and if a student scans an expired token, the backend rejects it."

### `Attendance`
- **What it does**: The final log of who was present.
- **Database Details**: 
  - Table: `attendance`
  - Columns: `attendance_id` (PK), `status` (PRESENT, LATE, ABSENT), `check_in_time`, `method` (MANUAL, QR), `user_id` (FK), `event_id` (FK).
- **Backend Flow**: `AttendanceController` logs the record. It compares `check_in_time` with the `Events.event_date` to dynamically determine if a user is `LATE`.
- **Frontend Details**: `attendance.service.ts` links the scanner UI to the backend. Admin views display tables of attendees fetched from this endpoint.
- **What to tell your professor**: "The `Attendance` table strictly separates the *intent* to attend (Registrations) from *actual* presence. The backend contains business logic that automatically flags users as 'LATE' if their `check_in_time` stamp is past the parent event's scheduled start time."

---

## 5. Post-Event & Operations

### `EventFeedback`
- **What it does**: Allows students to leave a rating and comment after attending an event.
- **Database Details**: 
  - Table: `event_feedback`
  - Columns: `feedback_id` (PK), `rating` (1-5), `comments`, `submitted_at`, `user_id` (FK), `event_id` (FK).
- **Backend Flow**: `EventFeedbackController` validates that the submitting user actually has a `PRESENT` record in the `Attendance` table before saving.
- **Frontend Details**: `FeedbackFormComponent` only renders on the event detail page if the `EventService` confirms the user attended.
- **What to tell your professor**: "We added an `EventFeedback` table to close the loop on event management. Critically, we enforce data integrity at the service layer: the API rejects any feedback payload if it cannot find a corresponding 'PRESENT' record for that user in the `Attendance` table."

### `Task`
- **What it does**: To-do items assigned to users, usually related to organizing an event.
- **Database Details**: 
  - Table: `tasks`
  - Columns: `task_id` (PK), `title`, `description`, `deadline`, `status` (PENDING, COMPLETED), `assignee_id` (FK to Users), `event_id` (FK, nullable).
- **Backend Flow**: `TaskController` exposes endpoints to create and complete tasks.
- **Frontend Details**: 
  - Components: `TaskBoardComponent` utilizes drag-and-drop or simple checkboxes to toggle the `status` payload sent via `task.service.ts`.
- **What to tell your professor**: "The `tasks` table drives our operational workflow. It allows faculty to assign specific duties to students. We also integrate it into our onboarding logic: new students are assigned automated introductory tasks, tracking their progress to full workspace access."

### `Announcements`
- **What it does**: Global or targeted broadcast messages from Admins/Faculty to students.
- **Database Details**: 
  - Table: `announcements`
  - Columns: `announcement_id` (PK), `title`, `message`, `priority`, `created_at`, `author_id` (FK).
- **Backend Flow**: `AnnouncementsController` handles broadcasting.
- **Frontend Details**: 
  - Components: Displayed in the `HeaderComponent` via a notification bell, or prominently on the `LandingPageComponent` feed.
- **What to tell your professor**: "We implemented an internal notification system. The `announcements` schema allows admins to broadcast high-priority messages. In the future, we plan to add a mapping table to track exactly which users have marked specific announcements as read."
