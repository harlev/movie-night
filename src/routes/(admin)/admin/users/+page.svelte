<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Manage Users - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text)]">Users</h1>
		<p class="text-[var(--color-text-muted)] mt-1">{data.users.length} total users</p>
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

	<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
		<table class="w-full">
			<thead class="bg-[var(--color-surface-elevated)]">
				<tr>
					<th
						class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
					>
						User
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
					>
						Role
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
					>
						Status
					</th>
					<th
						class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
					>
						Joined
					</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[var(--color-border)]">
				{#each data.users as user}
					<tr class="hover:bg-[var(--color-surface-elevated)]/50">
						<td class="px-4 py-4">
							<div>
								<p class="font-medium text-[var(--color-text)]">{user.displayName}</p>
								<p class="text-sm text-[var(--color-text-muted)]">{user.email}</p>
							</div>
						</td>
						<td class="px-4 py-4">
							<form method="POST" action="?/updateRole" use:enhance class="inline">
								<input type="hidden" name="userId" value={user.id} />
								<select
									name="role"
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
									class="text-xs px-2 py-1 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)]
										{user.role === 'admin' ? 'text-[var(--color-warning)]' : ''}"
								>
									<option value="member" selected={user.role === 'member'}>Member</option>
									<option value="admin" selected={user.role === 'admin'}>Admin</option>
								</select>
							</form>
						</td>
						<td class="px-4 py-4">
							<span
								class="px-2 py-1 text-xs font-medium rounded
									{user.status === 'active'
									? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
									: 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}"
							>
								{user.status}
							</span>
						</td>
						<td class="px-4 py-4 text-sm text-[var(--color-text-muted)]">
							{formatDate(user.createdAt)}
						</td>
						<td class="px-4 py-4 text-right">
							<form method="POST" action="?/updateStatus" use:enhance class="inline">
								<input type="hidden" name="userId" value={user.id} />
								<input
									type="hidden"
									name="status"
									value={user.status === 'active' ? 'disabled' : 'active'}
								/>
								<button
									type="submit"
									class="text-sm {user.status === 'active'
										? 'text-[var(--color-error)]'
										: 'text-[var(--color-success)]'} hover:underline"
								>
									{user.status === 'active' ? 'Disable' : 'Enable'}
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
