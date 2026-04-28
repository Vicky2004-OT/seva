# SevaSync - Humanitarian Field Data Collection Platform

A comprehensive humanitarian field data collection and analysis platform that enables organizations to collect data, generate AI-powered insights, and manage field operations efficiently.

## Core Features

- **Survey Management** - Create, manage, and collect field survey data
- **AI Analytics** - Natural language queries and automated insights using OpenRouter.ai
- **Offline Sync** - Data collection without internet, sync when online
- **User Management** - Admin, Analyst, NGO, and Field Worker roles
- **Real-time Analytics** - Dashboard with comprehensive statistics

## Architecture

- **Frontend**: React 19.2.5 + Vite + TailwindCSS (deployed on Vercel)
- **Backend**: Node.js + Express + Firebase Firestore (deployed on Render)
- **AI Integration**: OpenRouter.ai for data analysis and insights
- **Authentication**: JWT with role-based access control

## Project Structure

```
Seva/
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js + Express backend API
├── shared/            # Shared types and utilities
└── docs/             # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project setup
- OpenRouter.ai API key

### Installation

1. Clone the repository
2. Set up Firebase project and configure credentials
3. Install dependencies in both frontend and backend
4. Configure environment variables
5. Start development servers

## Deployment

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render

## Target Users

- Humanitarian organizations and NGOs
- Field workers and volunteers
- Data analysts and program managers
- Disaster response teams
