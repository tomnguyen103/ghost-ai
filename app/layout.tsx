import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/ui/themes"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Development Plan Tools",
  description: "AI-powered system design tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorBackground: "var(--bg-surface)",
          colorInput: "var(--bg-elevated)",
          colorForeground: "var(--text-primary)",
          colorMutedForeground: "var(--text-secondary)",
          colorNeutral: "var(--text-primary)",
          colorPrimary: "var(--accent-primary)",
          colorDanger: "var(--state-error)",
          colorSuccess: "var(--state-success)",
          fontFamily: "'Geist', sans-serif",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  )
}
