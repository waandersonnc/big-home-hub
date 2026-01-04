import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RoleBasedMenu } from '@/components/RoleBasedMenu';
import { demoStore } from '@/lib/demoStore';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isDemo = demoStore.isActive;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Demo Banner */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-red-50 border-b border-red-100 flex items-center justify-center px-4">
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

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-20' : 'w-64',
        isDemo && 'top-8'
      )}>
        <RoleBasedMenu
          isCollapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'lg:pl-20' : 'lg:pl-64',
        isDemo && 'pt-8'
      )}>
        {/* Mobile header */}
        <header className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 bg-background/95 backdrop-blur-sm px-4 border-b lg:hidden",
          isDemo && "top-8"
        )}>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground italic tracking-tighter">BigHome</span>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </header>

        {/* Page content */}
        <main className={cn(
          "min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex flex-col",
          isDemo && "lg:min-h-[calc(100vh-2rem)]"
        )}>
          <div className="flex-1 p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

