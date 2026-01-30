# Application Documentation: Work Hours Calculator

## 1. Project Overview

The Work Hours Calculator is a comprehensive, web-based time-tracking application designed for employees and freelancers. It provides an intuitive interface to log work hours, track productivity, manage time off, and get a clear overview of daily and monthly work balances. The application is built with a modern technology stack and prioritizes user experience, real-time data synchronization, and data security.

**Core Purpose:** To provide a reliable and easy-to-use tool for employees to track their work hours, ensuring they meet their daily and weekly requirements while maintaining a healthy work-life balance.

---

## 2. Target Audience

This application is designed for:
- **Employees** in companies that require manual time logging.
- **Freelancers** and **Contractors** who need to track billable hours.
- **Managers** who need a simple way for their team to report work times (future scope).

---

## 3. Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Supabase](https://supabase.com/) 
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Icons:** [Lucide React](https://lucide.dev/)
- **Date & Time:** [date-fns](https://date-fns.org/)
- **Charts:** [Recharts](https://recharts.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation

---

## 4. Application Architecture

### 4.1. Frontend Structure

The application follows the Next.js App Router paradigm.

- `src/app/page.tsx`: The main entry point for the application. It handles user authentication status and renders either the `AuthPage` or the main `Dashboard`.
- `src/app/register/page.tsx`: The user registration page.
- `src/components/`: Contains all reusable React components. Each widget on the dashboard (e.g., `Weather.tsx`, `TaskList.tsx`) is a separate component.
- `src/Supabase/`: Contains all Supabase configuration, providers, and custom hooks for interacting with Supabase services.
- `src/lib/`: Contains utility functions, static data (`quotes.json`), and the data seeding script.

### 4.2. Backend (Supabase)

#### 4.2.1. Supabase Authentication
- **Providers:** The app is configured for Email/Password authentication.
- **User Management:** When a user registers, a corresponding user profile document is created in Supabase to store related application data.

#### 4.2.2. Supabase Database
The database is structured to be secure and scalable, with a focus on user data privacy.

- **`users/{userId}`**: Stores basic user profile information (name, email).
    - **`users/{userId}/time_entries/{timeEntryId}`**: A subcollection containing all time clock events (check-ins and check-outs) for a specific user. This nested structure ensures a user can only access their own time entries via path-based security rules.
- **`quotes/{quoteId}`**: A top-level collection storing motivational quotes that are displayed on the dashboard.

### 4.3. Security Rules (`supabase.rules`)
The security rules are fundamental to the application's data integrity and privacy.
- **User Ownership:** The core principle is that users can only read and write their own data. This is enforced by matching the `request.auth.uid` with the `userId` in the document path.
- **Private Data:** All `time_entries` are private to the user.
- **Public Data:** The `quotes` collection is read-only for any authenticated user.
- **No Admin Roles:** There are no admin-level permissions defined in the client-facing rules. Privileged operations would need to be handled by a secure backend environment (e.g., Cloud Functions).

---

## 5. Detailed Component & Feature Breakdown

### 5.1. Authentication (`AuthPage` & `RegisterPage`)

- **Functionality:** Provides forms for user sign-in and registration.
- **Registration:**
    1.  User enters Name, Email, and Password.
    2.  On submission, a new user is created in Supabase Authentication.
    3.  Simultaneously, a new document is created in the `users` collection in Supabase with the user's ID, name, and email.
- **Sign-in:**
    1.  User enters Email and Password.
    2.  The app uses Supabase Authentication to verify credentials.
    3.  On success, the user is redirected to the main Dashboard.

### 5.2. Dashboard (`page.tsx`)

This is the main view after a user logs in. It's a grid-based layout containing various widgets (Cards).

#### 5.2.1. Time Tracker Card
- **Purpose:** The primary interaction point for the user.
- **Display:** Shows the current time, updating every second.
- **`Check In` Button:**
    - **Action:** Creates a new document in `users/{userId}/time_entries` with `type: 'CHECK_IN'` and a server timestamp.
    - **State Change:** The button is replaced by the "End of Day" and "Break" buttons. A "Checked in at" message appears.
- **`End of Day` Button:**
    - **Action:** Creates a `CHECK_OUT` entry with the reason "End of day".
    - **State Change:** The user is now considered checked out for the day. The "Check In" button is disabled until the next day.
- **`Short Break` / `Lunch Break` Buttons:**
    - **Action:** Creates a `CHECK_OUT` entry with the corresponding reason.
    - **State Change:** The user is now on a break. A break timer appears in the header. The main buttons are replaced by the "Check In" button to allow the user to resume work.

#### 5.2.2. Today's Progress Card
- **Purpose:** Provides a visual summary of the current workday.
- **Logic:** This component is driven by a `useMemo` hook that recalculates whenever the `entries` data changes. It processes all of today's `time_entries` to calculate total work and break durations.
- **Donut Chart:** Visually represents Worked Hours, Break Hours, and Remaining Hours.
- **Metrics:**
    - **Total Hours:** Total time spent working (sum of all "check-in" to "check-out" intervals).
    - **Total Break:** Total time spent on breaks (sum of all "break start" to "break end" intervals).
    - **Leave Time:** Dynamically calculates the estimated time the user can leave to meet their required hours for the day. Shows "Done!" if the goal is met.
    - **Daily Balance:** The difference between `Total Hours` worked and the `Required Hours` for the day. The color changes from red (deficit) to green (surplus).

#### 5.2.3. Logged Entries Table
- **Purpose:** Displays a detailed history of all check-in/out events.
- **Functionality:**
    - **Display:** Shows a paginated list of all time entries, sorted from newest to oldest.
    - **`Edit` Button (Pencil Icon):** Opens a dialog to modify the timestamp and (if applicable) reason of an entry.
    - **`Delete` Button (Trash Icon):** Removes the selected entry from Firestore.
    - **`Export CSV` Button:** Generates and downloads a CSV file of all time entries.
    - **`Print` Button:** Opens the browser's print dialog with a print-friendly view of the table.

#### 5.2.4. Balance Overview Card
- **Purpose:** Gives a quick look at the user's work balance.
- **Daily Balance:** The same value as in the "Today's Progress" card.
- **Monthly Balance:**
    - **Logic:** Calculates the cumulative balance of hours for all past days in the current month. It adds the current day's ongoing balance to this total.
    - **Calculation:** For each past day, it fetches the time entries, calculates the total work hours, and subtracts the required hours for that specific day. Weekends and holidays are correctly excluded from the calculation.

#### 5.2.5. Manual Entry Card
- **Purpose:** Allows users to add entries they may have forgotten to log.
- **Functionality:**
    - A form with a `datetime-local` input, a type selector (Check In/Check Out), and a reason selector (for check-outs).
    - On submission, it creates a new time entry document in Firestore with the manually selected timestamp.

#### 5.2.6. Holidays & Calendar Card
- **Purpose:** To inform users of public holidays and allow them to manage personal leave.
- **Public Holidays:** Displays a static list of French public holidays for 2026.
- **Custom Holidays:**
    - **`+ Add Holiday` Button:** Opens a dialog to add a personal holiday with a name and date.
    - **Storage:** Custom holidays are stored in the browser's `localStorage`. This is a client-side-only feature to ensure stability.
    - **Display:** Shows a list of all custom holidays added by the user.
    - **`Edit`/`Delete` Buttons:** Allow management of personal holidays.
- **Integration:** The main balance calculation logic (`getRequiredHoursForDay`) checks both public and custom holidays. If a day is a holiday, the required work hours are set to `0`, correctly crediting the user's balance.

#### 5.2.7. Other Widgets
- **Prayer Times:** Fetches and displays daily Islamic prayer times for a user-configurable location (defaults to Marrakech) from the Al-Adhan API. The location is saved in `localStorage`.
- **Weather:** Fetches and displays current weather information for Marrakech from the OpenWeatherMap API.
- **Today's Tasks:** A simple client-side to-do list. Tasks are stored in `localStorage`.
- **Productivity Analytics:** Shows a weekly bar chart of hours worked and achievement badges for "Early Start", "Consistency", and "Focus Master".
- **Quote Card:** Displays a random motivational quote (in Arabic) from a local JSON file. These quotes are seeded into a `quotes` collection in Firestore on the first run.

---

## 6. User Scenarios

### Scenario 1: A User Starts Their Day
1.  The user opens the app and logs in.
2.  They are greeted with the Dashboard. The "Check In" button is visible.
3.  The user clicks **"Check In"**.
4.  An entry is created in Firestore. The UI updates to show "Checked in at: HH:mm". The "Check In" button is replaced by the break and "End of Day" buttons.
5.  The "Today's Progress" chart and "Total Hours" begin to update in real-time.

### Scenario 2: A User Takes a Lunch Break
1.  While checked in, the user clicks the **"Lunch Break"** button.
2.  A `CHECK_OUT` entry with the reason "Lunch break" is created.
3.  The UI updates. A break timer appears in the header, counting down from 60 minutes. The "Check In" button reappears.
4.  The "Today's Progress" chart updates, moving time from the "Worked" category to the "Breaks" category.
5.  When the break is over, the user clicks **"Check In"** again to resume their work session.

### Scenario 3: A User Forgets to Check Out
1.  The next day, the user realizes they never checked out. Their balance for the previous day is heavily negative.
2.  They navigate to the **"Manual Entry"** card.
3.  They select the correct date and time for when they finished work.
4.  They select the type **"Check Out"** and the reason **"End of day"**.
5.  They click **"Add Manual Entry"**.
6.  A new entry is added to Firestore. The balance for the previous day is automatically recalculated and corrected.

### Scenario 4: A User Adds a Personal Holiday
1.  The user has a planned day off next week.
2.  They go to the **"Holidays & Calendar"** card and click **"+ Add Holiday"**.
3.  In the dialog, they enter "Personal Day" as the name and select the date.
4.  They click "Save Holiday". The holiday appears in the "Custom holidays" list.
5.  On the day of the holiday, the `getRequiredHoursForDay` function will see this entry and return `0`, ensuring the user's monthly balance is not negatively affected.
