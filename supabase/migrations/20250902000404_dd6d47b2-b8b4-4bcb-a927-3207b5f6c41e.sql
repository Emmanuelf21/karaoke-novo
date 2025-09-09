-- Check and create missing triggers only if they don't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing indexes for better performance (using IF NOT EXISTS)
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

-- Add constraints to prevent invalid data (using IF NOT EXISTS equivalent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_reservation_times') THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT check_reservation_times 
        CHECK (end_time > start_time);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_amount') THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT check_positive_amount 
        CHECK (total_amount > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_capacity') THEN
        ALTER TABLE public.karaoke_rooms 
        ADD CONSTRAINT check_positive_capacity 
        CHECK (capacity > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_positive_rate') THEN
        ALTER TABLE public.karaoke_rooms 
        ADD CONSTRAINT check_positive_rate 
        CHECK (hourly_rate > 0);
    END IF;
END $$;

-- Add timestamp update triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_karaoke_rooms_updated_at') THEN
        CREATE TRIGGER update_karaoke_rooms_updated_at
          BEFORE UPDATE ON public.karaoke_rooms
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;