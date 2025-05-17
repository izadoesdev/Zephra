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
      </head>
      <body>
        <header>
          <div className="logo">Zephra</div>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/api/hello">API</a>
            test
          </nav>
        </header>
        <main className="container">
          {children}
        </main>
        <footer>
          &copy; {new Date().getFullYear()} Zephra Framework - Modern, Fast, Minimalist
        </footer>
      </body>
    </html>
  );
} 