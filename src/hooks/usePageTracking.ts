import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PageTrackingOptions {
  pageType: 'landing_page' | 'quiz_standard' | 'quiz_chat' | 'physician_profile';
  pageName: string; // e.g., "Nasal Assessment"
  doctorId?: string;
  physicianId?: string;
  clinicId?: string;
  physicianName?: string; // e.g., "Dr. Vaughn"
  clinicName?: string; // e.g., "Exhale Sinus"
}

// Generate a unique visitor ID if not exists
function getVisitorId(): string {
  const key = 'pp_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

// Generate a session ID (expires on browser close via sessionStorage)
function getSessionId(): string {
  const key = 'pp_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export function usePageTracking(options: PageTrackingOptions) {
  const [searchParams] = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackPageView = async () => {
      try {
        // Build the full page name with physician/clinic context
        let fullPageName = options.pageName;
        if (options.physicianName) {
          fullPageName = `${options.pageName} - ${options.physicianName}`;
        } else if (options.clinicName) {
          fullPageName = `${options.pageName} - ${options.clinicName}`;
        }

        // Extract UTM parameters
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');

        const payload = {
          pageType: options.pageType,
          pageName: fullPageName,
          pageUrl: window.location.href,
          doctorId: options.doctorId,
          physicianId: options.physicianId,
          clinicId: options.clinicId,
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
          referrerUrl: document.referrer || null,
          utmSource,
          utmMedium,
          utmCampaign
        };

        const { error } = await supabase.functions.invoke('track-page-view', {
          body: payload
        });

        if (error) {
          console.error('Error tracking page view:', error);
        }
      } catch (err) {
        console.error('Failed to track page view:', err);
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(trackPageView, 100);
    return () => clearTimeout(timer);
  }, [options.pageName, options.pageType, options.doctorId, options.physicianId, options.clinicId, options.physicianName, options.clinicName, searchParams]);
}
