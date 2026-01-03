import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleDemo = () => {
    localStorage.setItem('is_demo', 'true');
    navigate('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem('is_demo');
    // In real app, this would authenticate
    navigate('/dashboard');
  };

  return (
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
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
            >
              Testar Demonstração
            </Button>

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
  );
}
