# PediCare Pro: Pediatric Clinic Management EMR

A secure, desktop-optimized, high-contrast Electronic Medical Record (EMR) and patient management system designed specifically for single-doctor Pediatric clinics. Built with **React 19**, **Vite**, **Tailwind CSS v4**, and backed by **Firebase Firestore** for secure, real-time data persistence.

---

## 🚀 Key Features

### 📋 1. Patient Directory & Smart Registration
- **Demographic Intake**: Easily register pediatric patients with fields for first name, surname, parents' names, native place, contact phone, and birth date.
- **Pediatric Age Calculator**: Automatically computes precise clinical age (e.g., "19 Yrs", "3 Mos") based on birth date.
- **Birth Weight Tracking**: Capture birth weight (kg) at registration for infant milestone baselines.
- **Smart Duplicate Prevention**: Features a cross-matching search algorithm that warns staff of potential duplicate records by matching names and parents' details before committing to the database.

### 🩺 2. EMR Patient Encounter File
- **Chronological Timeline**: View the historical clinical trajectory of each pediatric patient in a beautifully styled, high-contrast view.
- **Clinical Active Encounter**:
  - **Anthropometrics & Vitals**: Track key clinical measurements over time (Weight, Height, Head Circumference, Temperature).
  - **Chief Symptoms Checklist**: Fast-select common pediatric presentation factors (Fever, Cough, Vomiting, Colic, Rash, Loose Stools, Constipation, Poor Feeding, Running Nose, Ear Pain, Wheezing, Abdominal Pain, Excessive Crying).
  - **Clinical Notes**: Rich documentation areas for Parental Concerns, Clinical Assessment, and Diagnosis/Treatment plans.
- **Immunization & Vaccinations Log**: Log and track pediatric vaccines, dose counts, and administration timelines.
- **Developmental Milestones**: Maintain active checklists of developmental targets (motor skills, language, cognitive development) matching pediatric guidelines.

### 📢 3. Communication & Campaign Hub
- Broadcast important announcements, custom festive greetings, or immunization reminders to parent contacts directly from the clinic.
- Fully-integrated client-side template engines for smooth clinic-to-parent communication.

### 🛡️ 4. Role-Based Access Controls (RBAC)
- **Doctor Mode**: Access the EMR clinical console, write new encounter logs, log vaccinations, and check developmental milestones.
- **Staff Mode**: View-only for clinical histories, optimized for rapid patient search, demographics retrieval, and registration intake.
- State preferences are persisted locally (`localStorage`) for smooth workflow transitions.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom `@theme` typography and modern dark-mode transition variables.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/) (`motion/react`) for smooth, fluid page transitions and toggle feedbacks.
- **Database**: [Firebase Firestore](https://firebase.google.com/) for fast, secure, cloud-synchronized persistence.

---

## 🔒 Security & Firestore Rules

The application implements enterprise-level privacy safeguards on patient EMR records. The database operations are governed by highly robust `firestore.rules`:
- Restricts critical read/write queries to verified clinic roles.
- Restricts EMR encounter modifications strictly to authorized doctor or validated staff accounts.
- Preconfigured for the primary doctor account (`rensipatidar07@gmail.com`) and supports wildcard `@clinicstaff.com` registrations.

---

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. Clone the repository or export the ZIP from AI Studio.
2. Install the project dependencies:
   ```bash
   npm install
   ```

### Running the App Locally

To start the development server on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To compile the application into static production-ready files:
```bash
npm run build
```
This output is written to the `dist/` folder and is ready for static deployment on platforms like Cloud Run or Firebase Hosting.

### Linting & Quality Checks

Run the TypeScript compiler with `noEmit` to verify code type safety:
```bash
npm run lint
```

---

## 📂 Project Structure

```text
├── assets/                       # Static media and icon files
├── firestore.rules               # Secure Firestore security definitions
├── firebase-blueprint.json       # Blueprint database structure
├── src/
│   ├── App.tsx                   # Core layout router and navigation state
│   ├── main.tsx                  # Vite application entrypoint
│   ├── index.css                 # Global styles & Tailwind imports
│   ├── types.ts                  # Shared EMR models & TS interfaces
│   └── components/               # Modular workspace components
│       ├── DashboardStats.tsx    # Welcome workspace with key indicators
│       ├── SmartSearch.tsx       # Search, cross-matching, & patient registration
│       ├── ChronologicalEMR.tsx  # Chronological clinical timeline & logging
│       └── CommunicationHub.tsx  # Campaign notification broadcast center
└── metadata.json                 # AI Studio application metadata
```
