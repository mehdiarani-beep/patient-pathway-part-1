-- Create function to generate unique slug from last_name
CREATE OR REPLACE FUNCTION public.generate_physician_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate slug if it's null/empty or last_name changed on update
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    IF TG_OP = 'UPDATE' AND OLD.last_name = NEW.last_name THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Convert last_name to lowercase, remove special characters
  base_slug := lower(regexp_replace(NEW.last_name, '[^a-zA-Z0-9]', '', 'g'));
  
  final_slug := base_slug;
  
  -- Check if slug exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.clinic_physicians WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;