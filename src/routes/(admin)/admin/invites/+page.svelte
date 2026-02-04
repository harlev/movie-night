<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

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
		if (status === 'used') return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
		if (status === 'expired' || isExpired(expiresAt))
			return 'bg-[var(--color-error)]/10 text-[var(--color-error)]';
		return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]';
	}

	function getDisplayStatus(status: string, expiresAt: string): string {
		if (status === 'used') return 'Used';
		if (status === 'expired' || isExpired(expiresAt)) return 'Expired';
		return 'Pending';
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
							Used By
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
							<td class="px-4 py-4 text-sm text-[var(--color-text-muted)]">
								{invite.usedByName || '-'}
							</td>
							<td class="px-4 py-4 text-right">
								{#if invite.status === 'pending' && !isExpired(invite.expiresAt)}
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
