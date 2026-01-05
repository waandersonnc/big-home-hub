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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 relative">
      {/* Subtle Background Glow - Apple Style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
      </div>



      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden transition-smooth"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-20' : 'w-64'
      )}>
        <RoleBasedMenu
          isCollapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'lg:pl-20' : 'lg:pl-64'
      )}>
        {/* Mobile header */}
        <header className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 glass-light px-4 border-b border-white/10 lg:hidden"
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
          "min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex flex-col"
        )}>
          <div className="flex-1 p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

