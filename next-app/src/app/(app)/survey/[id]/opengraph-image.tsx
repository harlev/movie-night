import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const alt = 'Movie Night Survey';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: survey } = await supabase
    .from('surveys')
    .select('title, description, closes_at, state')
    .eq('id', id)
    .single();

  const title = survey?.title || 'Movie Night Survey';

  let countdown = 'Vote Now!';
  if (survey?.closes_at) {
    const diff = new Date(survey.closes_at).getTime() - Date.now();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      countdown = `Closes in ${parts.join(' ')}`;
    } else {
      countdown = 'Voting Closed';
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0d0f',
          color: '#ffffff',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative accent lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #d4a053 0%, #b8862d 50%, #d4a053 100%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #d4a053 0%, #b8862d 50%, #d4a053 100%)',
            display: 'flex',
          }}
        />

        {/* Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#d4a053',
              letterSpacing: '8px',
              textTransform: 'uppercase',
            }}
          >
            Movie Night
          </div>
        </div>

        {/* Survey title */}
        <div
          style={{
            fontSize: title.length > 30 ? '64px' : '80px',
            fontWeight: 700,
            textAlign: 'center',
            maxWidth: '1080px',
            lineHeight: 1.15,
            marginBottom: '40px',
            display: 'flex',
          }}
        >
          {title}
        </div>

        {/* Countdown / CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '18px 52px',
            borderRadius: '14px',
            backgroundColor: 'rgba(212, 160, 83, 0.15)',
            border: '2px solid #d4a053',
          }}
        >
          <div
            style={{
              fontSize: '38px',
              fontWeight: 600,
              color: '#d4a053',
              display: 'flex',
            }}
          >
            {countdown}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
