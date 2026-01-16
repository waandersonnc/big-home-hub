import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Users as UsersIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { teamService } from '@/services/team.service';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { UI_TEXT } from '@/lib/constants';
import type { TeamMemberDisplay } from '@/types';
import AddMemberModal from './AddMemberModal';

type TabFilter = 'all' | 'Gerente' | 'Corretor';

export default function Team() {
    const isDemo = demoStore.isActive;
    const { selectedCompanyId } = useCompany();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<TeamMemberDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchData = async () => {
        if (!selectedCompanyId && !isDemo) {
            setMembers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Priority: selectedCompanyId -> demo fixed ID if isDemo
            const companyId = selectedCompanyId || (isDemo ? '42c4a6ab-5b49-45f0-a344-fad80e7ac9d2' : null);

            if (companyId) {
                const [managers, brokers] = await Promise.all([
                    teamService.listManagers(companyId),
                    teamService.listBrokers(companyId) // Ensure this returns quer_lead or modify the service too?
                ]);
                // We need to fetch quer_lead manually if teamService doesn't return it yet, 
                // OR we update teamService. But for now I'll do a direct patch/fetch here or assume teamService returns * from brokers.
                // team.service.ts does `select('*')`, so quer_lead should be there!

                // Fetch lead counts for each member in this specific company
                const leadCounts: Record<string, number> = {};
                const salesCounts: Record<string, number> = {};

                const { data: leadsData } = await supabase
                    .from('leads')
                    .select('id, my_broker, my_manager, stage')
                    .eq('company_id', companyId);

                if (leadsData) {
                    leadsData.forEach(lead => {
                        // Count for broker
                        if (lead.my_broker) {
                            leadCounts[lead.my_broker] = (leadCounts[lead.my_broker] || 0) + 1;
                            if (lead.stage === 'won' || lead.stage === 'Vendido') {
                                salesCounts[lead.my_broker] = (salesCounts[lead.my_broker] || 0) + 1;
                            }
                        }

                        // Count for manager
                        if (lead.my_manager && lead.my_manager !== lead.my_broker) { // Avoid double counting if for some reason IDs are same (unlikely but safe)
                            leadCounts[lead.my_manager] = (leadCounts[lead.my_manager] || 0) + 1;
                            if (lead.stage === 'won' || lead.stage === 'Vendido') {
                                salesCounts[lead.my_manager] = (salesCounts[lead.my_manager] || 0) + 1;
                            }
                        }
                    });
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const normalizedManagers: TeamMemberDisplay[] = managers.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    phone: u.phone,
                    role: 'Gerente',
                    name: u.full_name || u.name,
                    full_name: u.full_name || u.name,
                    leads: leadCounts[u.id] || 0,
                    sales: salesCounts[u.id] || 0,
                    avatar: (u.full_name || u.name || 'G').substring(0, 2).toUpperCase(),
                    status: (u.active === false ? 'inactive' : 'active') as 'active' | 'inactive',
                    user_type: 'manager',
                    photo_url: u.avatar_url || null,
                }));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const normalizedBrokers: TeamMemberDisplay[] = brokers.map((u: any) => ({
                    id: u.id,
                    email: u.email,
                    phone: u.phone,
                    role: 'Corretor',
                    name: u.full_name || u.name,
                    full_name: u.full_name || u.name,
                    leads: leadCounts[u.id] || 0,
                    sales: salesCounts[u.id] || 0,
                    avatar: (u.full_name || u.name || 'C').substring(0, 2).toUpperCase(),
                    status: (u.active === false ? 'inactive' : 'active') as 'active' | 'inactive',
                    user_type: 'broker',
                    photo_url: u.avatar_url || null,
                    quer_lead: u.quer_lead // Map the database column
                }));

                setMembers([...normalizedManagers, ...normalizedBrokers]);
            } else {
                setMembers([]);
            }
        } catch (error) {
            console.error('Erro ao buscar equipe do Supabase:', error);
            setMembers([]);
            const err = error as Error;
            toast({
                title: "Erro ao carregar equipe",
                description: "Não foi possível buscar os dados do Supabase.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCompanyId, isDemo]);

    const filteredMembers = members.filter((member) => {
        const nameToMatch = (member.name || member.full_name || 'Nome Usuário').toLowerCase();
        const matchesTab = activeTab === 'all' || member.role === activeTab;
        const matchesSearch = nameToMatch.includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const newActiveState = newStatus === 'active';

        // Optimistic update
        setMembers(members.map((m) =>
            m.id === id ? { ...m, status: newStatus as 'active' | 'inactive' } : m
        ));

        try {
            const { error } = await supabase
                .from('brokers')
                .update({ active: newActiveState })
                .eq('id', id);

            if (error) throw error;
            
            toast({
                title: newActiveState ? "Membro ativado" : "Membro desativado",
                duration: 2000
            });
        } catch (error) {
            console.error('Error toggling status:', error);
            // Revert on error
            setMembers(members.map((m) =>
                m.id === id ? { ...m, status: currentStatus as 'active' | 'inactive' } : m
            ));
            toast({
                title: "Erro ao atualizar status",
                variant: "destructive"
            });
        }
    };

    const tabs: { label: string; value: TabFilter }[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Gerentes', value: 'Gerente' },
        { label: 'Corretores', value: 'Corretor' },
    ];

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Equipe</h1>
                    <p className="text-muted-foreground">Gerencie os membros da sua equipe</p>
                </div>
                <Button
                    className="h-10 px-4 shadow-soft gap-2 text-sm"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus size={18} />
                    {UI_TEXT.BUTTONS.ADD_MEMBER}
                </Button>

                <AddMemberModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSuccess={fetchData}
                    managers={members.filter(m => m.user_type === 'manager')}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto p-1 bg-muted/20 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                'px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200',
                                activeTab === tab.value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-card border shadow-sm rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Team Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member, index) => (
                        <div
                            key={member.id}
                            className="bg-card rounded-2xl p-6 shadow-soft border-none hover:shadow-lg transition-all duration-300 group animate-fade-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        'flex h-14 w-14 items-center justify-center rounded-full font-bold text-xl shadow-inner',
                                        member.role === 'Gerente'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-primary/10 text-primary'
                                    )}>
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt={member.name} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            member.avatar || (member.name || 'U').substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <h3 className="font-bold text-base text-card-foreground group-hover:text-primary transition-colors cursor-default">
                                                        {(member.name || member.full_name || '').length > 18 
                                                            ? `${(member.name || member.full_name || '').substring(0, 18)}...` 
                                                            : (member.name || member.full_name)}
                                                    </h3>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{member.name || member.full_name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <div className="mt-1">
                                            <StatusBadge status={member.role} />
                                        </div>
                                    </div>
                                </div>
                                {member.user_type === 'broker' && (
                                    <div className="flex flex-col items-end gap-1">
                                         <Switch
                                            checked={member.status === 'active'}
                                            onCheckedChange={() => toggleStatus(member.id, member.status)}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {member.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="p-1.5 rounded-lg bg-muted/50">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <span className="truncate font-medium">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="p-1.5 rounded-lg bg-muted/50">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">{member.phone}</span>
                                </div>
                            </div>

                            <div className="flex gap-6 pt-5 border-t border-muted/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                                        <UsersIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-card-foreground leading-tight">{member.leads || 0}</p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/5 text-success">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-card-foreground leading-tight">{member.sales || 0}</p>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vendas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                            <p className="text-muted-foreground font-medium italic">{UI_TEXT.MESSAGES.NO_MEMBERS_FOUND}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
