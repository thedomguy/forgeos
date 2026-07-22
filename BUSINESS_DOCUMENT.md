# Forge OS — Business Overview

## Executive Summary

Forge OS is a modular wellness operating system prototype built as a responsive single-page web application using React and Vite. The current product focuses on a fully designed Health module, including nutrition logging, workout management, body metrics, timeline activity, and an AI-style assistant for cross-module insights.

This document summarizes the complete application prepared so far, including the user value proposition, core features, product architecture, usage flows, technical stack, and future expansion potential.

## Product Vision

Forge is designed as a personal productivity and wellbeing system where individual modules integrate into a single OS-like experience. The current health-first release demonstrates how modules can work together through a shared timeline, navigation shell, rapid actions, and a central assistant.

The product aims to deliver:
- unified, visually polished wellness tracking
- quick everyday actions for food, weight, workouts, and movement
- AI-backed context across multiple data sources
- modular expansion into finance, learning, projects, and more

## Current Application Scope

**Implemented module:** Health

**Available screens:**
- Home
- Modules
- Timeline
- Profile
- Health Dashboard
- Nutrition
- Workouts
- Body Metrics
- History
- Live Workout Session
- Forge Assistant

**Quick actions:**
- Log Food
- Start Workout
- Track Walk
- Log Weight

## Key Capabilities

### Health Dashboard
- Displays calorie progress, macro summary, water intake, steps, and active burn.
- Includes a training CTA and a daily Today summary.
- Provides AI-style insight cards with health recommendations.

### Nutrition
- Shows daily food intake and macro goals.
- Lists meals with expandable meal details and calorie breakdown.
- Supports Add Food action with photo, voice, and manual logging workflows.

### Workouts
- Quick start workout recommendation.
- Workout templates list for push/pull/legs/upper/lower.
- Live workout session page with timer, set tracking, pause/resume, finish flow, and real-time workout banner.
- Workout persistence between navigation frames using local storage.

### Body Metrics
- Displays current weight and body data.
- Supports weight logging through a modal sheet.

### Timeline
- Shows a cross-module activity stream.
- Includes filtering by module categories.

### Forge Assistant
- Simulated multi-module assistant UI with chat and suggested prompts.
- Shows rich answer cards, charts, summaries, and source attribution.
- Integrates AI-style cross-module retrieval messaging.

### Navigation & Shell
- Bottom tab navigation across core screens.
- Spotlight command palette for fast navigation and actions.
- Modular shell with theme customization and persistent toast notifications.

## User Experience

The product is designed as a mobile-first experience with:
- full-screen panels and sticky headers
- floating bottom navigation and sheets
- context-aware command palette
- lightweight animations and polished UI elements
- theme customization for dark mode and accent color

Users can quickly move between a high-level home summary, detailed health modules, real-time workout sessions, and an AI assistant.

## Technical Architecture

### Stack
- React 18
- Vite 6
- JavaScript ES modules
- Custom component layer for UI primitives

### Data and State
- Mocked domain data in `src/data.js`
- Local storage persistence for theme preferences and active workout state
- Component-level state using `useState`, `useEffect`, and `useRef`
- Navigation stack implemented as a view stack in `src/App.jsx`

### Component Structure

- `src/App.jsx` — root application shell, routing, state management, navigation API, and live workout persistence
- `src/assistant.jsx` — assistant screen and response rendering
- `src/health.jsx` — health module screens and dashboards
- `src/workout.jsx` — workout flows, live session timer, and workout templates
- `src/nav.jsx` — bottom navigation and spotlight command palette
- `src/screens.jsx` — OS root screens like Home, Modules, Timeline, Profile
- `src/sheets.jsx` — modal sheet interactions for logging food and weight
- `src/theme.jsx` — theme tokens, app shell, and design system constants

## Differentiators

- Modular OS-inspired interface rather than a single-purpose health app
- AI assistant layer built into the navigation experience
- Polished workout session flow with set-level tracking and live persistence
- Data-driven design tokens and reusable UI primitives

## Business Opportunities

### Product-market fit
- Wellness enthusiasts who want a single hub for health, training, and metrics
- Users who value modular expansion across finance, learning, and productivity
- Early adopters of AI-enhanced personal tracking

### Potential monetization
- Premium subscriptions for advanced analytics and personalized insights
- In-app modules sold individually or as bundles
- Partnerships with fitness programs, nutrition plans, and coach integrations

### Expansion roadmap
- Build out Finance, Learning, Projects, Tasks, Documents, Travel, Home, and Relationships modules
- Add actual AI integration instead of canned assistant responses
- Add backend storage, authentication, and cross-device sync
- Introduce automated metrics, wearable integration, and GPS activity tracking
- Enable custom workout templates, nutrition search, and goals automation

## Current Limitations and Next Steps

### Known prototype boundaries
- Data is mock/simulated and not connected to a backend.
- Assistant responses are canned rather than generated by a real AI service.
- Only the Health module is installed and active; other modules are placeholders.
- No authentication, server, or cloud sync support.

### Recommended next steps
1. Validate the health module experience with target users.
2. Add a backend API and persistent user profiles.
3. Replace canned assistant answers with an LLM or retrieval-augmented system.
4. Build out the next module vertical, such as Finance or Tasks.
5. Add analytic tracking to measure engagement across daily actions.

## Conclusion

Forge OS is a strong prototype for a modular wellbeing operating system. The current build demonstrates the core navigation, health dashboard, workout session flow, nutrition logging, timeline, and assistant experience. It is well positioned to evolve into a broader personal OS with backend sync, real AI, and additional modules.
