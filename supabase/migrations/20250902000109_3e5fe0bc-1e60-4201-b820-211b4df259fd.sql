-- Create function to automatically update expired reservations to completed status
CREATE OR REPLACE FUNCTION public.update_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reservations
  SET status = 'completed', updated_at = now()
  WHERE status = 'confirmed'
    AND end_time < now();
END;
$$;

-- Create a function to check for reservation conflicts
CREATE OR REPLACE FUNCTION public.check_reservation_conflict(
  p_room_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_reservation_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count integer;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM public.reservations
  WHERE room_id = p_room_id
    AND status = 'confirmed'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
    AND (p_reservation_id IS NULL OR id != p_reservation_id);
  
  RETURN conflict_count > 0;
END;
$$;