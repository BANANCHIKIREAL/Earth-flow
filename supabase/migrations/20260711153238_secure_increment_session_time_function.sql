CREATE OR REPLACE FUNCTION public.increment_session_time(p_user_id uuid, p_seconds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_seconds IS NULL OR p_seconds < 0 OR p_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid seconds';
  END IF;

  UPDATE public.user_profiles
  SET total_time_seconds = total_time_seconds + p_seconds,
      last_seen_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_session_time(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_session_time(uuid, integer) TO authenticated;
