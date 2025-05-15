import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutPanelLeft } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Bento Box Generator",
  description: "Create beautiful bento grid layouts",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="min-h-screen bg-[url('/Ambient1.png')] bg-cover bg-center bg-fixed pt-20">
          <div className="flex items-center justify-center gap-4 mb-10">
            <LayoutPanelLeft className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-semibold">Bento Grid Generator</h1>
          </div>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
