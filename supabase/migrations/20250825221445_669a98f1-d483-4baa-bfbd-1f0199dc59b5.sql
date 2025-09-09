-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create karaoke_rooms table
CREATE TABLE public.karaoke_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate >= 0),
    features TEXT[], -- Array of features like 'microphones', 'disco_lights', 'sound_system'
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create reservations table
CREATE TABLE public.reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES public.karaoke_rooms(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karaoke_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = is_admin.user_id
    AND profiles.role = 'admin'
  );
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Karaoke rooms policies
CREATE POLICY "Everyone can view active rooms" ON public.karaoke_rooms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all rooms" ON public.karaoke_rooms
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert rooms" ON public.karaoke_rooms
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms" ON public.karaoke_rooms
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete rooms" ON public.karaoke_rooms
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Reservations policies
CREATE POLICY "Users can view their own reservations" ON public.reservations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON public.reservations
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own reservations" ON public.reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" ON public.reservations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any reservation" ON public.reservations
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_karaoke_rooms_updated_at
    BEFORE UPDATE ON public.karaoke_rooms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.karaoke_rooms (name, description, capacity, hourly_rate, features, is_active) VALUES
('Studio A - VIP', 'Luxurious private karaoke room with premium sound system and disco lighting', 8, 50.00, ARRAY['premium_sound', 'disco_lights', 'bar_service', 'microphones', 'tambourine'], true),
('Studio B - Party Room', 'Perfect for groups! Spacious room with dance floor and party lighting', 12, 75.00, ARRAY['dance_floor', 'party_lights', 'sound_system', 'microphones', 'fog_machine'], true),
('Studio C - Intimate', 'Cozy room perfect for couples or small groups', 4, 35.00, ARRAY['ambient_lighting', 'sound_system', 'microphones'], true),
('Studio D - Classic', 'Traditional karaoke experience with classic setup', 6, 40.00, ARRAY['sound_system', 'microphones', 'stage_lights'], true);