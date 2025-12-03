import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ShortLinkRedirect() {
  const { shortId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!shortId) {
        navigate('/404');
        return;
      }

      // Fetch the link mapping
      const { data, error: fetchError } = await supabase
        .from('link_mappings')
        .select('doctor_id, quiz_type, custom_quiz_id, lead_source')
        .eq('short_id', shortId)
        .single();

      if (fetchError || !data) {
        console.error('Short link not found:', fetchError);
        setError(true);
        setTimeout(() => navigate('/404'), 1500);
        return;
      }
      
      // Update click count (fire and forget)
      supabase.rpc('increment_link_click', { p_short_id: shortId }).then(({ error: rpcError }) => {
        if (rpcError) console.error('Failed to increment click count:', rpcError);
      });

      // Build redirect URL
      let redirectUrl: string;
      const source = data.lead_source || 'shortlink';
      
      if (data.custom_quiz_id) {
        redirectUrl = `/custom-quiz/${data.custom_quiz_id}?doctor=${data.doctor_id}&source=${source}`;
      } else {
        const quizType = data.quiz_type || 'nose';
        redirectUrl = `/share/${quizType}/${data.doctor_id}?source=${source}`;
      }
      
      navigate(redirectUrl, { replace: true });
    };

    fetchAndRedirect();
  }, [shortId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Link not found. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-muted-foreground">Redirecting…</span>
    </div>
  );
}
