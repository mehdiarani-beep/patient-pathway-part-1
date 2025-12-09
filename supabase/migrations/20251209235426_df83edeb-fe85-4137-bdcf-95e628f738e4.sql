-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS set_physician_slug ON public.clinic_physicians;
CREATE TRIGGER set_physician_slug
BEFORE INSERT OR UPDATE ON public.clinic_physicians
FOR EACH ROW
EXECUTE FUNCTION public.generate_physician_slug();

-- Backfill existing physicians with slugs based on last_name
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN SELECT id, last_name FROM public.clinic_physicians WHERE slug IS NULL LOOP
    base_slug := lower(regexp_replace(rec.last_name, '[^a-zA-Z0-9]', '', 'g'));
    final_slug := base_slug;
    counter := 0;
    
    WHILE EXISTS (SELECT 1 FROM public.clinic_physicians WHERE slug = final_slug AND id != rec.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || counter;
    END LOOP;
    
    UPDATE public.clinic_physicians SET slug = final_slug WHERE id = rec.id;
  END LOOP;
END $$;