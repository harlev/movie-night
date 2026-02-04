import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../index';
import {
	ballots,
	ballotRanks,
	ballotChangeLogs,
	users,
	movies,
	type Ballot,
	type BallotRank,
	type BallotChangeLog
} from '../schema';
import { generateId } from '$lib/utils';

export async function getBallot(
	db: Database,
	surveyId: string,
	userId: string
): Promise<(Ballot & { ranks: Array<BallotRank & { movie: { id: string; title: string } }> }) | null> {
	const [ballot] = await db
		.select()
		.from(ballots)
		.where(and(eq(ballots.surveyId, surveyId), eq(ballots.userId, userId)));

	if (!ballot) return null;

	const ranks = await db
		.select({
			id: ballotRanks.id,
			ballotId: ballotRanks.ballotId,
			rank: ballotRanks.rank,
			movieId: ballotRanks.movieId,
			movie: {
				id: movies.id,
				title: movies.title
			}
		})
		.from(ballotRanks)
		.innerJoin(movies, eq(ballotRanks.movieId, movies.id))
		.where(eq(ballotRanks.ballotId, ballot.id))
		.orderBy(ballotRanks.rank);

	return { ...ballot, ranks };
}

export async function getAllBallots(
	db: Database,
	surveyId: string
): Promise<
	Array<{
		ballot: Ballot;
		user: { id: string; displayName: string };
		ranks: Array<{ rank: number; movieId: string; movieTitle: string }>;
	}>
> {
	const allBallots = await db
		.select({
			ballot: ballots,
			user: {
				id: users.id,
				displayName: users.displayName
			}
		})
		.from(ballots)
		.innerJoin(users, eq(ballots.userId, users.id))
		.where(eq(ballots.surveyId, surveyId));

	const result = await Promise.all(
		allBallots.map(async ({ ballot, user }) => {
			const ranks = await db
				.select({
					rank: ballotRanks.rank,
					movieId: ballotRanks.movieId,
					movieTitle: movies.title
				})
				.from(ballotRanks)
				.innerJoin(movies, eq(ballotRanks.movieId, movies.id))
				.where(eq(ballotRanks.ballotId, ballot.id))
				.orderBy(ballotRanks.rank);

			return { ballot, user, ranks };
		})
	);

	return result;
}

export async function submitBallot(
	db: Database,
	data: {
		surveyId: string;
		userId: string;
		ranks: Array<{ rank: number; movieId: string }>;
	}
): Promise<Ballot> {
	// Check if ballot exists
	const [existingBallot] = await db
		.select()
		.from(ballots)
		.where(and(eq(ballots.surveyId, data.surveyId), eq(ballots.userId, data.userId)));

	let ballot: Ballot;
	let previousRanks: Array<{ rank: number; movieId: string }> | null = null;

	if (existingBallot) {
		// Get previous ranks for change log
		const oldRanks = await db
			.select({ rank: ballotRanks.rank, movieId: ballotRanks.movieId })
			.from(ballotRanks)
			.where(eq(ballotRanks.ballotId, existingBallot.id));
		previousRanks = oldRanks;

		// Delete existing ranks
		await db.delete(ballotRanks).where(eq(ballotRanks.ballotId, existingBallot.id));

		// Update ballot timestamp
		const [updated] = await db
			.update(ballots)
			.set({ updatedAt: new Date().toISOString() })
			.where(eq(ballots.id, existingBallot.id))
			.returning();
		ballot = updated;
	} else {
		// Create new ballot
		const [newBallot] = await db
			.insert(ballots)
			.values({
				id: generateId(),
				surveyId: data.surveyId,
				userId: data.userId
			})
			.returning();
		ballot = newBallot;
	}

	// Insert new ranks
	if (data.ranks.length > 0) {
		await db.insert(ballotRanks).values(
			data.ranks.map((r) => ({
				id: generateId(),
				ballotId: ballot.id,
				rank: r.rank,
				movieId: r.movieId
			}))
		);
	}

	// Log the change
	await db.insert(ballotChangeLogs).values({
		id: generateId(),
		surveyId: data.surveyId,
		userId: data.userId,
		previousRanks: previousRanks,
		newRanks: data.ranks,
		reason: previousRanks ? 'user_update' : 'user_update'
	});

	return ballot;
}

export async function removeBallotMovie(
	db: Database,
	surveyId: string,
	movieId: string
): Promise<{ affectedUsers: string[] }> {
	// Find all ballots with this movie
	const affectedBallots = await db
		.select({
			ballotId: ballots.id,
			userId: ballots.userId
		})
		.from(ballots)
		.innerJoin(ballotRanks, eq(ballots.id, ballotRanks.ballotId))
		.where(and(eq(ballots.surveyId, surveyId), eq(ballotRanks.movieId, movieId)));

	const affectedUsers: string[] = [];
	const processedBallots = new Set<string>();

	for (const { ballotId, userId } of affectedBallots) {
		if (processedBallots.has(ballotId)) continue;
		processedBallots.add(ballotId);

		// Get current ranks
		const currentRanks = await db
			.select({ rank: ballotRanks.rank, movieId: ballotRanks.movieId })
			.from(ballotRanks)
			.where(eq(ballotRanks.ballotId, ballotId));

		// Remove the movie (keep gaps)
		const newRanks = currentRanks.filter((r) => r.movieId !== movieId);

		// Delete the removed rank
		await db
			.delete(ballotRanks)
			.where(and(eq(ballotRanks.ballotId, ballotId), eq(ballotRanks.movieId, movieId)));

		// Log the change
		await db.insert(ballotChangeLogs).values({
			id: generateId(),
			surveyId,
			userId,
			previousRanks: currentRanks,
			newRanks: newRanks,
			reason: 'movie_removed'
		});

		affectedUsers.push(userId);
	}

	return { affectedUsers };
}

export async function getBallotChangeLogs(
	db: Database,
	surveyId: string,
	userId?: string
): Promise<Array<BallotChangeLog & { userName: string }>> {
	const conditions = [eq(ballotChangeLogs.surveyId, surveyId)];
	if (userId) {
		conditions.push(eq(ballotChangeLogs.userId, userId));
	}

	const logs = await db
		.select({
			id: ballotChangeLogs.id,
			surveyId: ballotChangeLogs.surveyId,
			userId: ballotChangeLogs.userId,
			previousRanks: ballotChangeLogs.previousRanks,
			newRanks: ballotChangeLogs.newRanks,
			reason: ballotChangeLogs.reason,
			createdAt: ballotChangeLogs.createdAt,
			userName: users.displayName
		})
		.from(ballotChangeLogs)
		.innerJoin(users, eq(ballotChangeLogs.userId, users.id))
		.where(and(...conditions))
		.orderBy(desc(ballotChangeLogs.createdAt));

	return logs;
}
