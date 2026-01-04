// Mock data for BigHome CRM

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Gerente' | 'Corretor';
  status: 'active' | 'inactive';
  avatar: string;
  leads: number;
  sales: number;
}

export interface Property {
  id: string;
  title: string;
  type: 'Casa' | 'Apartamento' | 'Terreno' | 'Cobertura' | 'Studio';
  address: string;
  price: number;
  status: 'Disponível' | 'Reservado' | 'Vendido';
  bedrooms: number;
  bathrooms: number;
  parking: number;
  area: number;
  description: string;
  image: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyInterest: string;
  agent: string | null;
  agentAvatar: string | null;
  origin: 'WhatsApp' | 'Site' | 'Indicação' | 'Instagram';
  createdAt: string;
  status: 'Novo' | 'Em Espera' | 'Em Atendimento' | 'Documentação' | 'Vendido';
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Ativo' | 'Pausado' | 'Encerrado';
  impressions: number;
  clicks: number;
  leads: number;
  cost: number;
  cpl: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Venda' | 'Comissão' | 'Despesa';
  value: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
}

// Team Members
export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@bighome.com',
    phone: '(11) 99999-1234',
    role: 'Gerente',
    status: 'active',
    avatar: 'JS',
    leads: 45,
    sales: 8,
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@bighome.com',
    phone: '(11) 99888-5678',
    role: 'Corretor',
    status: 'active',
    avatar: 'MS',
    leads: 32,
    sales: 5,
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro.costa@bighome.com',
    phone: '(11) 99777-9012',
    role: 'Corretor',
    status: 'active',
    avatar: 'PC',
    leads: 28,
    sales: 4,
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@bighome.com',
    phone: '(11) 99666-3456',
    role: 'Gerente',
    status: 'active',
    avatar: 'AO',
    leads: 52,
    sales: 10,
  },
  {
    id: '5',
    name: 'Carlos Souza',
    email: 'carlos.souza@bighome.com',
    phone: '(11) 99555-7890',
    role: 'Corretor',
    status: 'inactive',
    avatar: 'CS',
    leads: 15,
    sales: 2,
  },
];

// Properties
export const properties: Property[] = [
  {
    id: '1',
    title: 'Apartamento Garden',
    type: 'Apartamento',
    address: 'Rua das Flores, 123 - Jardins',
    price: 650000,
    status: 'Disponível',
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    area: 120,
    description: 'Lindo apartamento garden com área privativa',
    image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: '2',
    title: 'Casa Alto Padrão',
    type: 'Casa',
    address: 'Alameda Santos, 456 - Alphaville',
    price: 1200000,
    status: 'Disponível',
    bedrooms: 4,
    bathrooms: 3,
    parking: 4,
    area: 280,
    description: 'Casa de alto padrão em condomínio fechado',
    image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: '3',
    title: 'Studio Centro',
    type: 'Studio',
    address: 'Av. Paulista, 789 - Centro',
    price: 320000,
    status: 'Reservado',
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    area: 35,
    description: 'Studio moderno no coração da cidade',
    image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: '4',
    title: 'Cobertura Duplex',
    type: 'Cobertura',
    address: 'Rua Oscar Freire, 321 - Pinheiros',
    price: 2100000,
    status: 'Disponível',
    bedrooms: 5,
    bathrooms: 4,
    parking: 3,
    area: 350,
    description: 'Cobertura duplex com vista panorâmica',
    image: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: '5',
    title: 'Casa Condomínio',
    type: 'Casa',
    address: 'Rua dos Ipês, 654 - Granja Viana',
    price: 890000,
    status: 'Vendido',
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    area: 180,
    description: 'Casa em condomínio com área de lazer completa',
    image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: '6',
    title: 'Terreno 500m²',
    type: 'Terreno',
    address: 'Estrada do Sol, s/n - Cotia',
    price: 180000,
    status: 'Disponível',
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    area: 500,
    description: 'Terreno plano pronto para construir',
    image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
];

// Leads
export const leads: Lead[] = [
  // Leads sem atribuição (agent = null) - Status: Novo
  { id: '13', name: 'Carlos Eduardo Silva', phone: '(11) 98765-2020', email: 'carlos.eduardo@email.com', propertyInterest: 'Apartamento Garden', agent: null, agentAvatar: null, origin: 'WhatsApp', createdAt: '2024-01-18', status: 'Novo' },
  { id: '14', name: 'Beatriz Oliveira', phone: '(11) 98765-3030', email: 'beatriz.oliveira@email.com', propertyInterest: 'Casa Alto Padrão', agent: null, agentAvatar: null, origin: 'Site', createdAt: '2024-01-17', status: 'Novo' },
  { id: '15', name: 'Rafael Souza', phone: '(11) 98765-4040', email: 'rafael.souza@email.com', propertyInterest: 'Studio Centro', agent: null, agentAvatar: null, origin: 'Instagram', createdAt: '2024-01-16', status: 'Novo' },
  { id: '16', name: 'Larissa Mendes', phone: '(11) 98765-5050', email: 'larissa.mendes@email.com', propertyInterest: 'Cobertura Duplex', agent: null, agentAvatar: null, origin: 'Indicação', createdAt: '2024-01-16', status: 'Novo' },
  { id: '17', name: 'Gabriel Ferreira', phone: '(11) 98765-6060', email: 'gabriel.ferreira@email.com', propertyInterest: 'Terreno 500m²', agent: null, agentAvatar: null, origin: 'WhatsApp', createdAt: '2024-01-15', status: 'Novo' },
  // Em Espera
  { id: '1', name: 'Roberto Almeida', phone: '(11) 98765-4321', email: 'roberto@email.com', propertyInterest: 'Apartamento Garden', agent: 'Maria Santos', agentAvatar: 'MS', origin: 'WhatsApp', createdAt: '2024-01-15', status: 'Em Espera' },
  { id: '2', name: 'Fernanda Lima', phone: '(11) 98765-1111', email: 'fernanda@email.com', propertyInterest: 'Casa Alto Padrão', agent: 'Pedro Costa', agentAvatar: 'PC', origin: 'Site', createdAt: '2024-01-14', status: 'Em Espera' },
  { id: '3', name: 'Lucas Mendes', phone: '(11) 98765-2222', email: 'lucas@email.com', propertyInterest: 'Studio Centro', agent: 'João Silva', agentAvatar: 'JS', origin: 'Instagram', createdAt: '2024-01-13', status: 'Em Espera' },
  { id: '4', name: 'Juliana Costa', phone: '(11) 98765-3333', email: 'juliana@email.com', propertyInterest: 'Cobertura Duplex', agent: 'Ana Oliveira', agentAvatar: 'AO', origin: 'Indicação', createdAt: '2024-01-12', status: 'Em Espera' },
  // Em Atendimento
  { id: '5', name: 'Marcos Pereira', phone: '(11) 98765-4444', email: 'marcos@email.com', propertyInterest: 'Casa Condomínio', agent: 'Maria Santos', agentAvatar: 'MS', origin: 'WhatsApp', createdAt: '2024-01-10', status: 'Em Atendimento' },
  { id: '6', name: 'Patricia Souza', phone: '(11) 98765-5555', email: 'patricia@email.com', propertyInterest: 'Apartamento Garden', agent: 'Pedro Costa', agentAvatar: 'PC', origin: 'Site', createdAt: '2024-01-09', status: 'Em Atendimento' },
  { id: '7', name: 'Ricardo Oliveira', phone: '(11) 98765-6666', email: 'ricardo@email.com', propertyInterest: 'Terreno 500m²', agent: 'João Silva', agentAvatar: 'JS', origin: 'Indicação', createdAt: '2024-01-08', status: 'Em Atendimento' },
  { id: '8', name: 'Camila Santos', phone: '(11) 98765-7777', email: 'camila@email.com', propertyInterest: 'Studio Centro', agent: 'Ana Oliveira', agentAvatar: 'AO', origin: 'Instagram', createdAt: '2024-01-07', status: 'Em Atendimento' },
  // Documentação
  { id: '9', name: 'Bruno Ferreira', phone: '(11) 98765-8888', email: 'bruno@email.com', propertyInterest: 'Casa Alto Padrão', agent: 'Maria Santos', agentAvatar: 'MS', origin: 'WhatsApp', createdAt: '2024-01-05', status: 'Documentação' },
  { id: '10', name: 'Amanda Rocha', phone: '(11) 98765-9999', email: 'amanda@email.com', propertyInterest: 'Cobertura Duplex', agent: 'Pedro Costa', agentAvatar: 'PC', origin: 'Site', createdAt: '2024-01-04', status: 'Documentação' },
  // Vendido
  { id: '11', name: 'Thiago Martins', phone: '(11) 98765-0000', email: 'thiago@email.com', propertyInterest: 'Apartamento Garden', agent: 'João Silva', agentAvatar: 'JS', origin: 'Indicação', createdAt: '2024-01-02', status: 'Vendido' },
  { id: '12', name: 'Isabela Nunes', phone: '(11) 98765-1010', email: 'isabela@email.com', propertyInterest: 'Casa Condomínio', agent: 'Ana Oliveira', agentAvatar: 'AO', origin: 'WhatsApp', createdAt: '2024-01-01', status: 'Vendido' },
];

// Campaigns
export const campaigns: Campaign[] = [
  { id: '1', name: 'Lançamento Jardins Premium', status: 'Ativo', impressions: 15420, clicks: 623, leads: 78, cost: 1250, cpl: 16.03 },
  { id: '2', name: 'Apartamentos Centro SP', status: 'Ativo', impressions: 12350, clicks: 498, leads: 62, cost: 980, cpl: 15.81 },
  { id: '3', name: 'Casas Alto Padrão', status: 'Pausado', impressions: 8900, clicks: 356, leads: 45, cost: 890, cpl: 19.78 },
  { id: '4', name: 'Studios Investimento', status: 'Ativo', impressions: 6200, clicks: 248, leads: 35, cost: 720, cpl: 20.57 },
  { id: '5', name: 'Terrenos Cotia', status: 'Encerrado', impressions: 2410, clicks: 122, leads: 14, cost: 489, cpl: 34.93 },
];

// Transactions
export const transactions: Transaction[] = [
  { id: '1', date: '2024-01-15', description: 'Venda Apartamento Garden - Cliente Roberto', type: 'Venda', value: 19500, status: 'Pago' },
  { id: '2', date: '2024-01-14', description: 'Comissão Maria Santos - Venda AP Garden', type: 'Comissão', value: 5850, status: 'Pendente' },
  { id: '3', date: '2024-01-13', description: 'Marketing Digital - Meta Ads', type: 'Despesa', value: 2500, status: 'Pago' },
  { id: '4', date: '2024-01-12', description: 'Venda Casa Condomínio - Cliente Thiago', type: 'Venda', value: 26700, status: 'Pago' },
  { id: '5', date: '2024-01-10', description: 'Comissão João Silva - Venda Casa', type: 'Comissão', value: 8010, status: 'Atrasado' },
  { id: '6', date: '2024-01-08', description: 'Fotografia Imóveis', type: 'Despesa', value: 800, status: 'Pago' },
  { id: '7', date: '2024-01-05', description: 'Venda Studio Centro - Cliente Lucas', type: 'Venda', value: 9600, status: 'Pendente' },
  { id: '8', date: '2024-01-03', description: 'Aluguel Escritório', type: 'Despesa', value: 3500, status: 'Pago' },
];

// Chart Data
export const leadsVsSalesData = [
  { month: 'Ago', leads: 145, sales: 5 },
  { month: 'Set', leads: 178, sales: 7 },
  { month: 'Out', leads: 192, sales: 8 },
  { month: 'Nov', leads: 215, sales: 9 },
  { month: 'Dez', leads: 234, sales: 11 },
  { month: 'Jan', leads: 247, sales: 12 },
];

export const revenueData = [
  { month: 'Ago', revenue: 32500 },
  { month: 'Set', revenue: 38200 },
  { month: 'Out', revenue: 41800 },
  { month: 'Nov', revenue: 39500 },
  { month: 'Dez', revenue: 52300 },
  { month: 'Jan', revenue: 45800 },
];

export const campaignPerformance = [
  { name: 'Jardins Premium', leads: 78, cost: 1250 },
  { name: 'Centro SP', leads: 62, cost: 980 },
  { name: 'Alto Padrão', leads: 45, cost: 890 },
  { name: 'Studios', leads: 35, cost: 720 },
];
