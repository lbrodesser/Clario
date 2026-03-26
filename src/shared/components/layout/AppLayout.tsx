import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { supabase } from '@/shared/lib/supabase'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/mandanten', label: 'Mandanten', icon: Users },
  { to: '/app/vorlagen', label: 'Vorlagen', icon: FileText },
  { to: '/app/einstellungen', label: 'Einstellungen', icon: Settings },
]

export function AppLayout() {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/app/dashboard" className="text-xl font-bold">
              Clario
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname.startsWith(item.to) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn('gap-2')}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </header>
      {/* Mobile Navigation */}
      <nav className="md:hidden border-b flex overflow-x-auto">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className="flex-1">
            <Button
              variant={location.pathname.startsWith(item.to) ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full gap-1 rounded-none text-xs"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
