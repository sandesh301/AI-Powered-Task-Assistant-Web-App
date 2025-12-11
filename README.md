# AI-Powered Task Assistant Web App

A browser-only planner that turns messy tasks or project descriptions into a clear, structured plan. Everything runs locally with simple HTML, CSS, and JavaScript—no backend or API required.

## Features
- **Offline AI-style planner:** Generates a summary, prioritized steps, time blocks, and recommendations based on your description.
- **Planning modes:** Daily plan, project breakdown, and study plan.
- **Save & load:** Store plans in `localStorage`, load them from the sidebar, delete individual items, or clear all.
- **Responsive layout:** Sidebar + main content view that adapts to smaller screens.

## Getting Started
1. **Download or clone** this repository locally.
2. **Open the app:**
   - Easiest: double-click `index.html` (or right-click → open with your browser).
   - Alternative: start a simple server from the project folder (for example, `python -m http.server 8000`) and visit `http://localhost:8000`.
3. Enter your tasks or project description, pick a planning mode, and click **Generate Plan**.
4. Save plans to the sidebar to revisit or clear them later—everything is stored locally via `localStorage`.
