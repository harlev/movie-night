<script lang="ts">
	let { data } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getStateColor(state: string): string {
		switch (state) {
			case 'live':
				return 'bg-[var(--color-success)]/10 text-[var(--color-success)]';
			case 'frozen':
				return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]';
			default:
				return 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]';
		}
	}
</script>

<svelte:head>
	<title>Manage Surveys - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[var(--color-text)]">Surveys</h1>
		<a
			href="/admin/surveys/new"
			class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
		>
			Create Survey
		</a>
	</div>

	{#if data.surveys.length > 0}
		<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
			<table class="w-full">
				<thead class="bg-[var(--color-surface-elevated)]">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Survey
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Status
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Movies
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Ballots
						</th>
						<th
							class="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
						>
							Created
						</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-border)]">
					{#each data.surveys as survey}
						<tr class="hover:bg-[var(--color-surface-elevated)]/50">
							<td class="px-4 py-4">
								<div>
									<p class="font-medium text-[var(--color-text)]">{survey.title}</p>
									{#if survey.description}
										<p class="text-sm text-[var(--color-text-muted)] truncate max-w-xs">
											{survey.description}
										</p>
									{/if}
								</div>
							</td>
							<td class="px-4 py-4">
								<span class="px-2 py-1 text-xs font-medium rounded {getStateColor(survey.state)}">
									{survey.state}
								</span>
							</td>
							<td class="px-4 py-4 text-[var(--color-text-muted)]">
								{survey.movieCount}
							</td>
							<td class="px-4 py-4 text-[var(--color-text-muted)]">
								{survey.ballotCount}
							</td>
							<td class="px-4 py-4 text-sm text-[var(--color-text-muted)]">
								{formatDate(survey.createdAt)}
							</td>
							<td class="px-4 py-4 text-right">
								<a
									href="/admin/surveys/{survey.id}"
									class="text-[var(--color-primary)] hover:underline text-sm"
								>
									Manage
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
			<p class="text-[var(--color-text-muted)]">No surveys created yet.</p>
			<a
				href="/admin/surveys/new"
				class="inline-block mt-3 text-[var(--color-primary)] hover:underline"
			>
				Create your first survey
			</a>
		</div>
	{/if}
</div>
