import './globals.css';
import type React from 'react';
/**
 * Root layout component that wraps all pages
 */ 
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" style={{ fontFamily: 'Inter, sans-serif' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Zephra - Modern Web Framework</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-[#09090b] via-[#18181b] to-[#23272f] text-gray-100 min-h-screen flex flex-col">
        <header className="backdrop-blur-md bg-white/10 border-b border-white/10 shadow-lg p-6 flex items-center justify-between sticky top-0 z-30 rounded-b-xl">
          <div className="logo font-black text-2xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight drop-shadow-lg">Zephra</div>
          <nav className="space-x-6 flex items-center">
            <a className="transition text-gray-200 hover:text-blue-400 font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" href="/">Home</a>
            <a className="transition text-gray-200 hover:text-purple-400 font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" href="/about">About</a>
            <a className="transition text-gray-200 hover:text-pink-400 font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-pink-400" href="/api/hello">API</a>
          </nav>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          {children}
        </main>
        <footer className="backdrop-blur-md bg-white/10 border-t border-white/10 shadow-lg p-4 text-center text-xs text-gray-400 rounded-t-xl">
          &copy; {new Date().getFullYear()} Zephra Framework &ndash; Modern, Fast, Minimalist
        </footer>
      </body>
    </html>
  );
} 