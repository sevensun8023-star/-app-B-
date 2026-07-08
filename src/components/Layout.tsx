import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/chapters', label: '章节', icon: '📚' },
  { path: '/exams', label: '模拟', icon: '📝' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="app-layout">
      <main className="app-main">{children}</main>
      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const active =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path)
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  backTo,
}: {
  title: string
  subtitle?: string
  backTo?: string
}) {
  return (
    <header className="page-header">
      {backTo && (
        <Link to={backTo} className="back-btn">
          ←
        </Link>
      )}
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
    </header>
  )
}
