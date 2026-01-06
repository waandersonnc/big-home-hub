import { useState, useEffect } from 'react';
import { Plus, Search, Phone, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { leads as initialLeads, Lead, teamMembers, properties } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { dashboardService } from '@/services/dashboard.service';
import { useToast } from '@/components/ui/use-toast';

type PipelineColumn = 'Em Espera' | 'Em Atendimento' | 'Documentação' | 'Vendido';

const columns: { id: PipelineColumn; title: string; color: string }[] = [
  { id: 'Em Espera', title: 'Em Espera', color: 'bg-muted' },
  { id: 'Em Atendimento', title: 'Em Atendimento', color: 'bg-primary/10' },
  { id: 'Documentação', title: 'Documentação', color: 'bg-warning/10' },
  { id: 'Vendido', title: 'Vendido', color: 'bg-success/10' },
];

const STAGE_TO_COLUMN: Record<string, PipelineColumn> = {
  'new': 'Em Espera',
  'contacted': 'Em Atendimento',
  'visit_scheduled': 'Em Atendimento',
  'proposal': 'Documentação',
  'won': 'Vendido',
  'waiting': 'Em Espera'
};

export default function Pipeline() {
  const isDemo = demoStore.isActive;
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();

  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
        const [allLeads, team] = await Promise.all([
          dashboardService.getAllCompanyLeads(companyId),
          dashboardService.listTeam(companyId)
        ]);

        realAgents = team.filter(u => u.user_type === 'broker').map(u => ({
          id: u.id,
          name: u.full_name,
          avatar: u.full_name.substring(0, 2).toUpperCase(),
          status: u.active ? 'active' : 'inactive'
        }));

        realLeads = allLeads.filter(l => l.assigned_to !== null).map(l => {
          const agent = team.find(u => u.id === l.assigned_to);
          return {
            id: l.id,
            name: l.name,
            phone: l.phone,
            propertyInterest: l.property_interest || 'Imóvel sob consulta',
            agent: agent?.full_name || 'Desconhecido',
            agentAvatar: (agent?.full_name || 'U').substring(0, 2).toUpperCase(),
            status: STAGE_TO_COLUMN[l.stage] || 'Em Espera',
            origin: l.source || 'Website'
          };
        });

        if (realLeads.length > 0 || realAgents.length > 0) {
          fetchedFromDb = true;
        }
      }

      if (isDemo && !fetchedFromDb) {
        setLeads(initialLeads);
        setAgents(teamMembers.filter(m => m.role === 'Corretor'));
      } else {
        setLeads(realLeads);
        setAgents(realAgents);
      }
    } catch (error) {
      console.error('Erro ao buscar pipeline:', error);
      if (isDemo) {
        setLeads(initialLeads);
        setAgents(teamMembers.filter(m => m.role === 'Corretor'));
      } else {
        toast({ title: "Erro ao carregar dados", description: "Não foi possível carregar o pipeline.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, isDemo]);

  // Create a set of valid broker names for O(1) lookup
  const validBrokerNames = new Set(agents.map(a => a.name));

  const filteredLeads = leads.filter((lead) => {
    const nameMatch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesAgentFilter = agentFilter === 'all' || lead.agent === agentFilter;

    // Only show leads assigned to a valid Broker
    // Checks if agent is not null AND if the agent name exists in the broker list
    const isAssignedToBroker = lead.agent !== null && (validBrokerNames.has(lead.agent) || isDemo);

    return nameMatch && matchesAgentFilter && isAssignedToBroker;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getColumnLeads = (status: PipelineColumn) => {
    return filteredLeads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PipelineColumn) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== targetStatus) {
      setLeads(leads.map((lead) =>
        lead.id === draggedLead.id ? { ...lead, status: targetStatus } : lead
      ));
    }
    setDraggedLead(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentação</h1>
          <p className="text-muted-foreground">Acompanhe o progresso dos seus leads</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Lead</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Nome do lead" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property">Imóvel de Interesse</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent">Corretor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Origem</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Corretor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {columns.map((column) => {
          const columnLeads = getColumnLeads(column.id);
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 lg:w-80 snap-start"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={cn('rounded-t-xl p-3 flex items-center justify-between', column.color)}>
                <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-xs font-medium">
                  {columnLeads.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="bg-muted/30 rounded-b-xl p-2 min-h-[400px] space-y-2">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className={cn(
                      'bg-card rounded-lg p-3 shadow-card border cursor-grab active:cursor-grabbing transition-all',
                      'hover:shadow-soft animate-fade-in',
                      draggedLead?.id === lead.id && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-card-foreground truncate">{lead.name}</h4>
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </a>
                      </div>
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>

                    {lead.propertyInterest && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        🏠 {lead.propertyInterest}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {lead.agentAvatar}
                        </div>
                        <span className="text-xs text-muted-foreground">{lead.agent}</span>
                      </div>
                      <StatusBadge status={lead.origin} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
