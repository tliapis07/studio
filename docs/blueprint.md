# **App Name**: SalesStream CRM

## Core Features:

- User Authentication: Secure user login and registration leveraging Firebase Authentication, with support for Google Sign-In.
- Lead Management & Kanban: Comprehensive tools to view, add, edit, and delete leads. Includes an interactive Kanban board for visualizing lead pipeline stages with drag-and-drop functionality, and filterable list views. Implemented using Firestore for data storage.
- AI Sales Assistant Tool: An integrated AI assistant powered by Local Llama 3.1, providing insightful suggestions, summarizing notes, and recommending next actions for individual leads. Employs systematic prompt processing for thorough reasoning.
- Activity Tracking: Record and display all interactions with a lead, including call logs, notes, and status changes, presented in an activity timeline. Stored in Firestore.
- Dashboard Overview: A personalized dashboard presenting a concise summary of key CRM metrics, lead statuses, and upcoming follow-ups.
- CSV Lead Import/Export: Enable bulk import of new lead data from CSV files and export of existing lead information into CSV format.
- Sales Analytics: Basic analytical dashboards providing visual insights into lead performance and pipeline progression using interactive charts powered by Recharts.

## Style Guidelines:

- Color Theme: Dark Mode dominant, conveying professionalism and reduced eye strain.
- Primary Color: A sophisticated deep violet-blue (#5740EB), representing reliability and modern technology. Used for key interactive elements and branding.
- Background Color: A subtle, very dark grey-blue (#1A1B20), providing depth and allowing primary and accent colors to stand out. Based on a heavily desaturated version of the primary hue.
- Accent Color: A vibrant sky blue (#7CD2F6), used to draw attention to critical information, notifications, and interactive states. Creates effective contrast against the dark background.
- All text will use 'Inter', a grotesque-style sans-serif font known for its excellent readability and modern, objective aesthetic across various text densities.
- Utilize 'lucide-react' icons for a consistent, crisp, and modern visual language, ensuring clear communication of actions and data states.
- Employ a modular and responsive layout with a persistent sidebar navigation. Content areas will leverage card-based structures and multi-column designs, especially for Kanban boards and detailed lead views, optimizing for data organization and readability.
- Incorporate subtle, functional animations for UI transitions, drag-and-drop interactions in the Kanban board, and toast notifications. These animations will provide visual feedback without distracting the user.