-- Required for .upsert(..., { onConflict: 'specialist_id,slot_datetime' }) on specialist_availability.

CREATE UNIQUE INDEX IF NOT EXISTS idx_specialist_availability_specialist_slot
  ON public.specialist_availability (specialist_id, slot_datetime);
