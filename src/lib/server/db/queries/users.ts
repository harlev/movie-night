import { eq } from 'drizzle-orm';
import type { Database } from '../index';
import { users, sessions, type User, type NewUser } from '../schema';
import { generateId } from '$lib/utils';
import { hashPassword, hashToken } from '$lib/server/auth';

export async function createUser(
	db: Database,
	data: { email: string; password: string; displayName: string; role?: 'admin' | 'member' }
): Promise<User> {
	const id = generateId();
	const passwordHash = await hashPassword(data.password);

	const [user] = await db
		.insert(users)
		.values({
			id,
			email: data.email.toLowerCase(),
			passwordHash,
			displayName: data.displayName,
			role: data.role || 'member'
		})
		.returning();

	return user;
}

export async function getUserByEmail(db: Database, email: string): Promise<User | undefined> {
	const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
	return user;
}

export async function getUserById(db: Database, id: string): Promise<User | undefined> {
	const [user] = await db.select().from(users).where(eq(users.id, id));
	return user;
}

export async function updateUser(
	db: Database,
	id: string,
	data: Partial<Pick<User, 'displayName' | 'role' | 'status'>>
): Promise<User | undefined> {
	const [user] = await db
		.update(users)
		.set({ ...data, updatedAt: new Date().toISOString() })
		.where(eq(users.id, id))
		.returning();
	return user;
}

export async function getAllUsers(db: Database): Promise<User[]> {
	return db.select().from(users);
}

export async function createSession(
	db: Database,
	userId: string,
	refreshToken: string,
	expiresAt: Date
): Promise<void> {
	const tokenHash = await hashToken(refreshToken);
	await db.insert(sessions).values({
		id: generateId(),
		userId,
		refreshTokenHash: tokenHash,
		expiresAt: expiresAt.toISOString()
	});
}

export async function getSessionByRefreshToken(
	db: Database,
	refreshToken: string
): Promise<{ userId: string; expiresAt: string } | undefined> {
	const tokenHash = await hashToken(refreshToken);
	const [session] = await db
		.select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
		.from(sessions)
		.where(eq(sessions.refreshTokenHash, tokenHash));
	return session;
}

export async function deleteSession(db: Database, refreshToken: string): Promise<void> {
	const tokenHash = await hashToken(refreshToken);
	await db.delete(sessions).where(eq(sessions.refreshTokenHash, tokenHash));
}

export async function deleteAllUserSessions(db: Database, userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}
