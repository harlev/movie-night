import { eq, and, desc, isNull } from 'drizzle-orm';
import type { Database } from '../index';
import { movies, movieComments, users, type Movie, type MovieComment } from '../schema';
import { generateId } from '$lib/utils';

export async function createMovie(
	db: Database,
	data: {
		tmdbId: number;
		title: string;
		metadataSnapshot: Movie['metadataSnapshot'];
		suggestedBy: string;
	}
): Promise<Movie> {
	const id = generateId();

	const [movie] = await db
		.insert(movies)
		.values({
			id,
			tmdbId: data.tmdbId,
			title: data.title,
			metadataSnapshot: data.metadataSnapshot,
			suggestedBy: data.suggestedBy
		})
		.returning();

	return movie;
}

export async function getMovieById(db: Database, id: string): Promise<Movie | undefined> {
	const [movie] = await db.select().from(movies).where(eq(movies.id, id));
	return movie;
}

export async function getMovieByTmdbId(db: Database, tmdbId: number): Promise<Movie | undefined> {
	const [movie] = await db.select().from(movies).where(eq(movies.tmdbId, tmdbId));
	return movie;
}

export async function getAllMovies(
	db: Database,
	options: { includeHidden?: boolean } = {}
): Promise<
	Array<
		Movie & {
			suggestedByName: string;
		}
	>
> {
	const conditions = options.includeHidden ? [] : [eq(movies.hidden, false)];

	const result = await db
		.select({
			id: movies.id,
			tmdbId: movies.tmdbId,
			title: movies.title,
			metadataSnapshot: movies.metadataSnapshot,
			suggestedBy: movies.suggestedBy,
			hidden: movies.hidden,
			createdAt: movies.createdAt,
			updatedAt: movies.updatedAt,
			suggestedByName: users.displayName
		})
		.from(movies)
		.leftJoin(users, eq(movies.suggestedBy, users.id))
		.where(conditions.length > 0 ? conditions[0] : undefined)
		.orderBy(desc(movies.createdAt));

	return result.map((r) => ({
		...r,
		suggestedByName: r.suggestedByName || 'Unknown'
	}));
}

export async function updateMovieVisibility(
	db: Database,
	id: string,
	hidden: boolean
): Promise<Movie | undefined> {
	const [movie] = await db
		.update(movies)
		.set({ hidden, updatedAt: new Date().toISOString() })
		.where(eq(movies.id, id))
		.returning();
	return movie;
}

export async function createMovieComment(
	db: Database,
	data: {
		movieId: string;
		userId: string;
		content: string;
	}
): Promise<MovieComment> {
	const id = generateId();

	const [comment] = await db
		.insert(movieComments)
		.values({
			id,
			movieId: data.movieId,
			userId: data.userId,
			content: data.content
		})
		.returning();

	return comment;
}

export async function getMovieComments(
	db: Database,
	movieId: string
): Promise<Array<MovieComment & { userName: string }>> {
	const result = await db
		.select({
			id: movieComments.id,
			movieId: movieComments.movieId,
			userId: movieComments.userId,
			content: movieComments.content,
			createdAt: movieComments.createdAt,
			updatedAt: movieComments.updatedAt,
			userName: users.displayName
		})
		.from(movieComments)
		.leftJoin(users, eq(movieComments.userId, users.id))
		.where(eq(movieComments.movieId, movieId))
		.orderBy(desc(movieComments.createdAt));

	return result.map((r) => ({
		...r,
		userName: r.userName || 'Unknown'
	}));
}

export async function deleteMovieComment(db: Database, commentId: string): Promise<void> {
	await db.delete(movieComments).where(eq(movieComments.id, commentId));
}
