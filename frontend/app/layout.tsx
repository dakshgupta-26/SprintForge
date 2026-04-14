import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SprintForge — Where Agile Teams Build Faster, Smarter, Better",
  description:
    "SprintForge is a modern Agile Project Management Platform for software development teams. Scrum, Kanban, burndown charts, real-time collaboration, and AI-powered insights.",
  keywords: ["agile", "scrum", "kanban", "project management", "sprint", "jira alternative"],
  authors: [{ name: "SprintForge" }],
  openGraph: {
    title: "SprintForge",
    description: "Where Agile Teams Build Faster, Smarter, Better",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--toast-bg)",
                color: "var(--toast-fg)",
                border: "1px solid var(--toast-border)",
                borderRadius: "12px",
                fontSize: "14px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
