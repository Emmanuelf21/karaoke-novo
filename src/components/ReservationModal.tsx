import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Users, CreditCard, Star } from 'lucide-react';
import { format, addHours, setHours, setMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface ReservationModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onReservationCreated: () => void;
}

const featureLabels: Record<string, string> = {
  premium_sound: 'Som Premium',
  disco_lights: 'Luzes de Discoteca',
  bar_service: 'Serviço de Bar',
  microphones: 'Microfones',
  tambourine: 'Pandeiro',
  dance_floor: 'Pista de Dança',
  party_lights: 'Luzes de Festa',
  sound_system: 'Sistema de Som',
  fog_machine: 'Máquina de Fumaça',
  ambient_lighting: 'Iluminação Ambiente',
  stage_lights: 'Luzes de Palco'
};

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const ReservationModal = ({ room, isOpen, onClose, onReservationCreated }: ReservationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotal = () => {
    if (!room) return 0;
    return room.hourly_rate * duration;
  };

  const createStartDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return setMinutes(setHours(date, hours), minutes);
  };

  const validateReservation = () => {
    if (!selectedDate || !startTime || !user) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return false;
    }

    const now = new Date();
    const reservationStart = createStartDateTime(selectedDate, startTime);
    
    if (isBefore(reservationStart, now)) {
      toast({
        title: "Data inválida",
        description: "Não é possível fazer reservas para horários no passado.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateReservation() || !room || !user) return;

    setIsLoading(true);
    try {
      const startDateTime = createStartDateTime(selectedDate!, startTime);
      const endDateTime = addHours(startDateTime, duration);
      const totalAmount = calculateTotal();

      // Check for conflicts using database function
      const { data: hasConflict, error: conflictError } = await supabase
        .rpc('check_reservation_conflict', {
          p_room_id: room.id,
          p_start_time: startDateTime.toISOString(),
          p_end_time: endDateTime.toISOString()
        });

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError);
        throw new Error('Erro ao verificar disponibilidade');
      }

      if (hasConflict) {
        toast({
          title: "Horário indisponível",
          description: "Já existe uma reserva para este horário. Por favor, escolha outro.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create reservation
      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          room_id: room.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          total_amount: totalAmount,
          special_requests: specialRequests.trim() || null,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Reserva criada com sucesso!",
        description: `Sua reserva para ${room.name} foi confirmada.`,
      });

      onReservationCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Erro ao criar reserva",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime('');
    setDuration(2);
    setSpecialRequests('');
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reservar {room.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Room Info */}
          <div className="space-y-4">
            <Card className="bg-gradient-card">
              <div className="relative h-32 bg-muted overflow-hidden rounded-t-lg">
                {room.image_url ? (
                  <img 
                    src={room.image_url} 
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{room.name}</span>
                  <Badge variant="secondary">
                    R$ {room.hourly_rate.toFixed(2)}/h
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Capacidade: {room.capacity} pessoas</span>
                </div>

                {room.description && (
                  <p className="text-sm text-muted-foreground">
                    {room.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {room.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {featureLabels[feature] || feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservation Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data da reserva</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => 
                      isBefore(date, startOfDay(new Date()))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário de início</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração (horas)</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} {hours === 1 ? 'hora' : 'horas'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Solicitações especiais (opcional)</Label>
              <Textarea
                placeholder="Descreva qualquer solicitação especial..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor por hora:</span>
                    <span>R$ {room.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duração:</span>
                    <span>{duration} {duration === 1 ? 'hora' : 'horas'}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total:</span>
                    <span>R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="neon"
                onClick={handleSubmit}
                className="flex-1"
                disabled={isLoading || !selectedDate || !startTime}
              >
                {isLoading ? 'Criando...' : 'Confirmar Reserva'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;