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
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { teamService } from '@/services/team.service';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { UI_TEXT } from '@/lib/constants';
import type { TeamMemberDisplay } from '@/types';

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
                    teamService.listBrokers(companyId)
                ]);

                // Fetch lead counts for each member in this specific company
                const leadCounts: Record<string, number> = {};
                const salesCounts: Record<string, number> = {};

                const { data: leadsData } = await supabase
                    .from('leads')
                    .select('id, my_broker, my_manager, stage')
                    .eq('company_id', companyId);

                if (leadsData) {
                    leadsData.forEach(lead => {
                        const memberId = lead.my_broker || lead.my_manager;
                        if (memberId) {
                            leadCounts[memberId] = (leadCounts[memberId] || 0) + 1;
                            if (lead.stage === 'won' || lead.stage === 'Vendido') {
                                salesCounts[memberId] = (salesCounts[memberId] || 0) + 1;
                            }
                        }
                    });
                }

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
                    status: (u.active === false ? 'inactive' : 'active'),
                    user_type: 'manager',
                    photo_url: u.avatar_url || null,
                }));

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
                    status: (u.active === false ? 'inactive' : 'active'),
                    user_type: 'broker',
                    photo_url: u.avatar_url || null,
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
    }, [selectedCompanyId, isDemo]);

    const filteredMembers = members.filter((member) => {
        const nameToMatch = (member.name || member.full_name || 'Nome Usuário').toLowerCase();
        const matchesTab = activeTab === 'all' || member.role === activeTab;
        const matchesSearch = nameToMatch.includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const toggleStatus = (id: string) => {
        setMembers(members.map((m) =>
            m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
        ));
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 px-4 shadow-soft gap-2 text-sm">
                            <Plus size={18} />
                            {UI_TEXT.BUTTONS.ADD_MEMBER}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Membro</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <Input id="name" placeholder="Nome do membro" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="email@exemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" placeholder="(11) 99999-9999" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Cargo</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cargo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gerente">Gerente</SelectItem>
                                        <SelectItem value="Corretor">Corretor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                                    Salvar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
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
                                        <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors">
                                            {member.name || member.full_name}
                                        </h3>
                                        <div className="mt-1">
                                            <StatusBadge status={member.role} />
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    checked={member.status === 'active'}
                                    onCheckedChange={() => toggleStatus(member.id)}
                                    className="data-[state=checked]:bg-primary"
                                />
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
