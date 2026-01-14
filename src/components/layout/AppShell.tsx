import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RoleBasedMenu } from '@/components/RoleBasedMenu';
import { demoStore } from '@/lib/demoStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuthContext();
  const { isLoading: companyLoading } = useCompany();
  const isDemo = demoStore.isActive;

  // if (authLoading || companyLoading) {
  //   return <LoadingScreen message="Preparando seu ambiente..." />;
  // }

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative mr-2">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Avatar
              className="h-8 w-8 border cursor-pointer ring-offset-2 hover:ring-2 ring-primary transition-all"
              onClick={() => navigate('/settings')}
            >
              {user?.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className={cn(
          "min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex flex-col"
        )}>
          <div className="flex-1 p-4 md:p-8">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-900 ease-in-out">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

