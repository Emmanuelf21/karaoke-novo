-- Fix missing trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON public.reservations(start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON public.reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_rooms_active ON public.karaoke_rooms(is_active);

-- Add composite index for reservation conflicts check
CREATE INDEX IF NOT EXISTS idx_reservations_room_time_status 
ON public.reservations(room_id, start_time, end_time, status);

-- Add constraints to prevent invalid data
ALTER TABLE public.reservations 
ADD CONSTRAINT check_reservation_times 
CHECK (end_time > start_time);

ALTER TABLE public.reservations 
ADD CONSTRAINT check_positive_amount 
CHECK (total_amount > 0);

ALTER TABLE public.karaoke_rooms 
ADD CONSTRAINT check_positive_capacity 
CHECK (capacity > 0);

ALTER TABLE public.karaoke_rooms 
ADD CONSTRAINT check_positive_rate 
CHECK (hourly_rate > 0);

-- Add trigger to automatically update timestamps
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_karaoke_rooms_updated_at
  BEFORE UPDATE ON public.karaoke_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();