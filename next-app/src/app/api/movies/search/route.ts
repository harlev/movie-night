import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchMovies } from '@/lib/services/tmdb';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const result = await searchMovies(query);
    return NextResponse.json(result.movies);
  } catch (error) {
    console.error('TMDb search error:', error);
    return NextResponse.json({ error: 'Failed to search movies' }, { status: 500 });
  }
}
