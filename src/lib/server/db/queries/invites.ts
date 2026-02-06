import { eq, sql } from 'drizzle-orm';
import type { Database } from '../index';
import { invites, inviteUses, users, type Invite } from '../schema';
import { generateId, generateInviteCode } from '$lib/utils';

export async function createInvite(
	db: Database,
	createdBy: string,
	expiresInDays: number = 7
): Promise<Invite> {
	const id = generateId();
	const code = generateInviteCode();
	const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

	const [invite] = await db
		.insert(invites)
		.values({
			id,
			code,
			createdBy,
			expiresAt: expiresAt.toISOString()
		})
		.returning();

	return invite;
}

export async function getInviteByCode(db: Database, code: string): Promise<Invite | undefined> {
	const [invite] = await db.select().from(invites).where(eq(invites.code, code.toUpperCase()));
	return invite;
}

export async function validateInviteCode(
	db: Database,
	code: string
): Promise<{ valid: boolean; error?: string; invite?: Invite }> {
	const invite = await getInviteByCode(db, code);

	if (!invite) {
		return { valid: false, error: 'Invalid invite code' };
	}

	if (invite.status === 'expired' || new Date(invite.expiresAt) < new Date()) {
		return { valid: false, error: 'This invite code has expired' };
	}

	return { valid: true, invite };
}

export async function recordInviteUse(
	db: Database,
	inviteId: string,
	userId: string
): Promise<void> {
	const id = generateId();

	// Insert the usage record
	await db.insert(inviteUses).values({
		id,
		inviteId,
		userId
	});

	// Increment the use count
	await db
		.update(invites)
		.set({
			useCount: sql`${invites.useCount} + 1`
		})
		.where(eq(invites.id, inviteId));
}

export async function getAllInvites(db: Database): Promise<Invite[]> {
	return db.select().from(invites);
}

export async function getInvitesByCreator(db: Database, createdBy: string): Promise<Invite[]> {
	return db.select().from(invites).where(eq(invites.createdBy, createdBy));
}

export async function expireInvite(db: Database, inviteId: string): Promise<void> {
	await db.update(invites).set({ status: 'expired' }).where(eq(invites.id, inviteId));
}

export async function getInviteUsers(
	db: Database,
	inviteId: string
): Promise<Array<{ userId: string; displayName: string; usedAt: string }>> {
	const results = await db
		.select({
			userId: inviteUses.userId,
			displayName: users.displayName,
			usedAt: inviteUses.usedAt
		})
		.from(inviteUses)
		.innerJoin(users, eq(inviteUses.userId, users.id))
		.where(eq(inviteUses.inviteId, inviteId));

	return results;
}
