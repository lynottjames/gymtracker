import type { ReactNode } from 'react'
import { GeistMono, GeistSans } from 'geist/font'
import { Nav } from '../components/Nav'
import './globals.css'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <style>{`
          .app-shell {
            background-color: var(--bg);
            min-height: 100vh;
          }
          .app-main {
            margin-left: 0;
            padding: 32px;
            padding-bottom: calc(32px + 64px);
            box-sizing: border-box;
            min-height: 100vh;
          }
          @media (min-width: 768px) {
            .app-main {
              margin-left: 240px;
              padding-bottom: 32px;
            }
          }
        `}</style>
        <div className="app-shell">
          <Nav />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  )
}
