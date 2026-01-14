import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Phone, GripVertical, Loader2, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from '@/lib/utils';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { dashboardService } from '@/services/dashboard.service';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { PipelineLeadCard } from '@/components/Leads/PipelineLeadCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

type PipelineColumn = 'Em Espera' | 'Em Atendimento' | 'Documentação' | 'Vendido' | 'Removido';

const columns: { id: PipelineColumn; title: string; color: string }[] = [
  { id: 'Em Espera', title: 'Em Espera', color: 'bg-muted' },
  { id: 'Em Atendimento', title: 'Em Atendimento', color: 'bg-primary/10' },
  { id: 'Documentação', title: 'Documentação', color: 'bg-warning/10' },
  { id: 'Vendido', title: 'Vendido', color: 'bg-success/10' },
  { id: 'Removido', title: 'Removidos', color: 'bg-destructive/10' },
];

const STAGE_TO_COLUMN: Record<string, PipelineColumn> = {
  'novo': 'Em Espera',
  'em atendimento': 'Em Atendimento',
  'documentação': 'Documentação',
  'comprou': 'Vendido',
  'em espera': 'Em Espera',
  'removido': 'Removido'
};

const COLUMN_TO_STAGE: Record<PipelineColumn, string> = {
  'Em Espera': 'em espera',
  'Em Atendimento': 'em atendimento',
  'Documentação': 'documentação',
  'Vendido': 'comprou',
  'Removido': 'removido'
};

export default function Pipeline() {
  const isDemo = demoStore.isActive;
  const { selectedCompanyId } = useCompany();
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [fullTeam, setFullTeam] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [downloadConfig, setDownloadConfig] = useState<{ isOpen: boolean; type: 'column' | 'all'; columnId?: PipelineColumn }>({
    isOpen: false,
    type: 'all'
  });
  const longPressTimer = useRef<any>(null);
  const { selectedCompany } = useCompany();

  // CSV Export Logic
  const handleDownloadCSV = (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast({ title: "Nenhum dado", description: "Não há leads para exportar.", variant: "destructive" });
      return;
    }

    // Define headers
    const headers = [
      "Corretor",
      "Lead",
      "Telefone",
      "Stage",
      "Gerente",
      "Dono",
      "Imobiliaria"
    ];

    // Map data to rows
    const rows = data.map(l => {
      const broker = fullTeam.find(u => u.id === (l.my_broker || l.assigned_to))?.full_name || "N/A";
      const manager = fullTeam.find(u => u.id === l.my_manager)?.full_name || "N/A";
      const companyName = selectedCompany?.name || "N/A";

      return [
        broker,
        l.name || "N/A",
        l.phone || "N/A",
        l.status || l.stage || "N/A",
        manager,
        "Dono do Sistema", // Placeholder or fetch if owner name is available
        companyName
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Trigger download
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Sucesso", description: "O download da lista de leads foi iniciado." });
  };

  const onConfirmDownload = () => {
    let exportData: any[] = [];
    let fileName = "";

    // Filtering logic based on permissions
    const getFilteredByRole = (rawLeads: any[]) => {
      if (user?.role === 'owner') return rawLeads;
      if (user?.role === 'manager') return rawLeads.filter(l => l.my_manager === user.id);
      if (user?.role === 'broker') return rawLeads.filter(l => (l.my_broker || l.assigned_to) === user.id);
      return [];
    };

    if (downloadConfig.type === 'all') {
      fileName = `todos-os-leads-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      // All leads except "Em Espera"
      const baseLeads = leads.filter(l => l.status !== 'Em Espera');
      exportData = getFilteredByRole(baseLeads);
    } else if (downloadConfig.columnId) {
      const colName = downloadConfig.columnId;
      const agentName = agentFilter === 'all' ? 'todos' : agentFilter;
      fileName = `leads-${colName.toLowerCase().replace(/ /g, '-')}-${agentName.replace(/ /g, '-')}`;

      const columnLeads = getColumnLeads(downloadConfig.columnId);
      exportData = getFilteredByRole(columnLeads);
    }

    handleDownloadCSV(exportData, fileName);
    setDownloadConfig({ ...downloadConfig, isOpen: false });
  };

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    source: '',
    my_broker: '',
    my_manager: ''
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast({ title: "Modo Demo", description: "Não é possível criar leads no modo de demonstração." });
      return;
    }

    if (!user) return;

    setCreating(true);
    try {
      // Hierarquia solicitada:
      // Se broker: pega tudo do broker (ele já tem manager_id e company_id no perfil)
      // Se manager: seleciona broker (manager id e owner id são do manager)
      // Se owner: seleciona manager e broker

      const leadData = {
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || null,
        interest: newLead.interest || null,
        source: newLead.source || 'Manual',
        stage: 'em espera', // Adicionado como "Em Espera"
        company_id: selectedCompanyId || user.real_estate_company_id,
        my_owner: user.role === 'owner' ? user.id : user.my_owner,
        my_manager: user.role === 'manager' ? user.id : (user.role === 'broker' ? user.manager_id : newLead.my_manager),
        my_broker: user.role === 'broker' ? user.id : newLead.my_broker,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await dashboardService.createLead(leadData);

      if (result.success) {
        toast({ title: "Lead criado!", description: "O lead foi adicionado ao pipeline." });
        setIsDialogOpen(false);
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Erro ao criar lead", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Funções auxiliares para buscar owner_id se não estiver no user (o hook AuthContext atualizado agora traz esses campos)
  const getOwnerFromCompany = async (compId: string) => {
    const { data } = await supabase.from('real_estate_companies').select('owner_id').eq('id', compId).single();
    return data?.owner_id;
  };

  const getOwnerFromManager = async (managerId: string) => {
    const { data } = await supabase.from('managers').select('my_owner').eq('id', managerId).single();
    return data?.my_owner;
  };

  const getOwnerFromBroker = async (brokerId: string) => {
    const { data } = await supabase.from('brokers').select('my_owner').eq('id', brokerId).single();
    return data?.my_owner;
  };

  const startLongPress = (lead: any) => {
    longPressTimer.current = setTimeout(() => {
      handleCardClick(lead);
    }, 600); // 600ms para o clique longo
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const fetchData = async () => {
    if (!isDemo && !selectedCompanyId) {
      setLeads([]);
      setAgents([]);
      setFullTeam([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const companyId = selectedCompanyId || (isDemo ? 'f9b0b936-67f4-4ea0-8c13-b7fb2a9532c3' : null);

      if (companyId) {
        const [allLeads, team] = await Promise.all([
          dashboardService.getAllCompanyLeads(companyId),
          dashboardService.listTeam(companyId)
        ]);

        setFullTeam(team);

        const realAgents = team.filter(u => u.user_type === 'broker').map(u => ({
          id: u.id,
          name: u.full_name,
          avatar: u.full_name.substring(0, 2).toUpperCase(),
          status: u.active ? 'active' : 'inactive'
        }));

        // Filtra leads que estão em stages do pipeline (não são 'novo')
        const realLeads = allLeads.filter(l => l.stage !== 'novo').map(l => {
          const agent = team.find(u => u.id === l.my_broker);
          return {
            id: l.id,
            name: l.name,
            phone: l.phone,
            propertyInterest: l.interest || 'Imóvel sob consulta',
            agent: agent?.full_name || 'Desconhecido',
            agentAvatar: (agent?.full_name || 'U').substring(0, 2).toUpperCase(),
            origin: l.source || 'Website',
            // Novos campos para o detalhe
            rawStage: l.stage,
            status: STAGE_TO_COLUMN[l.stage] || 'Em Espera',
            informative: l.informative || [],
            closing_data: l.closing_data || {},
            created_at: l.created_at,
            my_owner: l.my_owner,
            my_manager: l.my_manager,
            my_broker: l.my_broker,
            lastInteractionAt: l.last_interaction_at,
            followupAt: l.followup_scheduled_at,
            followupNote: l.followup_note
          };
        });

        setLeads(realLeads);
        setAgents(realAgents);
      } else {
        setLeads([]);
        setAgents([]);
        setFullTeam([]);
      }
    } catch (error) {
      //       console.error('Erro ao buscar pipeline:', error);
      setLeads([]);
      setAgents([]);
      setFullTeam([]);
      toast({ title: "Erro ao carregar dados", description: "Não foi possível carregar o pipeline.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!isDemo && selectedCompanyId) {
      // Subscribe to changes in the leads table for this company
      const channel = supabase
        .channel('pipeline-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `company_id=eq.${selectedCompanyId}`
          },
          (payload) => {
            fetchData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedCompanyId, isDemo]);

  // Create a set of valid broker names for O(1) lookup
  const validBrokerNames = new Set(agents.map(a => a.name));

  const filteredLeads = leads.filter((lead) => {
    const nameMatch = lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesAgentFilter = agentFilter === 'all' || lead.agent === agentFilter;

    // Show leads that are matched by search and agent filter
    // If agentFilter is 'all', show all leads (including those with Desconhecido agent)
    return nameMatch && matchesAgentFilter;
  });

  const handleWhatsAppClick = async (lead: any) => {
    // Only change status if it's currently 'Em Espera'
    if (lead.status === 'Em Espera') {
      const targetStatus: PipelineColumn = 'Em Atendimento';

      // Update local state for immediate feedback
      setLeads(leads.map((l) =>
        l.id === lead.id ? { ...l, status: targetStatus } : l
      ));

      if (!isDemo && user) {
        try {
          await dashboardService.startWhatsAppLead(lead.id, user.full_name || user.email || 'Corretor');
        } catch (err) {
          console.error('Erro ao atualizar status via WhatsApp:', err);
        }
      }
    }
  };

  const handleCardClick = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

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



  return (
    <div className="p-4 lg:p-6 space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentação</h1>
          <p className="text-muted-foreground">Acompanhe o progresso dos seus leads</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={() => setDownloadConfig({ isOpen: true, type: 'all' })}
                    disabled={!selectedCompanyId}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Todos os Leads
                  </Button>
                </span>
              </TooltipTrigger>
              {!selectedCompanyId && (
                <TooltipContent className="bg-destructive text-destructive-foreground border-none">
                  <div className="flex items-center gap-2 py-1">
                    <AlertCircle size={14} />
                    <p className="text-xs font-bold">Selecione uma imobiliária antes de acessar os leads</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip delayDuration={0}>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <TooltipTrigger asChild>
                  <span>
                    <DialogTrigger asChild>
                      <Button
                        disabled={!selectedCompanyId}
                        onClick={() => {
                          setNewLead({
                            name: '',
                            phone: '',
                            email: '',
                            interest: '',
                            source: '',
                            my_broker: user?.role === 'broker' ? user.id : '',
                            my_manager: user?.role === 'manager' ? user.id : (user?.role === 'broker' ? (user.manager_id || '') : '')
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Lead
                      </Button>
                    </DialogTrigger>
                  </span>
                </TooltipTrigger>
                {!selectedCompanyId && (
                  <TooltipContent className="bg-destructive text-destructive-foreground border-none">
                    <div className="flex items-center gap-2 py-1">
                      <AlertCircle size={14} />
                      <p className="text-xs font-bold">Selecione uma imobiliária antes de cadastrar leads</p>
                    </div>
                  </TooltipContent>
                )}
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Lead</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateLead} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="lead-name">Nome *</Label>
                      <Input
                        id="lead-name"
                        placeholder="Nome completo do lead"
                        required
                        value={newLead.name}
                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lead-phone">Telefone *</Label>
                        <Input
                          id="lead-phone"
                          placeholder="(11) 99999-9999"
                          required
                          value={newLead.phone}
                          onChange={(e) => {
                            const masked = e.target.value
                              .replace(/\D/g, '')
                              .replace(/^(\d{2})(\d)/g, '($1) $2')
                              .replace(/(\d{5})(\d)/, '$1-$2')
                              .substring(0, 15);
                            setNewLead({ ...newLead, phone: masked });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lead-email">Email (Opcional)</Label>
                        <Input
                          id="lead-email"
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newLead.email}
                          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lead-interest">Interesse (Opcional)</Label>
                      <Input
                        id="lead-interest"
                        placeholder="Ex: Apartamento 3 quartos..."
                        value={newLead.interest}
                        onChange={(e) => setNewLead({ ...newLead, interest: e.target.value })}
                      />
                    </div>

                    {/* Hierarchy Logic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(user?.role === 'owner') && (
                        <div className="space-y-2">
                          <Label htmlFor="lead-manager">Gerente</Label>
                          <Select
                            value={newLead.my_manager}
                            onValueChange={(val) => setNewLead({ ...newLead, my_manager: val, my_broker: '' })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gerente" />
                            </SelectTrigger>
                            <SelectContent>
                              {fullTeam.filter(m => m.user_type === 'manager').map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(user?.role === 'owner' || user?.role === 'manager') && (
                        <div className="space-y-2">
                          <Label htmlFor="lead-broker">Corretor</Label>
                          <Select
                            value={newLead.my_broker}
                            onValueChange={(val) => setNewLead({ ...newLead, my_broker: val })}
                            disabled={user?.role === 'owner' && !newLead.my_manager}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o corretor" />
                            </SelectTrigger>
                            <SelectContent>
                              {fullTeam
                                .filter(b => b.user_type === 'broker')
                                // Se for owner, filtra brokers do gerente selecionado
                                // Se for manager, ele só vê os dele (listTeam já deve retornar filtrado pela API se for manager logado)
                                .filter(b => !newLead.my_manager || b.my_manager === newLead.my_manager)
                                .map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.full_name}</SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {user?.role === 'broker' && (
                        <div className="space-y-2">
                          <Label>Atribuído a</Label>
                          <Input value={user.full_name} disabled className="bg-muted/50" />
                        </div>
                      )}

                      <div className="space-y-2 col-span-1">
                        <Label htmlFor="lead-origin">Origem</Label>
                        <Select
                          value={newLead.source}
                          onValueChange={(val) => setNewLead({ ...newLead, source: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Site">Site</SelectItem>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="Google">Google</SelectItem>
                            <SelectItem value="Indicação">Indicação</SelectItem>
                            <SelectItem value="Portais">Portais</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t mt-6">
                      <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1" disabled={creating}>
                        {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Criar Lead'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </Tooltip>
          </TooltipProvider>
        </div>
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
          const showDownload = column.id !== 'Em Espera';
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-64 lg:w-72 snap-start"
            >
              {/* Column Header */}
              <div className={cn('rounded-t-xl p-2 flex items-center justify-between', column.color)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs text-card-foreground uppercase tracking-wider">{column.title}</h3>
                  {showDownload && (
                    <button
                      onClick={() => setDownloadConfig({ isOpen: true, type: 'column', columnId: column.id })}
                      className="p-1 hover:bg-black/5 rounded-md transition-colors"
                      title={`Baixar leads de ${column.title}`}
                    >
                      <Download className="h-3 w-3 text-card-foreground/70" />
                    </button>
                  )}
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-xs font-medium">
                  {columnLeads.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="bg-muted/30 rounded-b-xl p-2 min-h-[400px] space-y-2">
                {columnLeads.map((lead) => (
                  <PipelineLeadCard
                    key={lead.id}
                    lead={lead}
                    onCardClick={handleCardClick}
                    onWhatsAppClick={handleWhatsAppClick}
                    onUpdate={fetchData}
                    startLongPress={startLongPress}
                    cancelLongPress={cancelLongPress}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div >
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdate={fetchData}
      />

      <AlertDialog open={downloadConfig.isOpen} onOpenChange={(open) => setDownloadConfig({ ...downloadConfig, isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja baixar a lista de leads?</AlertDialogTitle>
            <AlertDialogDescription>
              {downloadConfig.type === 'all'
                ? "Esta ação irá baixar todos os leads de todas as seções (exceto Em Espera)."
                : `Deseja baixar a lista de leads do bloco "${downloadConfig.columnId}" ${agentFilter !== 'all' ? `do corretor ${agentFilter}` : 'de todos os corretores'}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDownload}>Sim, baixar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
