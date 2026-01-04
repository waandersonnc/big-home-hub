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
    Kanban
} from "lucide-react";
import { useRole } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function RoleBasedMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useRole();
    const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    const menuItems = [
        {
            name: 'All Dash',
            path: '/all-dash',
            icon: BarChart3,
            visible: role === 'owner' && companies.length > 1
        },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
        { name: 'Equipe', path: '/equipe', icon: Users, visible: role !== 'broker' },
        { name: 'Imóveis', path: '/imoveis', icon: Building2, visible: role === 'owner' },
        { name: 'Leads', path: '/leads', icon: Target, visible: true },
        { name: 'Movimentação', path: '/movimentacao', icon: Kanban, visible: true },
        { name: 'Financeiro', path: '/financeiro', icon: DollarSign, visible: true },
        { name: 'Agentes', path: '/agentes', icon: Bot, visible: role === 'owner' },
        { name: 'Anúncios', path: '/anuncios', icon: Megaphone, visible: role === 'owner' },
    ];

    const activePath = location.pathname;

    return (
        <div className="flex flex-col h-full bg-sidebar-background border-r">
            {/* Company Selector */}
            <div className="p-4 border-b">
                {companies.length > 1 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between gap-2 h-auto py-2 px-3 border hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2 overflow-hidden text-left">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building size={16} className="text-primary" />
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
                    <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Building size={16} className="text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Unidade</span>
                            <span className="truncate text-sm font-bold">{selectedCompany?.name || 'Carregando...'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <div className="flex-1 py-4 px-3 space-y-1">
                {menuItems.filter(item => item.visible).map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${activePath === item.path
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                    >
                        <item.icon size={20} className={activePath === item.path ? "" : "group-hover:scale-110 transition-transform"} />
                        {item.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
