
import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Impostor Games - Bryan',
  description: 'Un juego de detectives',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png?v=4', // Agregamos ?v=4
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png?v=4',  // Agregamos ?v=4
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png?v=4',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
