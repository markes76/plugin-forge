import { HashRouter, Routes, Route } from 'react-router-dom'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { Builder } from '@/pages/Builder'
import { Wizard } from '@/pages/Wizard'
import { Templates } from '@/pages/Templates'
import { MyPlugins } from '@/pages/MyPlugins'
import { Settings } from '@/pages/Settings'
import { useAppStore } from '@/stores/app-store'

export function App() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <HashRouter>
      <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
          <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wizard" element={<Wizard />} />
              <Route path="/wizard/:id" element={<Wizard />} />
              <Route path="/builder" element={<Builder />} />
              <Route path="/builder/:id" element={<Builder />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/my-plugins" element={<MyPlugins />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  )
}
