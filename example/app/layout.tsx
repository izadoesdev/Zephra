import type React from 'react';

/**
 * Root layout component that wraps all pages
 */ 
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Zephra - Modern Web Framework</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            color: #1f2937;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 2rem;
            background-color: #ffffff;
          }
          
          .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: #3b82f6;
          }
          
          nav a {
            margin-left: 1rem;
            color: #4b5563;
            text-decoration: none;
          }
          
          nav a:hover {
            color: #3b82f6;
          }
          
          main {
            padding: 2rem;
          }
          
          footer {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem 2rem;
            text-align: center;
            color: #6b7280;
            font-size: 0.875rem;
          }
        `}</style>
      </head>
      <body>
        <header>
          <div className="logo">Zephra</div>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/api/hello">API</a>
          </nav>
        </header>
        <main className="container">
          test
          {children}
        </main>
        <footer>
          &copy; {new Date().getFullYear()} Zephra Framework - Modern, Fast, Minimalist
        </footer>
      </body>
    </html>
  );
} 