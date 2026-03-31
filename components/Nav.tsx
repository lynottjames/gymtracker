'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusSquare, ScrollText } from 'lucide-react'
import styles from './Nav.module.css'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log', label: 'Log Workout', icon: PlusSquare },
  { href: '/history', label: 'History', icon: ScrollText },
]

function pathActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

function formatToday(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      <aside className={styles.sidebar} aria-label="Main navigation">
        <Link href="/dashboard" className={styles.brand}>
          GRIND
        </Link>
        <div className={styles.links}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathActive(pathname, item.href)
            const className = [
              styles.link,
              active ? styles.linkActive : styles.linkInactive,
            ].join(' ')
            return (
              <Link key={item.href} href={item.href} className={className}>
                <Icon size={20} aria-hidden strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <footer className={styles.sidebarFooter}>{formatToday()}</footer>
      </aside>

      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathActive(pathname, item.href)
          const className = [styles.bottomLink, active ? styles.bottomLinkActive : '']
            .filter(Boolean)
            .join(' ')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
              aria-label={item.label}
            >
              <Icon size={24} aria-hidden strokeWidth={1.75} />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
