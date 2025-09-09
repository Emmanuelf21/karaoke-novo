import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Clock, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalRooms: number;
  activeRooms: number;
  totalReservations: number;
  todayReservations: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
}

interface RecentReservation {
  id: string;
  start_time: string;
  total_amount: number;
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
  karaoke_rooms: {
    name: string;
  } | null;
}

const AdminPanel = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalRooms: 0,
    activeRooms: 0,
    totalReservations: 0,
    todayReservations: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
  });
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminStats();
    fetchRecentReservations();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch room stats
      const { data: roomsData } = await supabase
        .from('karaoke_rooms')
        .select('id, is_active');

      // Fetch reservation stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('id, start_time, total_amount, status');

      if (roomsData && reservationsData) {
        const totalRooms = roomsData.length;
        const activeRooms = roomsData.filter(room => room.is_active).length;
        const totalReservations = reservationsData.length;
        
        const todayReservations = reservationsData.filter(reservation => 
          new Date(reservation.start_time) >= today && 
          reservation.status === 'confirmed'
        ).length;

        const weeklyReservations = reservationsData.filter(reservation => 
          new Date(reservation.start_time) >= weekAgo && 
          reservation.status === 'confirmed'
        );
        
        const monthlyReservations = reservationsData.filter(reservation => 
          new Date(reservation.start_time) >= monthAgo && 
          reservation.status === 'confirmed'
        );

        const weeklyRevenue = weeklyReservations.reduce((sum, reservation) => 
          sum + Number(reservation.total_amount), 0
        );
        
        const monthlyRevenue = monthlyReservations.reduce((sum, reservation) => 
          sum + Number(reservation.total_amount), 0
        );

        setStats({
          totalRooms,
          activeRooms,
          totalReservations,
          todayReservations,
          weeklyRevenue,
          monthlyRevenue,
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar as estatísticas administrativas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          start_time,
          total_amount,
          user_id,
          karaoke_rooms:room_id (name)
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch user profiles separately for the reservations
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const enrichedReservations = data.map(reservation => ({
          ...reservation,
          profiles: profilesMap.get(reservation.user_id) || null,
        }));

        setRecentReservations(enrichedReservations);
      } else {
        setRecentReservations([]);
      }
    } catch (error) {
      console.error('Error fetching recent reservations:', error);
      setRecentReservations([]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>      
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Painel Administrativo</h2>
        <Badge variant="default" className="bg-primary">
          <Eye className="w-3 h-3 mr-1" />
          Admin View
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Salas</p>
                <p className="text-2xl font-bold">{stats.totalRooms}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeRooms} ativas
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reservas Hoje</p>
                <p className="text-2xl font-bold">{stats.todayReservations}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalReservations} total
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Semanal</p>
                <p className="text-2xl font-bold">R$ {stats.weeklyRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-500">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Esta semana
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Mensal</p>
                <p className="text-2xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reservations */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Reservas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma reserva recente encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {recentReservations.map((reservation) => (
                <div 
                  key={reservation.id} 
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {reservation.karaoke_rooms?.name || 'Sala não encontrada'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.profiles?.full_name || 'Cliente'} - {' '}
                      {new Date(reservation.start_time).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="outline">
                    R$ {Number(reservation.total_amount).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;