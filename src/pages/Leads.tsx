import { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, Calendar, MoreVertical, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { leads as initialLeads, teamMembers as initialMembers } from '@/data/mockData';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { dashboardService } from '@/services/dashboard.service';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP: Record<string, string> = {
    'desconhecido': 'Desconhecido',
    'novo': 'Novo',
    'em atendimento': 'Em Atendimento',
    'removido': 'Removido',
    'atribuído': 'Atribuído',
    'em espera': 'Em Espera',
    'documentação': 'Documentação',
    'comprou': 'Comprou'
};

export default function Leads() {
    const isDemo = demoStore.isActive;
    const { selectedCompanyId } = useCompany();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProduct, setFilterProduct] = useState<string | null>(null);
    const [filterOrigin, setFilterOrigin] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState<Date | null>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Force update state to trigger re-render
    const [, setTick] = useState(0);

    const fetchData = async () => {
        let realLeads: any[] = [];
        let realAgents: any[] = [];
        let fetchedFromDb = false;

        if (!isDemo && !selectedCompanyId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const companyId = isDemo
                ? (selectedCompanyId?.startsWith('demo-') ? null : selectedCompanyId)
                : selectedCompanyId;

            if (companyId) {
                const [unassignedLeads, team] = await Promise.all([
                    dashboardService.getUnassignedLeads(companyId),
                    dashboardService.listTeam(companyId)
                ]);

                realLeads = unassignedLeads.map(l => ({
                    id: l.id,
                    name: l.name,
                    email: l.email,
                    phone: l.phone,
                    propertyInterest: l.interest || 'Desconhecido',
                    product: l.interest || 'Desconhecido', // Agora usamos interest como produto
                    origin: l.source || l.utm_source || 'Website',
                    status: STATUS_MAP[l.stage] || l.stage,
                    createdAt: l.created_at,
                    agent: null
                }));

                realAgents = team.map(u => ({
                    id: u.id,
                    name: u.full_name,
                    avatar: u.full_name.substring(0, 2).toUpperCase(),
                    status: u.active ? 'active' : 'inactive',
                    role: u.user_type === 'broker' ? 'Corretor' : 'Gerente',
                    my_manager: u.my_manager // Importante para a lógica de atribuição
                }));

                if (realLeads.length > 0 || realAgents.length > 0) {
                    fetchedFromDb = true;
                }
            } else {
                realLeads = [];
                realAgents = [];
            }

            setLeads(realLeads);
            setAgents(realAgents);
        } catch (error) {
            console.error('Erro ao buscar leads do Supabase:', error);
            setLeads([]);
            setAgents([]);
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar as oportunidades do banco de dados.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompanyId, isDemo]);

    const filteredLeads = leads.filter(lead => {
        const nameMatch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const emailMatch = lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const phoneMatch = lead.phone?.includes(searchTerm) || false;

        const matchesSearch = nameMatch || emailMatch || phoneMatch;
        const matchesProduct = filterProduct ? lead.product === filterProduct : true;
        const matchesOrigin = filterOrigin ? lead.origin === filterOrigin : true;

        let matchesDate = true;
        if (filterDate) {
            const leadDate = new Date(lead.createdAt);
            matchesDate = leadDate.toDateString() === filterDate.toDateString();
        }

        const isUnassigned = lead.agent === null;
        return matchesSearch && matchesProduct && matchesOrigin && matchesDate && isUnassigned;
    });

    const activeAgents = agents.filter(member => member.status === 'active' && member.role === 'Corretor');

    const handleAssignAgent = async (leadId: string, agentName: string) => {
        const lead = leads.find(l => l.id === leadId);
        const agent = agents.find(a => a.name === agentName);

        if (lead && agent) {
            // Local state update for immediate UX
            const updatedLeads = leads.map(l =>
                l.id === leadId ? { ...l, agent: agentName, status: 'Em Espera' } : l
            );

            if (!isDemo) {
                try {
                    // O agent no estado 'agents' deve ter o .id e o .my_manager (do banco)
                    const result = await dashboardService.assignLeadToBroker(
                        leadId,
                        agent.id,
                        agent.my_manager || null
                    );

                    if (result.success) {
                        setLeads(updatedLeads);
                        toast({
                            title: "Corretor atribuído!",
                            description: `Lead atribuído para ${agentName} com sucesso.`,
                        });
                    } else {
                        toast({
                            title: "Erro ao atribuir",
                            description: "Não foi possível salvar a alteração no banco de dados.",
                            variant: "destructive"
                        });
                    }
                } catch (error) {
                    console.error('Erro na atribuição:', error);
                    toast({
                        title: "Erro inesperado",
                        description: "Ocorreu um erro ao processar a atribuição.",
                        variant: "destructive"
                    });
                }
            } else {
                // No modo demo, apenas atualiza o estado local
                setLeads(updatedLeads);
                toast({
                    title: "Modo Demo: Corretor atribuído!",
                    description: `Lead atribuído para ${agentName} (apenas simulação).`,
                });
            }
        }
    };

    const statuses = ['Novo', 'Em Espera', 'Em Atendimento', 'Documentação', 'Comprou', 'Atribuído', 'Removido', 'Desconhecido'];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground">Disponíveis</h1>
                <p className="text-muted-foreground">Leads disponíveis para atendimento imediato</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar lead..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Produto */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9">
                                <Filter className="h-3.5 w-3.5" />
                                {filterProduct || 'Produto'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem onClick={() => setFilterProduct(null)}>Todos os Produtos</DropdownMenuItem>
                            {Array.from(new Set(leads.map(l => l.product))).sort().map(product => (
                                <DropdownMenuItem key={product} onClick={() => setFilterProduct(product)}>
                                    {product}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Origem */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9">
                                <Filter className="h-3.5 w-3.5" />
                                {filterOrigin || 'Origem'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem onClick={() => setFilterOrigin(null)}>Todas as Origens</DropdownMenuItem>
                            {Array.from(new Set(leads.map(l => l.origin))).sort().map(origin => (
                                <DropdownMenuItem key={origin} onClick={() => setFilterOrigin(origin)}>
                                    {origin}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Data */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9">
                                <Calendar className="h-3.5 w-3.5" />
                                {filterDate ? format(filterDate, "dd 'de' MMMM", { locale: ptBR }) : 'Total'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-2 border-b">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start font-normal text-xs"
                                    onClick={() => setFilterDate(null)}
                                >
                                    Todas as Datas (Total)
                                </Button>
                            </div>
                            <CalendarComponent
                                mode="single"
                                selected={filterDate || undefined}
                                onSelect={(date) => setFilterDate(date || null)}
                                initialFocus
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Leads List */}
            <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interesse</th>
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origem</th>
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs text-foreground uppercase tracking-tight">{lead.name}</span>
                                            <div className="flex flex-col gap-0 mt-0.5">
                                                <a
                                                    href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Oi ${lead.name.split(' ')[0]} tudo joia?`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 opacity-90"
                                                >
                                                    <Phone className="h-2.5 w-2.5" /> {lead.phone}
                                                </a>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-80">
                                                    <Mail className="h-2.5 w-2.5" /> {lead.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="text-xs font-medium">{lead.propertyInterest}</span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wider">
                                            {lead.origin}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-3 py-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                        Atribuir
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        {activeAgents.length > 0 ? (
                                                            activeAgents.map((agent) => (
                                                                <DropdownMenuItem
                                                                    key={agent.id}
                                                                    onClick={() => handleAssignAgent(lead.id, agent.name)}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                            {agent.avatar}
                                                                        </div>
                                                                        {agent.name}
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                                                                Sem corretor disponível
                                                            </div>
                                                        )}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        Nenhuma oportunidade sem atribuição encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
