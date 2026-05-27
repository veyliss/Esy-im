import "./globals.css";

export const metadata = {
  title: "即时通讯系统",
  description: "现代化的即时通讯系统，提供安全、高效的沟通体验",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="stylesheet" href="/auth.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block" rel="stylesheet" />
      </head>
      <body className="font-display bg-background-light dark:bg-background-dark" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
