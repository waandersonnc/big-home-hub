import { useState } from 'react';
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
import { teamMembers, TeamMember } from '@/data/mockData';
import { cn } from '@/lib/utils';

type TabFilter = 'all' | 'Gerente' | 'Corretor';

export default function Team() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    const matchesTab = activeTab === 'all' || member.role === activeTab;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os membros da sua equipe</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member, index) => (
          <div
            key={member.id}
            className="bg-card rounded-xl p-5 shadow-card border animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full font-semibold text-lg',
                  member.role === 'Gerente'
                    ? 'bg-primary-dark text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                )}>
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                  <StatusBadge status={member.role} />
                </div>
              </div>
              <Switch
                checked={member.status === 'active'}
                onCheckedChange={() => toggleStatus(member.id)}
              />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <UsersIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{member.leads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{member.sales}</p>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
