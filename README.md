# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/501c971a-329c-4af4-9e27-4b3f6ddace73

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/501c971a-329c-4af4-9e27-4b3f6ddace73) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/501c971a-329c-4af4-9e27-4b3f6ddace73) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# AquaReservas - Snorkel Tour Reservation System

A modern, real-time reservation management system for snorkel tour operators with an ocean-inspired design and comprehensive analytics dashboard.

## 🌊 Project Overview

AquaReservas is a web-based reservation management system designed specifically for snorkel and marine tour operators. The system provides real-time booking tracking, operator management, and sales capabilities with a beautiful ocean-themed interface.

## ✨ Features

### 🔐 Authentication System
- **Dual User Roles**: Admin and Seller access levels
- **Role-based Interface**: Different dashboards for different user types
- **Secure Login**: Email/password authentication with user type selection

### 📊 Admin Dashboard
- **Real-time Analytics**: Live booking updates and customer distribution
- **Interactive Charts**: Pie charts and bar graphs using Recharts
- **Booking Visualization**: Real-time reservation feed with animations
- **Tour Operator Management**: Complete CRUD operations for operators
- **Capacity Tracking**: Monitor boat capacity and utilization rates
- **Schedule Overview**: View upcoming departures and time slots

### 💼 Sales Interface
- **Quick Reservations**: Streamlined booking creation process
- **Smart Recommendations**: System suggests optimal tour operators
- **Capacity Monitoring**: Real-time availability checking
- **Load Balancing**: Automatic distribution suggestions based on current bookings

### 🚢 Tour Operator Management
- **Complete Profiles**: Operator information, contact details, and specialties
- **Fleet Management**: Boat inventory with capacity and status tracking
- **Schedule Management**: Operating hours and departure times
- **Performance Metrics**: Booking statistics and capacity utilization

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **Custom Design System** - Ocean-themed color palette and gradients
- **Responsive Design** - Mobile-first approach with adaptive layouts

### Data Visualization
- **Recharts** - Composable charting library for React
- **Interactive Charts** - Pie charts, bar graphs, and progress indicators
- **Real-time Updates** - Live data visualization with smooth animations

### Routing & Navigation
- **React Router DOM** - Client-side routing and navigation
- **Protected Routes** - Role-based access control

### Development Tools
- **ESLint** - Code linting and quality assurance
- **TypeScript** - Static type checking
- **Vite** - Hot module replacement and fast builds

## 🎨 Design System

### Color Palette
```css
/* Primary Ocean Blues */
--primary: 200 85% 35%        /* Deep ocean blue */
--primary-glow: 200 85% 45%   /* Glowing ocean blue */

/* Coral Accents */
--secondary: 15 75% 65%       /* Warm coral */

/* Aqua Tones */
--accent: 180 60% 88%         /* Soft aqua */
--muted: 180 25% 95%          /* Light aqua mist */
