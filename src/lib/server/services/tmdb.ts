const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDbMovie {
	id: number;
	title: string;
	poster_path: string | null;
	release_date: string | null;
	overview: string | null;
	vote_average: number;
	genre_ids: number[];
}

export interface TMDbMovieDetails extends Omit<TMDbMovie, 'genre_ids'> {
	genres: Array<{ id: number; name: string }>;
	runtime: number | null;
	tagline: string | null;
}

export interface TMDbSearchResponse {
	page: number;
	results: TMDbMovie[];
	total_pages: number;
	total_results: number;
}

const GENRE_MAP: Record<number, string> = {
	28: 'Action',
	12: 'Adventure',
	16: 'Animation',
	35: 'Comedy',
	80: 'Crime',
	99: 'Documentary',
	18: 'Drama',
	10751: 'Family',
	14: 'Fantasy',
	36: 'History',
	27: 'Horror',
	10402: 'Music',
	9648: 'Mystery',
	10749: 'Romance',
	878: 'Science Fiction',
	10770: 'TV Movie',
	53: 'Thriller',
	10752: 'War',
	37: 'Western'
};

export async function searchMovies(
	apiKey: string,
	query: string,
	page: number = 1
): Promise<{ movies: TMDbMovie[]; totalPages: number; totalResults: number }> {
	const url = new URL(`${TMDB_BASE_URL}/search/movie`);
	url.searchParams.set('api_key', apiKey);
	url.searchParams.set('query', query);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('include_adult', 'false');

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`TMDb API error: ${response.status}`);
	}

	const data: TMDbSearchResponse = await response.json();

	return {
		movies: data.results,
		totalPages: data.total_pages,
		totalResults: data.total_results
	};
}

export async function getMovieDetails(
	apiKey: string,
	tmdbId: number
): Promise<TMDbMovieDetails | null> {
	const url = new URL(`${TMDB_BASE_URL}/movie/${tmdbId}`);
	url.searchParams.set('api_key', apiKey);

	const response = await fetch(url.toString());
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error(`TMDb API error: ${response.status}`);
	}

	return response.json();
}

export function mapGenreIds(genreIds: number[]): string[] {
	return genreIds.map((id) => GENRE_MAP[id]).filter(Boolean);
}

interface TMDbVideo {
	key: string;
	site: string;
	type: string;
	official: boolean;
}

interface TMDbVideosResponse {
	results: TMDbVideo[];
}

export async function fetchMovieVideos(apiKey: string, tmdbId: number): Promise<string | null> {
	const url = new URL(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`);
	url.searchParams.set('api_key', apiKey);

	const response = await fetch(url.toString());
	if (!response.ok) {
		return null;
	}

	const data: TMDbVideosResponse = await response.json();
	const youtubeVideos = data.results.filter((v) => v.site === 'YouTube');

	// Prefer official trailers, then any trailer, then teasers
	const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer' && v.official);
	if (officialTrailer) return officialTrailer.key;

	const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
	if (anyTrailer) return anyTrailer.key;

	const teaser = youtubeVideos.find((v) => v.type === 'Teaser');
	if (teaser) return teaser.key;

	return null;
}

export function createMetadataSnapshot(
	movie: TMDbMovie | TMDbMovieDetails,
	trailerKey: string | null = null
): {
	posterPath: string | null;
	releaseDate: string | null;
	overview: string | null;
	voteAverage: number | null;
	genres: string[];
	trailerKey: string | null;
} {
	const genres =
		'genres' in movie
			? movie.genres.map((g) => g.name)
			: 'genre_ids' in movie
				? mapGenreIds(movie.genre_ids)
				: [];

	return {
		posterPath: movie.poster_path,
		releaseDate: movie.release_date,
		overview: movie.overview,
		voteAverage: movie.vote_average,
		genres,
		trailerKey
	};
}
