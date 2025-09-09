import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface Reservation {
  id: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  special_requests: string | null;
  status: string;
  karaoke_rooms: {
    name: string;
  } | null;
}

interface ReservationCardProps {
  reservation: Reservation;
  onReservationUpdated: () => void;
}

const ReservationCard = ({ reservation, onReservationUpdated }: ReservationCardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm", { locale: ptBR });
  };

  const getDuration = () => {
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    const hours = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  const canCancel = () => {
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart > 2; // Can cancel up to 2 hours before
  };

  const handleCancelReservation = async () => {
    if (!canCancel()) {
      toast({
        title: "Cancelamento não permitido",
        description: "Reservas só podem ser canceladas com pelo menos 2 horas de antecedência.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservation.id);

      if (error) throw error;

      toast({
        title: "Reserva cancelada",
        description: "Sua reserva foi cancelada com sucesso.",
      });

      onReservationUpdated();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (reservation.status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-600">Confirmada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluída</Badge>;
      default:
        return <Badge variant="outline">{reservation.status}</Badge>;
    }
  };

  const isUpcoming = () => {
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    return startTime > now && reservation.status === 'confirmed';
  };

  const isPast = () => {
    const now = new Date();
    const endTime = new Date(reservation.end_time);
    return endTime < now;
  };

  return (
    <Card className={`overflow-hidden shadow-card transition-all duration-300 ${
      isUpcoming() ? 'bg-gradient-card border-primary/30' : 'bg-card'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {reservation.karaoke_rooms?.name || 'Sala não encontrada'}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(reservation.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>
              {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Duração: {getDuration()}h</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="w-4 h-4" />
            <span>R$ {Number(reservation.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {reservation.special_requests && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Solicitações especiais:</p>
            <p className="text-sm">{reservation.special_requests}</p>
          </div>
        )}

        {isUpcoming() && (
          <div className="flex gap-2 pt-2">
            {canCancel() ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelReservation}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Cancelando...' : 'Cancelar Reserva'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3" />
                <span>Cancelamento disponível até 2h antes</span>
              </div>
            )}
          </div>
        )}

        {isPast() && reservation.status === 'confirmed' && (
          <Badge variant="secondary" className="w-full justify-center">
            Sessão concluída
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationCard;