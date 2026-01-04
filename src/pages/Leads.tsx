import { useState } from 'react';
import { Search, Filter, Phone, Mail, Calendar, MoreVertical, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { leads, teamMembers } from '@/data/mockData';
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

export default function Leads() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const { toast } = useToast();

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm);
        const matchesStatus = filterStatus ? lead.status === filterStatus : true;
        const isUnassigned = lead.agent === null;
        return matchesSearch && matchesStatus && isUnassigned;
    });

    const activeAgents = teamMembers.filter(member => member.status === 'active');

    // Force update state to trigger re-render
    const [, setTick] = useState(0);

    const handleAssignAgent = (leadId: string, agentName: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            lead.agent = agentName;
            lead.status = 'Em Espera';

            toast({
                title: "Corretor atribuído!",
                description: `Lead atribuído para ${agentName} com sucesso.`,
            });

            // Force re-render to remove from list
            setTick(t => t + 1);
        }
    };

    const statuses = ['Novo', 'Em Espera', 'Em Atendimento', 'Documentação', 'Vendido'];

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground">Leads</h1>
                <p className="text-muted-foreground">Leads aguardando atribuição de corretor</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                {filterStatus || 'Status'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setFilterStatus(null)}>Todos</DropdownMenuItem>
                            {statuses.map(status => (
                                <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                                    {status}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Leads List */}
            <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interesse</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Origem</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-foreground">{lead.name}</span>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {lead.phone}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {lead.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm font-medium">{lead.propertyInterest}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wider">
                                            {lead.origin}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
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
                                                        {activeAgents.map((agent) => (
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
                                                        ))}
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
                                        Nenhum lead sem atribuição encontrado.
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
