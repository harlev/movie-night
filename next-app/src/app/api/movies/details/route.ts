import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createMetadataSnapshot, fetchMovieVideos, getMovieDetails } from '@/lib/services/tmdb';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tmdbIdParam = request.nextUrl.searchParams.get('tmdbId');
  if (!tmdbIdParam) {
    return NextResponse.json({ error: 'Missing tmdbId' }, { status: 400 });
  }

  const tmdbId = Number.parseInt(tmdbIdParam, 10);
  if (Number.isNaN(tmdbId)) {
    return NextResponse.json({ error: 'Invalid tmdbId' }, { status: 400 });
  }

  try {
    const details = await getMovieDetails(tmdbId);
    if (!details) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const trailerKey = await fetchMovieVideos(tmdbId);
    return NextResponse.json({
      id: details.id,
      title: details.title,
      metadata: createMetadataSnapshot(details, trailerKey),
    });
  } catch (error) {
    console.error('TMDb details error:', error);
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 });
  }
}
