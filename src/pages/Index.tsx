import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mic, Star, Users, Clock } from 'lucide-react';
import heroImage from '@/assets/karaoke-hero.jpg';

const Index = () => {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 animate-neon-pulse text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Karaoke room with vibrant lighting" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Music className="w-16 h-16 text-primary animate-neon-pulse mr-4" />
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Karaoke Jam
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-foreground mb-8 opacity-90">
            Reserve sua sala de karaokê dos sonhos e cante como uma estrela
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="hero" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = '/auth'}
            >
              <Mic className="w-5 h-5 mr-2" />
              Começar agora
            </Button>
            <Button 
              size="lg" 
              variant="stage" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver salas
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Experiência Premium</h2>
            <p className="text-xl text-muted-foreground">
              Salas equipadas com a melhor tecnologia para sua performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-card bg-gradient-card hover:shadow-intense transition-all duration-300">
              <CardHeader className="text-center">
                <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
                <CardTitle>Salas Premium</CardTitle>
                <CardDescription>
                  Ambientes luxuosos com iluminação LED e decoração temática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Sistema de som profissional</li>
                  <li>• Iluminação disco e neon</li>
                  <li>• Serviço de bar incluso</li>
                  <li>• Máquina de fumaça</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card hover:shadow-intense transition-all duration-300">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-accent" />
                <CardTitle>Para Todos os Grupos</CardTitle>
                <CardDescription>
                  Salas de diferentes tamanhos para qualquer ocasião
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Salas íntimas (2-4 pessoas)</li>
                  <li>• Salas familiares (6-8 pessoas)</li>
                  <li>• Salas para festas (10-12 pessoas)</li>
                  <li>• Pista de dança incluída</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card hover:shadow-intense transition-all duration-300">
              <CardHeader className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-neon-blue" />
                <CardTitle>Reserva Fácil</CardTitle>
                <CardDescription>
                  Sistema online simples e seguro para suas reservas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Reserva imediata online</li>
                  <li>• Pagamento seguro</li>
                  <li>• Cancelamento flexível</li>
                  <li>• Suporte 24/7</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para brilhar no palco?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Crie sua conta e reserve sua primeira sala em minutos
          </p>
          <Button 
            size="lg" 
            variant="neon" 
            className="text-lg px-12 py-6"
            onClick={() => window.location.href = '/auth'}
          >
            <Mic className="w-5 h-5 mr-2" />
            Criar conta grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Music className="w-6 h-6 text-primary mr-2" />
            <span className="font-bold">Karaoke Jam</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Karaoke Jam. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
