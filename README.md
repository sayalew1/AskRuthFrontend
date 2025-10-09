# Ask Ruth Frontend

A React application built with TypeScript and Vite that replicates the Ask Ruth campaign management interface.

## Features

- **Header**: Logo and search/input functionality
- **Left Sidebar**: Navigation categories and campaign cards
- **Main Content**: Campaign details with tabs, social media options, and action buttons
- **Right Sidebar**: Image gallery and additional content

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd askRuthFrontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── Header.tsx/css
│   ├── Sidebar.tsx/css
│   ├── MainContent.tsx/css
│   └── RightSidebar.tsx/css
├── App.tsx/css
├── main.tsx
└── index.css
```

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS3 with Flexbox/Grid
- ESLint for code quality

## Design Features

- Responsive layout that adapts to different screen sizes
- Modern UI with rounded corners and subtle shadows
- Color scheme matching the original design
- Interactive elements with hover states
- Clean typography and spacing
