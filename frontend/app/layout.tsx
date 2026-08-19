import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { GoogleAuthProvider } from "@/components/shared/GoogleAuthProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SprintForge — Modern Agile Project Management & AI Sprint Planning",
  description:
    "SprintForge helps high-performing software teams plan sprints, manage Kanban boards, collaborate in real time, and ship with total confidence — powered by predictive AI insights.",
  keywords: [
    "agile project management",
    "scrum boards",
    "kanban board",
    "sprint planning",
    "ai project insights",
    "linear alternative",
    "jira alternative",
    "developer tools",
    "realtime sprint tracking",
  ],
  authors: [{ name: "SprintForge Engineering" }],
  openGraph: {
    title: "SprintForge — Where Great Teams Build Better Software",
    description:
      "Modern project management for software teams: Scrum, Kanban, real-time collaboration, encrypted team chat, and AI sprint diagnostics.",
    type: "website",
    url: "https://sprintforge.io",
    siteName: "SprintForge",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "SprintForge — Plan • Build • Ship",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SprintForge — Modern Agile Project Management",
    description:
      "Where Great Teams Build Better Software. Plan, collaborate, and ship faster with AI-augmented agility.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/logo-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/logo-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased bg-[#05070d] text-slate-100 min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <GoogleAuthProvider>{children}</GoogleAuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d1322",
                color: "#f8fafc",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                fontSize: "13px",
                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.5)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
