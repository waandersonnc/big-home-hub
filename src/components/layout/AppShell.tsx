import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Home,
  ArrowRightLeft,
  DollarSign,
  Menu,
  X,
  Bell,
  ChevronLeft,
  LogOut,
  MoreHorizontal,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Equipe', href: '/equipe', icon: Users },
  { name: 'Anúncios', href: '/anuncios', icon: Megaphone },
  { name: 'Imóveis', href: '/imoveis', icon: Home },
  { name: 'Movimentação', href: '/movimentacao', icon: ArrowRightLeft },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Agentes', href: '/agentes', icon: Bot },
];

const mobileNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Equipe', href: '/equipe', icon: Users },
  { name: 'Imóveis', href: '/imoveis', icon: Home },
  { name: 'Mais', href: '#more', icon: MoreHorizontal },
];

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();
  const isDemo = localStorage.getItem('is_demo') === 'true';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Demo Banner */}
      {isDemo && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-8 bg-red-50 border-b border-red-100 flex items-center justify-center px-4"
        >
          <p className="text-red-700 text-[10px] sm:text-xs font-bold tracking-widest text-center uppercase">
            MODO DEMONSTRATIVO
          </p>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isDemo && 'top-8'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
              <img src="/logo.png" alt="BigHome Logo" className="h-full w-full object-cover" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg text-sidebar-foreground">BigHome</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse button (desktop) */}
        <div className="hidden lg:block p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span className="ml-2">Recolher</span>}
          </Button>
        </div>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sm flex-shrink-0">
              JS
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">João Silva</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Gerente</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-16' : 'lg:pl-64', isDemo && 'pt-8')}>
        {/* Mobile header */}
        <header className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 bg-background/95 backdrop-blur-sm px-4 border-b lg:hidden",
          isDemo && "top-8"
        )}>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
              <img src="/logo.png" alt="BigHome Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-semibold text-foreground">BigHome</span>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </header>

        {/* Page content */}
        <main className={cn(
          "min-h-[calc(100vh-3.5rem)] lg:min-h-screen pb-20 lg:pb-0",
          isDemo && "lg:min-h-[calc(100vh-2rem)]"
        )}>
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t lg:hidden">
          <div className="flex items-center justify-around py-2">
            {mobileNav.map((item) => {
              if (item.href === '#more') {
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs">{item.name}</span>
                    </button>
                    {moreMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMoreMenuOpen(false)}
                        />
                        <div className="absolute bottom-full right-0 mb-2 z-50 bg-card rounded-lg shadow-elevated border p-2 min-w-40">
                          <NavLink
                            to="/movimentacao"
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                              location.pathname === '/movimentacao'
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            Movimentação
                          </NavLink>
                          <NavLink
                            to="/anuncios"
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                              location.pathname === '/anuncios'
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <Megaphone className="h-4 w-4" />
                            Anúncios
                          </NavLink>
                          <NavLink
                            to="/financeiro"
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                              location.pathname === '/financeiro'
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <DollarSign className="h-4 w-4" />
                            Financeiro
                          </NavLink>
                          <NavLink
                            to="/agentes"
                            onClick={() => setMoreMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                              location.pathname === '/agentes'
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <Bot className="h-4 w-4" />
                            Agentes
                          </NavLink>
                        </div>
                      </>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-1 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
