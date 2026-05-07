
## Tech Stack

### Core Frameworks and Libraries

- **React 19** - UI library for building component-based interfaces.
- **React DOM** - DOM rendering for React applications.
- **Vite** - Fast build tool and development server.
- **React Router DOM** - Client-side routing for admin and staff pages.
- **Axios** - HTTP client used for calling backend APIs.
- **jwt-decode** - Decodes JWT tokens stored in local storage.
- **react-icons** - Icon library used throughout the dashboard.
- **react-toastify** - Toast notification system for success and error feedback.
- **Recharts** - Charting library used for analytics and statistics dashboards.
- **Leaflet** - Interactive map library for heatmap and map-based features.
- **React Leaflet** - React bindings for Leaflet maps.

### Development Tools

- **ESLint** - Linting and code quality checks.
- **@vitejs/plugin-react** - Vite plugin for React support.
- **Type definitions for React** - Provided by `@types/react` and `@types/react-dom`.

### Axios Configuration

The Axios setup is responsible for:

- Setting the backend base URL.
- Attaching authentication tokens to requests.
- Standardizing request/response handling.
- Reusing a single HTTP client across pages.

### Authentication

The application stores a JWT token in `localStorage` under the key `token`.
This token is decoded with `jwt-decode` to extract user identity and role claims for authorization checks.

### API Usage Pattern

Common request patterns used in the app include:

- `GET` for fetching dashboard data, lists, and details.
- `POST` for creating new records.
- `PUT` for approving, updating, or toggling entity state.
- `DELETE` for removing records.

### External UI/Data Services

- **Leaflet / React Leaflet** are used for map and heatmap visualizations.
- **Recharts** is used for revenue and analytics charts.
- **react-toastify** is used for user feedback notifications after API actions.

## Environment and Setup Notes

If the backend base URL is configured in `AxiosSetup.js`, update it there when moving between environments such as:

- local development
- staging
- production

If the API requires authentication, make sure the login flow stores a valid JWT token in `localStorage` before accessing protected routes.

