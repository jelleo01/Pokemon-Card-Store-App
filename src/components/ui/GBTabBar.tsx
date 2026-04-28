import { useNavigate } from 'react-router-dom'

type Tab = 'home' | 'map' | 'community'

interface GBTabBarProps {
  active: Tab
}

const tabs: { id: Tab; label: string; icon: string; path: string }[] = [
  { id: 'home', label: 'HOME', icon: '🏠', path: '/' },
  { id: 'map', label: 'MAP', icon: '🗺', path: '/map' },
  { id: 'community', label: 'COMMUNITY', icon: '📣', path: '/community' },
]

export default function GBTabBar({ active }: GBTabBarProps) {
  const navigate = useNavigate()

  return (
    <nav className="flex border-t-2 border-ink bg-paper font-galmuri">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`flex-1 flex flex-col items-center py-2.5 text-xs font-bold transition-colors ${
            active === tab.id ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2'
          }`}
        >
          <span className="text-base">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
