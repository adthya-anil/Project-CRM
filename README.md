# Project-CRM

A modern Customer Relationship Management (CRM) system built with React and Supabase, featuring real-time analytics, lead management, and integrated communication tools.

## Features

- 📊 **Interactive Dashboard** - Real-time analytics with various chart types (Bar, Line, Pie, Doughnut)
- 👥 **Lead Management** - Comprehensive lead tracking and interaction history
- 💬 **Integrated Communication**
  - WhatsApp integration
  - Email campaign capabilities
  - Bulk messaging features
- 📅 **Calendar Integration** - Schedule and manage appointments
- 👥 **Team Management** - Role-based access control
- 📈 **Reports** - Detailed analytics and performance metrics
- 📱 **Responsive Design** - Works seamlessly across devices

## Tech Stack

- **Frontend:**
  - React
  - Vite
  - Material-UI (implied by the component structure)
  - Chart.js (for data visualization)

- **Backend:**
  - Supabase (Backend as a Service)
  - Deno (Serverless Functions)

## Project Structure

```
├── src/
│   ├── api/          # API integration layer
│   ├── components/   # Reusable UI components
│   ├── global/       # Global components (Sidebar, Topbar)
│   ├── hooks/        # Custom React hooks
│   ├── loading/      # Loading states and components
│   └── scenes/       # Main application views
│       ├── auth/     # Authentication pages
│       ├── dashboard/# Main dashboard
│       ├── leads/    # Lead management
│       └── ...       # Other feature modules
├── supabase/         # Supabase configuration and functions
│   └── functions/    # Serverless functions
└── public/           # Static assets
```

## Getting Started

1. **Prerequisites**
   - Node.js (latest LTS version)
   - npm or yarn
   - Supabase account

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/adthya-anil/Project-CRM.git

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```

3. **Environment Setup**
   - Create a `.env` file in the root directory
   - Add your Supabase configuration

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Supabase Functions

The project includes several Deno-based Supabase Edge Functions:
- `get-templates` - Email template management
- `receive-kenyt-lead` - Lead ingestion
- `send-bulk-email` - Mass email campaigns
- `send-whatsapp` - WhatsApp messaging integration
- `whatsapp-webhook` - WhatsApp event handling



---


