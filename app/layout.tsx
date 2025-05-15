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
      <main className="relative min-h-screen bg-[url('/LINES.jpg')] bg-cover bg-center bg-fixed pt-20">
        
        {/* Full screen overlay */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>

        {/* Content on top of overlay */}
        <div className="relative z-10 flex items-center justify-center gap-4 mb-10">
          <LayoutPanelLeft className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-semibold text-white">Bento Grid Generator</h1>
        </div>

        <div className="relative z-10">
          {children}
        </div>
        
      </main>
    </ThemeProvider>
  </body>
</html>
  )
}
