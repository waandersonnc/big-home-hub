import { useState, useEffect } from 'react';
import { Plus, Search, Bed, Bath, Car, Maximize, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { properties as initialProperties, Property as MockProperty } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { demoStore } from '@/lib/demoStore';
import { useCompany } from '@/contexts/CompanyContext';
import { propertyService } from '@/services/property.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

type TypeFilter = 'all' | MockProperty['type'];
type StatusFilter = 'all' | MockProperty['status'] | 'available' | 'reserved' | 'sold' | 'rented';

export default function Properties() {
  const isDemo = demoStore.isActive;
  const { selectedCompanyId } = useCompany();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!selectedCompanyId && !isDemo) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const companyId = selectedCompanyId || (isDemo ? '42c4a6ab-5b49-45f0-a344-fad80e7ac9d2' : null);

      if (companyId) {
        const data = await propertyService.listProperties(companyId);
        if (data && data.length > 0) {
          const normalized = data.map(p => ({
            ...p,
            type: p.property_type,
            parking: p.parking_spaces,
            area: p.area_total,
            status: p.status === 'available' ? 'Disponível' :
              p.status === 'reserved' ? 'Reservado' :
                p.status === 'sold' ? 'Vendido' :
                  p.status === 'rented' ? 'Locado' : p.status,
            image: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a8edea'][Math.floor(Math.random() * 6)]} 0%, ${['#764ba2', '#f5576c', '#00f2fe', '#38f9d7', '#fee140', '#fed6e3'][Math.floor(Math.random() * 6)]} 100%)`
          }));
          setProperties(normalized);
        } else {
          setProperties([]);
        }
      } else {
        setProperties([]);
      }
    } catch (error) {
      console.error('Erro ao buscar imóveis do Supabase:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId, isDemo]);

  const filteredProperties = properties.filter((property) => {
    const title = property.title || '';
    const matchesType = typeFilter === 'all' || property.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de Imóveis</h1>
          <p className="text-muted-foreground">Gerencie seu portfólio de imóveis</p>
        </div>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <TooltipTrigger asChild>
                <span>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedCompanyId}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Imóvel
                    </Button>
                  </DialogTrigger>
                </span>
              </TooltipTrigger>
              {!selectedCompanyId && (
                <TooltipContent className="bg-destructive text-destructive-foreground border-none">
                  <div className="flex items-center gap-2 py-1">
                    <AlertCircle size={14} />
                    <p className="text-xs font-bold">Selecione uma imobiliária antes de cadastrar imóveis</p>
                  </div>
                </TooltipContent>
              )}
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Imóvel</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="features">Características</TabsTrigger>
                    <TabsTrigger value="media">Mídia</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" placeholder="Ex: Apartamento Garden" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Casa">Casa</SelectItem>
                            <SelectItem value="Apartamento">Apartamento</SelectItem>
                            <SelectItem value="Terreno">Terreno</SelectItem>
                            <SelectItem value="Cobertura">Cobertura</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço</Label>
                        <Input id="price" placeholder="R$ 0,00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço</Label>
                      <Input id="address" placeholder="Rua, número - Bairro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" placeholder="Descreva o imóvel..." rows={4} />
                    </div>
                  </TabsContent>
                  <TabsContent value="features" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">Quartos</Label>
                        <Input id="bedrooms" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">Banheiros</Label>
                        <Input id="bathrooms" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="parking">Vagas</Label>
                        <Input id="parking" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Área (m²)</Label>
                        <Input id="area" type="number" placeholder="0" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="media" className="space-y-4 mt-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Arraste imagens aqui ou clique para selecionar
                        </p>
                        <Button variant="outline" size="sm">
                          Selecionar Arquivos
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóvel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="Casa">Casa</SelectItem>
            <SelectItem value="Apartamento">Apartamento</SelectItem>
            <SelectItem value="Terreno">Terreno</SelectItem>
            <SelectItem value="Cobertura">Cobertura</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Disponível">Disponível</SelectItem>
            <SelectItem value="Reservado">Reservado</SelectItem>
            <SelectItem value="Vendido">Vendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProperties.map((property, index) => (
            <div
              key={property.id}
              className="bg-card rounded-xl shadow-card border overflow-hidden animate-fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div
                className="relative h-40 flex items-center justify-center"
                style={{ background: property.image }}
              >
                <Home className="h-12 w-12 text-white/50" />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={property.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-card-foreground mb-1 group-hover:text-primary transition-colors">
                  {property.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 truncate">{property.address}</p>
                <p className="text-xl font-bold text-primary mb-4">{formatPrice(property.price)}</p>

                {/* Specs */}
                {property.type !== 'Terreno' && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      {property.parking}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="h-4 w-4" />
                      {property.area}m²
                    </span>
                  </div>
                )}
                {property.type === 'Terreno' && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Maximize className="h-4 w-4" />
                      {property.area}m²
                    </span>
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
              <p className="text-muted-foreground font-medium italic">Nenhum imóvel encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div >
  );
}
