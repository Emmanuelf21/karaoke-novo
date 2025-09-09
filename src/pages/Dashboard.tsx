import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoomCard from '@/components/RoomCard';
import ReservationModal from '@/components/ReservationModal';
import ReservationCard from '@/components/ReservationCard';
import AdminPanel from '@/components/AdminPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Calendar, User, Settings, LogOut, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  hourly_rate: number;
  features: string[];
  image_url: string | null;
  is_active: boolean;
}

interface Reservation {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  special_requests: string | null;
  karaoke_rooms: {
    name: string;
  } | null;
}

const Dashboard = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('karaoke_rooms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Erro ao carregar salas",
        description: "Não foi possível carregar as salas disponíveis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          karaoke_rooms:room_id (name)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'confirmed')
        .gte('end_time', new Date().toISOString())
        .order('start_time');

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleReserve = (room: Room) => {
    setSelectedRoom(room);
    setIsReservationModalOpen(true);
  };

  const handleReservationCreated = () => {
    fetchReservations();
  };

  const handleReservationUpdated = () => {
    fetchReservations();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground mb-4">
            Você precisa estar logado para acessar esta página.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Karaoke Jam
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{profile?.full_name || user?.email}</span>
                {isAdmin && (
                  <Badge variant="default" className="ml-2">Admin</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">
              Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
            </h2>
            {isAdmin && (
              <Badge variant="default" className="bg-primary">
                <Settings className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Gerencie salas e acompanhe as reservas do sistema."
              : "Reserve sua sala de karaokê favorita e faça uma apresentação inesquecível!"
            }
          </p>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="mb-8">
            <AdminPanel />
          </div>
        )}

        {/* Current Reservations */}
        {reservations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Suas Reservas
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onReservationUpdated={handleReservationUpdated}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Rooms */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Salas Disponíveis</h3>
          {rooms.length === 0 ? (
            <Card className="p-8 text-center bg-gradient-card">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma sala disponível</h3>
              <p className="text-muted-foreground mb-4">
                Não há salas disponíveis no momento. 
                {isAdmin && " Você pode adicionar novas salas no painel administrativo."}
              </p>
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">
                  Tente novamente mais tarde ou entre em contato conosco.
                </p>
              )}
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reservation Modal */}
        <ReservationModal
          room={selectedRoom}
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedRoom(null);
          }}
          onReservationCreated={handleReservationCreated}
        />
      </div>
    </div>
  );
};

export default Dashboard;