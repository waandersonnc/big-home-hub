import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { demoStore } from '@/lib/demoStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import TokenVerificationModal from '@/components/TokenVerificationModal';

interface OwnerData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Token verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);

  const handleDemo = async () => {
    localStorage.removeItem('is_demo');
    demoStore.activate();
    navigate('/painel');
    toast({
      title: "Modo Demonstrativo",
      description: "Você está acessando uma versão de demonstração.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha e-mail e senha para continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    localStorage.removeItem('is_demo');
    demoStore.deactivate();

    try {
      // 1. Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Falha ao autenticar usuário.");
      }

      logger.debug('Login bem-sucedido, verificando tipo de usuário');
      setIsChecking(true);

      // 2. Check if user is an owner
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('id, full_name, phone, email, validoutoken')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (ownerError) {
        logger.error('Erro ao buscar owner:', ownerError.message);
      }

      if (owner) {
        logger.debug('Usuário é owner, validoutoken:', owner.validoutoken);

        // 3. Check if token was validated
        if (owner.validoutoken === false) {
          // Show verification modal
          setOwnerData({
            id: owner.id,
            full_name: owner.full_name || '',
            phone: owner.phone || '',
            email: owner.email || email
          });
          setShowVerificationModal(true);
          setIsLoading(false);
          setIsChecking(false);
          return;
        }

        // Owner is verified, proceed to dashboard
        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso.",
        });
        navigate('/painel');
        return;
      }

      // 4. Check if user is in users table (manager/broker)
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id, user_type, full_name')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (staffError) {
        logger.error('Erro ao buscar staff:', staffError.message);
      }

      if (staff) {
        // Validate user_type is manager or broker
        if (staff.user_type !== 'manager' && staff.user_type !== 'broker') {
          logger.error('Tipo de usuário inválido:', staff.user_type);
          toast({
            title: "Tipo de conta inválido",
            description: "Seu tipo de conta não é reconhecido. Entre em contato com o suporte.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }

        const roleLabel = staff.user_type === 'manager' ? 'Gerente' : 'Corretor';

        toast({
          title: `Bem-vindo, ${staff.full_name || roleLabel}!`,
          description: `Acesso como ${roleLabel} liberado.`,
        });
        navigate('/painel');
        return;
      }

      // User not found in any table - sign out
      logger.error('Usuário autenticado mas não encontrado nas tabelas owners ou users');
      toast({
        title: "Conta não encontrada",
        description: "Não foi possível identificar sua conta. Verifique suas credenciais ou entre em contato com o suporte.",
        variant: "destructive"
      });
      await supabase.auth.signOut();

    } catch (error) {
      const err = error as Error;
      logger.error('Erro no login:', err.message);

      let errorMessage = "Verifique suas credenciais e tente novamente.";
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = "E-mail ou senha incorretos.";
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = "E-mail não confirmado. Verifique sua caixa de entrada.";
      }

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    toast({
      title: "Conta verificada!",
      description: "Seja bem-vindo ao BigHome Hub.",
    });
    navigate('/painel');
  };

  return (
    <>
      {/* Token Verification Modal */}
      {showVerificationModal && ownerData && (
        <TokenVerificationModal
          isOpen={showVerificationModal}
          ownerData={ownerData}
          onSuccess={handleVerificationSuccess}
        />
      )}

      {/* Loading overlay when checking user type */}
      {isChecking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando sua conta...</p>
          </div>
        </div>
      )}

      <div className="min-h-screen flex">
        {/* Left side - Gradient (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm overflow-hidden">
                  <img src="/logo.png" alt="BigHome Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-2xl font-bold">BigHome</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                Simples e organizado
              </h1>
              <p className="text-xl text-primary-foreground/80 max-w-md">
                Tudo para seu negócio imobiliário em um só lugar.
              </p>
            </div>

            <div className="space-y-6 max-w-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex-shrink-0">
                  <span className="text-lg font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Gerencie seus leads</h3>
                  <p className="text-sm text-primary-foreground/70">Acompanhe cada oportunidade do primeiro contato até a venda.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex-shrink-0">
                  <span className="text-lg font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Organize sua equipe</h3>
                  <p className="text-sm text-primary-foreground/70">Distribua leads e acompanhe a performance de cada corretor.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm flex-shrink-0">
                  <span className="text-lg font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Analise resultados</h3>
                  <p className="text-sm text-primary-foreground/70">Métricas claras para tomar decisões mais inteligentes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
                  <img src="/logo.png" alt="BigHome Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-2xl font-bold text-foreground">BigHome</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Simples e organizado, tudo para seu negócio imobiliário.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
                <p className="text-muted-foreground">Entre na sua conta para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/recuperar-senha')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleDemo}
                disabled={isLoading}
              >
                Testar Demonstração
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-4">
                Não tem uma conta?{' '}
                <button
                  onClick={() => navigate('/cadastro')}
                  className="text-primary font-semibold hover:underline"
                  disabled={isLoading}
                >
                  Criar conta
                </button>
              </p>

              <p className="text-center text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos{' '}
                <span className="text-primary cursor-pointer hover:underline">Termos de Uso</span>
                {' '}e{' '}
                <span className="text-primary cursor-pointer hover:underline">Política de Privacidade</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
