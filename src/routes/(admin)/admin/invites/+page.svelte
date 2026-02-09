<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let expandedInvites = $state<Set<string>>(new Set());
	let copiedInviteId = $state<string | null>(null);

	function copyInviteUrl(invite: { id: string; code: string }) {
		const url = `${window.location.origin}/signup?code=${invite.code}`;
		navigator.clipboard.writeText(url);
		copiedInviteId = invite.id;
		setTimeout(() => {
			copiedInviteId = null;
		}, 2000);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function isExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date();
	}

	function getStatusColor(status: string, expiresAt: string): string {
		if (status === 'expired' || isExpired(expiresAt))
			return 'bg-[var(--color-error)]/10 text-[var(--color-error)]';
		return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
	}

	function getDisplayStatus(status: string, expiresAt: string): string {
		if (status === 'expired' || isExpired(expiresAt)) return 'Expired';
		return 'Active';
	}

	function toggleExpanded(inviteId: string) {
		const newSet = new Set(expandedInvites);
		if (newSet.has(inviteId)) {
			newSet.delete(inviteId);
		} else {
			newSet.add(inviteId);
		}
		expandedInvites = newSet;
	}
</script>

<svelte:head>
	<title>Manage Invites - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text)]">Invites</h1>
			<p class="text-[var(--color-text-muted)] mt-1">{data.invites.length} total invites</p>
		</div>
		<a
			href="/admin/invites/new"
			class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
		>
			Generate Invite
		</a>
	</div>

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div
			class="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3"
		>
			{form.message}
		</div>
	{/if}

	{#if data.invites.length > 0}
		<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
			<table class="w-full">
				<thead class="bg-[var(--color-surface-elevated)]">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Code
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Status
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Created By
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Expires
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Uses
						</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border)]">
					{#each data.invites as invite}
						<tr class="hover:bg-[var(--color-surface-elevated)]/50">
							<td class="px-4 py-4">
								<code
									class="px-2 py-1 bg-[var(--color-surface-elevated)] rounded text-sm font-mono text-[var(--color-text)]"
								>
									{invite.code}
								</code>
								<span class="relative inline-flex group">
									<button
										type="button"
										onclick={() => copyInviteUrl(invite)}
										class="ml-1.5 inline-flex items-center justify-center w-6 h-6 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
									>
										{#if copiedInviteId === invite.id}
											<svg class="w-3.5 h-3.5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
											</svg>
										{/if}
									</button>
									<span class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-[var(--color-border)]">
										{copiedInviteId === invite.id ? 'Copied!' : 'Copy signup URL'}
									</span>
								</span>
							</td>
							<td class="px-4 py-4">
								<span
									class="px-2 py-1 text-xs font-medium rounded {getStatusColor(
										invite.status,
										invite.expiresAt
									)}"
								>
									{getDisplayStatus(invite.status, invite.expiresAt)}
								</span>
							</td>
							<td class="px-4 py-4 text-sm text-[var(--color-text-muted)]">
								{invite.creatorName}
							</td>
							<td class="px-4 py-4 text-sm text-[var(--color-text-muted)]">
								{formatDate(invite.expiresAt)}
							</td>
							<td class="px-4 py-4">
								{#if invite.useCount > 0}
									<button
										type="button"
										onclick={() => toggleExpanded(invite.id)}
										class="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
									>
										<span class="font-medium">{invite.useCount}</span>
										<span class="text-[var(--color-text-muted)]">
											{invite.useCount === 1 ? 'user' : 'users'}
										</span>
										<svg
											class="w-4 h-4 transition-transform {expandedInvites.has(invite.id)
												? 'rotate-180'
												: ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</button>
								{:else}
									<span class="text-sm text-[var(--color-text-muted)]">0 users</span>
								{/if}
							</td>
							<td class="px-4 py-4 text-right">
								{#if invite.status === 'active' && !isExpired(invite.expiresAt)}
									<form method="POST" action="?/expire" use:enhance class="inline">
										<input type="hidden" name="inviteId" value={invite.id} />
										<button
											type="submit"
											class="text-sm text-[var(--color-error)] hover:underline"
										>
											Expire
										</button>
									</form>
								{/if}
							</td>
						</tr>
						{#if expandedInvites.has(invite.id) && invite.users.length > 0}
							<tr class="bg-[var(--color-surface-elevated)]/30">
								<td colspan="6" class="px-4 py-3">
									<div class="pl-4 border-l-2 border-[var(--color-border)]">
										<p class="text-xs font-medium text-[var(--color-text-muted)] mb-2">
											Users who joined with this invite:
										</p>
										<div class="flex flex-wrap gap-2">
											{#each invite.users as user}
												<span
													class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-surface)] rounded text-sm"
												>
													<span class="text-[var(--color-text)]">{user.displayName}</span>
													<span class="text-[var(--color-text-muted)] text-xs">
														({formatDate(user.usedAt)})
													</span>
												</span>
											{/each}
										</div>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
			<p class="text-[var(--color-text-muted)]">No invites created yet.</p>
		</div>
	{/if}
</div>
