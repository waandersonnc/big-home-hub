import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Building2,
    Target,
    DollarSign,
    Bot,
    Megaphone,
    BarChart3,
    Building,
    Kanban,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { cn } from "@/lib/utils";
import { demoStore } from "@/lib/demoStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RoleBasedMenuProps {
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export function RoleBasedMenu({ isCollapsed = false, toggleCollapse }: RoleBasedMenuProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isOwner, isManager, isBroker, signOut } = useAuthContext();
    const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany } = useCompany();

    const handleLogout = async () => {
        localStorage.removeItem('is_demo');
        demoStore.deactivate();
        await signOut();
        navigate('/login');
    };

    // selectedCompany now comes from context directly

    const menuItems = [
        {
            name: 'Visão Geral',
            path: '/visao-geral',
            icon: BarChart3,
            visible: isOwner && companies.length > 1
        },
        { name: 'Painel', path: '/painel', icon: LayoutDashboard, visible: true },
        { name: 'Equipe', path: '/equipe', icon: Users, visible: !isBroker },
        { name: 'Imóveis', path: '/imoveis', icon: Building2, visible: isOwner },
        { name: 'Disponíveis', path: '/disponiveis', icon: Target, visible: true },
        { name: 'Movimentação', path: '/movimentacao', icon: Kanban, visible: true },
        { name: 'Financeiro', path: '/financeiro', icon: DollarSign, visible: isOwner || isManager },
        { name: 'Agentes', path: '/agentes', icon: Bot, visible: isOwner },
        { name: 'Anúncios', path: '/anuncios', icon: Megaphone, visible: isOwner },
    ];

    const activePath = location.pathname;

    return (
        <div className="flex flex-col h-full bg-sidebar-background border-r transition-all duration-300">
            {/* Company Selector */}
            <div className={cn("p-4 border-b flex items-center", isCollapsed ? "justify-center p-2" : "justify-between")}>
                {!isCollapsed ? (
                    companies.length > 1 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between gap-2 h-auto py-2 px-3 border hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 overflow-hidden text-left">
                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                            {selectedCompany?.logo_url ? (
                                                <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Building size={16} className="text-primary" />
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-xs text-muted-foreground uppercase font-semibold">Imobiliária</span>
                                            <span className="truncate text-sm font-bold">{selectedCompany?.name}</span>
                                        </div>
                                    </div>
                                    <Users size={14} className="text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Minhas Unidades</div>
                                <DropdownMenuSeparator />
                                {companies.map((company) => (
                                    <DropdownMenuItem
                                        key={company.id}
                                        onClick={() => setSelectedCompanyId(company.id)}
                                        className={selectedCompanyId === company.id ? "bg-primary/5 text-primary font-medium" : ""}
                                    >
                                        <Building size={14} className="mr-2" />
                                        {company.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg w-full">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {selectedCompany?.logo_url ? (
                                    <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Building size={16} className="text-primary" />
                                )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Unidade</span>
                                <span className="truncate text-sm font-bold">{selectedCompany?.name || 'Carregando...'}</span>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building size={20} />
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {menuItems.filter(item => item.visible).map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                            activePath === item.path
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            isCollapsed && "justify-center px-0 py-2.5"
                        )}
                        title={isCollapsed ? item.name : undefined}
                    >
                        <item.icon size={20} className={activePath === item.path ? "" : "group-hover:scale-110 transition-transform"} />
                        {!isCollapsed && <span>{item.name}</span>}
                    </button>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t bg-muted/10">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                    {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold truncate">{user?.full_name || 'Usuário'}</span>
                                <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors text-left">
                                    <LogOut size={10} />
                                    Sair
                                </button>
                            </div>
                        </div>
                        {toggleCollapse && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleCollapse}>
                                <ChevronLeft size={16} />
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                {(user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {toggleCollapse && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleCollapse}>
                                <ChevronRight size={16} />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
