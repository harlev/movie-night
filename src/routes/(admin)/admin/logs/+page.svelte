<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatAction(action: string): string {
		return action
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function handleSurveyChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		if (select.value) {
			goto(`/admin/logs?tab=ballots&surveyId=${select.value}`);
		}
	}
</script>

<svelte:head>
	<title>Activity Logs - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text)]">Activity Logs</h1>
		<p class="text-[var(--color-text-muted)] mt-1">View admin actions and ballot changes</p>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2 border-b border-[var(--color-border)]">
		<a
			href="/admin/logs?tab=admin"
			class="px-4 py-2 text-sm font-medium transition-colors border-b-2
				{data.selectedTab === 'admin'
				? 'border-[var(--color-primary)] text-[var(--color-primary)]'
				: 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
		>
			Admin Logs
		</a>
		<a
			href="/admin/logs?tab=ballots"
			class="px-4 py-2 text-sm font-medium transition-colors border-b-2
				{data.selectedTab === 'ballots'
				? 'border-[var(--color-primary)] text-[var(--color-primary)]'
				: 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
		>
			Ballot Changes
		</a>
	</div>

	{#if data.selectedTab === 'admin'}
		<!-- Admin Logs -->
		{#if data.adminLogs.length > 0}
			<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
				<table class="w-full">
					<thead class="bg-[var(--color-surface-elevated)]">
						<tr>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
							>
								Date
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
							>
								Actor
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
							>
								Action
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
							>
								Target
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
							>
								Details
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-border)]">
						{#each data.adminLogs as log}
							<tr class="hover:bg-[var(--color-surface-elevated)]/50">
								<td class="px-4 py-3 text-sm text-[var(--color-text-muted)]">
									{formatDate(log.createdAt)}
								</td>
								<td class="px-4 py-3 text-sm text-[var(--color-text)]">
									{log.actorName}
								</td>
								<td class="px-4 py-3">
									<span
										class="px-2 py-1 text-xs font-medium rounded bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
									>
										{formatAction(log.action)}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-[var(--color-text-muted)]">
									{log.targetType}: {log.targetId.slice(0, 8)}...
								</td>
								<td class="px-4 py-3 text-xs text-[var(--color-text-muted)]">
									{#if log.details}
										<code class="bg-[var(--color-surface-elevated)] px-1 rounded">
											{JSON.stringify(log.details)}
										</code>
									{:else}
										-
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
				<p class="text-[var(--color-text-muted)]">No admin activity yet.</p>
			</div>
		{/if}
	{:else}
		<!-- Ballot Change Logs -->
		<div class="bg-[var(--color-surface)] rounded-lg p-4 mb-4">
			<label for="surveySelect" class="block text-sm font-medium text-[var(--color-text)] mb-2">
				Select Survey
			</label>
			<select
				id="surveySelect"
				onchange={handleSurveyChange}
				class="w-full max-w-xs px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
			>
				<option value="">Choose a survey...</option>
				{#each data.surveys as survey}
					<option value={survey.id} selected={survey.id === data.selectedSurveyId}>
						{survey.title} ({survey.state})
					</option>
				{/each}
			</select>
		</div>

		{#if data.selectedSurveyId}
			{#if data.ballotLogs.length > 0}
				<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
					<table class="w-full">
						<thead class="bg-[var(--color-surface-elevated)]">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
								>
									Date
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
								>
									User
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
								>
									Reason
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
								>
									Changes
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[var(--color-border)]">
							{#each data.ballotLogs as log}
								<tr class="hover:bg-[var(--color-surface-elevated)]/50">
									<td class="px-4 py-3 text-sm text-[var(--color-text-muted)]">
										{formatDate(log.createdAt)}
									</td>
									<td class="px-4 py-3 text-sm text-[var(--color-text)]">
										{log.userName}
									</td>
									<td class="px-4 py-3">
										<span
											class="px-2 py-1 text-xs font-medium rounded
												{log.reason === 'movie_removed'
												? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
												: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}"
										>
											{formatAction(log.reason)}
										</span>
									</td>
									<td class="px-4 py-3 text-xs text-[var(--color-text-muted)]">
										{#if log.newRanks && log.newRanks.length > 0}
											{log.newRanks.length} rank(s)
										{:else}
											Empty ballot
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
					<p class="text-[var(--color-text-muted)]">No ballot changes for this survey.</p>
				</div>
			{/if}
		{:else}
			<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
				<p class="text-[var(--color-text-muted)]">Select a survey to view ballot changes.</p>
			</div>
		{/if}
	{/if}
</div>
