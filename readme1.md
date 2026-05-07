# Project Installation Guide

## 1. System Requirements

Before installing the project, make sure your machine has the following tools installed:

- **Node.js** version 18 or higher
- **npm** included with Node.js
- **Git** for cloning the source code

You can quickly check the installed versions with:

```bash
node -v
npm -v
git --version
```

## 2. Download the Source Code

Clone the project to your local machine with:

```bash
git clone <repository-url>
cd SMC-admin-staff-page
```

If you are already working inside a folder that contains the source code, just move into the project directory:

```bash
cd SMC-admin-staff-page
```

## 3. Install Dependencies

Install all required packages with npm:

```bash
npm install
```

This command installs libraries such as React, Vite, React Router, Axios, Recharts, Leaflet, and other supporting packages.

## 4. Environment Configuration

Check the API configuration file in the project, which is usually where the Axios base URL is defined.

If your backend runs at a different address, update the URL to match your environment:

- local development
- staging
- production

Also, the application stores the JWT token in `localStorage` with the key `token`, so make sure the login flow works correctly before accessing protected pages.

## 5. Run the Project in Development Mode

Start the application with:

```bash
npm run dev
```

After the app starts, Vite will show the local access address, usually:

```bash
http://localhost:5173
```

## 6. Build the Project

When you want to create a production build, run:

```bash
npm run build
```

You can then preview the build with:

```bash
npm run preview
```

## 7. Check for Code Issues

Run lint to check for syntax and style issues:

```bash
npm run lint
```

## 8. Important Notes

- If the backend is not running, some pages may fail to load data.
- Make sure the login token is still valid when accessing pages that require authorization.
- If you switch environments, verify the API configuration before running the app.

## 9. Quick Summary

```bash
git clone <repository-url>
cd SMC-admin-staff-page
npm install
npm run dev
```