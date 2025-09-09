import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Star } from 'lucide-react';

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

interface RoomCardProps {
  room: Room;
  onReserve: (room: Room) => void;
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

const RoomCard = ({ room, onReserve }: RoomCardProps) => {
  return (
    <Card className="overflow-hidden shadow-card bg-gradient-card hover:shadow-intense transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48 bg-muted overflow-hidden">
        {room.image_url ? (
          <img 
            src={room.image_url} 
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
            <Star className="w-12 h-12 text-primary-foreground" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-background/80 text-foreground">
            R$ {room.hourly_rate.toFixed(2)}/h
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{room.name}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{room.capacity}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {room.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {room.features.slice(0, 4).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {featureLabels[feature] || feature}
            </Badge>
          ))}
          {room.features.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{room.features.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Disponível</span>
          </div>
          <Button
            variant="neon"
            size="sm"
            onClick={() => onReserve(room)}
          >
            Reservar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;