import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Instagram,
  Facebook,
  MessageCircle,
  Globe,
  Users,
  Target,
  Phone,
  QrCode,
  Bot,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  active: boolean;
  type: 'social' | 'whatsapp' | 'website' | 'sdr';
}

const initialAgents: AgentCard[] = [
  {
    id: 'instagram-facebook',
    title: 'Instagram + Facebook',
    description: 'Atendimento automatizado em DMs, mensagens e comentários do Instagram e Facebook.',
    icon: Instagram,
    features: ['DM automático', 'Resposta a comentários', 'Qualificação de leads', 'Encaminhamento para corretor'],
    active: false,
    type: 'social',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Atendimento',
    description: 'Agente de IA para responder e qualificar leads no WhatsApp automaticamente.',
    icon: MessageCircle,
    features: ['Atendimento 24/7', 'Qualificação automática', 'Agendamento de visitas', 'Envio de catálogo'],
    active: false,
    type: 'whatsapp',
  },
  {
    id: 'website',
    title: 'Agente no Site',
    description: 'Chatbot inteligente integrado ao seu site para capturar e qualificar visitantes.',
    icon: Globe,
    features: ['Widget personalizado', 'Captura de leads', 'FAQ automático', 'Integração com CRM'],
    active: false,
    type: 'website',
  },
  {
    id: 'sdr-geral',
    title: 'SDR Geral',
    description: 'Agente SDR que atende todos os leads recebidos, independente do canal ou produto.',
    icon: Users,
    features: ['Atendimento universal', 'Triagem automática', 'Follow-up programado', 'Relatórios de conversão'],
    active: false,
    type: 'sdr',
  },
  {
    id: 'sdr-especifico',
    title: 'SDR Específico',
    description: 'Agente SDR especializado que atende apenas leads de produtos/imóveis selecionados.',
    icon: Target,
    features: ['Seleção de produtos', 'Atendimento especializado', 'Scripts personalizados', 'Métricas por produto'],
    active: false,
    type: 'sdr',
  },
];

const products = [
  { id: '1', name: 'Apartamento Garden - Zona Sul' },
  { id: '2', name: 'Casa Alto Padrão - Alphaville' },
  { id: '3', name: 'Studio Centro' },
  { id: '4', name: 'Cobertura Duplex - Jardins' },
  { id: '5', name: 'Casa em Condomínio - Granja' },
];

export default function Agents() {
  const [agents, setAgents] = useState(initialAgents);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'offline' | 'active'>('offline');
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const toggleAgent = (id: string) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === id ? { ...agent, active: !agent.active } : agent
      )
    );
  };

  const handleConnectWhatsApp = () => {
    if (whatsappPhone) {
      setShowQrCode(true);
      // Simular conexão após 3 segundos
      setTimeout(() => {
        setPhoneStatus('active');
      }, 3000);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'social':
        return 'text-pink-500';
      case 'whatsapp':
        return 'text-green-500';
      case 'website':
        return 'text-blue-500';
      case 'sdr':
        return 'text-purple-500';
      default:
        return 'text-primary';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'social':
        return 'bg-pink-500/10';
      case 'whatsapp':
        return 'bg-green-500/10';
      case 'website':
        return 'bg-blue-500/10';
      case 'sdr':
        return 'bg-purple-500/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            Agentes IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure agentes de inteligência artificial para automatizar seu atendimento
          </p>
        </div>
        <Badge variant="secondary" className="w-fit flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {agents.filter(a => a.active).length} agentes ativos
        </Badge>
      </div>

      {/* WhatsApp Connection Card */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Conexão WhatsApp</CardTitle>
                <CardDescription>Conecte seu número para ativar os agentes de WhatsApp</CardDescription>
              </div>
            </div>
            <Badge variant={phoneStatus === 'active' ? 'default' : 'secondary'} className={cn(
              phoneStatus === 'active' && 'bg-green-500 hover:bg-green-600'
            )}>
              {phoneStatus === 'active' ? 'Conectado' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="+55 11 99999-9999"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="flex-1"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={handleConnectWhatsApp}
                      disabled={!whatsappPhone}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Escaneie o QR Code</DialogTitle>
                      <DialogDescription>
                        Abra o WhatsApp no seu celular, vá em Dispositivos conectados e escaneie o código abaixo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-6">
                      {/* QR Code Placeholder */}
                      <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        <div className="text-center space-y-2">
                          <QrCode className="h-24 w-24 mx-auto text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">QR Code será exibido aqui</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Número: <strong>{whatsappPhone}</strong>
                      </p>
                      {phoneStatus === 'active' && (
                        <Badge className="bg-green-500">
                          ✓ Conectado com sucesso!
                        </Badge>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className={cn(
              'transition-all duration-300 hover:shadow-md',
              agent.active && 'ring-2 ring-primary/20 bg-primary/5'
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', getIconBg(agent.type))}>
                  <agent.icon className={cn('h-6 w-6', getIconColor(agent.type))} />
                </div>
                <Switch
                  checked={agent.active}
                  onCheckedChange={() => toggleAgent(agent.id)}
                />
              </div>
              <CardTitle className="text-lg mt-3">{agent.title}</CardTitle>
              <CardDescription className="text-sm">{agent.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {agent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* SDR Específico - Product Selection */}
              {agent.id === 'sdr-especifico' && agent.active && (
                <div className="pt-3 border-t space-y-2">
                  <Label className="text-xs font-medium">Produtos atendidos por IA</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar produtos" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                variant={agent.active ? 'default' : 'outline'} 
                className="w-full"
                size="sm"
              >
                {agent.active ? 'Configurar' : 'Ativar Agente'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Potencialize seu atendimento com IA</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Os agentes de IA trabalham 24/7 para qualificar leads, responder dúvidas e agendar visitas automaticamente.
              </p>
            </div>
            <Button variant="outline" className="flex-shrink-0">
              Saiba mais
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
