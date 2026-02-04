<script lang="ts">
	let { data } = $props();

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Survey History - Movie Night</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text)]">Survey History</h1>
		<p class="text-[var(--color-text-muted)] mt-1">Browse past surveys and their results</p>
	</div>

	{#if data.liveSurvey}
		<div class="bg-[var(--color-surface)] rounded-lg p-4 border border-[var(--color-success)]">
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="px-2 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded"
						>
							Live
						</span>
						<span class="font-medium text-[var(--color-text)]">{data.liveSurvey.title}</span>
					</div>
				</div>
				<a
					href="/survey/{data.liveSurvey.id}"
					class="text-[var(--color-primary)] hover:underline text-sm"
				>
					Vote Now
				</a>
			</div>
		</div>
	{/if}

	{#if data.surveys.length > 0}
		<div class="space-y-3">
			{#each data.surveys as survey}
				<a
					href="/history/{survey.id}"
					class="block bg-[var(--color-surface)] rounded-lg p-4 hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
				>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-semibold text-[var(--color-text)]">{survey.title}</h3>
							{#if survey.description}
								<p class="text-sm text-[var(--color-text-muted)] mt-1">{survey.description}</p>
							{/if}
							<div class="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
								<span>{survey.movieCount} movies</span>
								<span>{survey.ballotCount} votes</span>
								<span>Frozen {formatDate(survey.frozenAt)}</span>
							</div>
						</div>
						<div class="text-right">
							{#if survey.userParticipated}
								<span
									class="px-2 py-1 text-xs bg-[var(--color-success)]/10 text-[var(--color-success)] rounded"
								>
									Voted
								</span>
							{:else}
								<span
									class="px-2 py-1 text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] rounded"
								>
									Did not vote
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
			<p class="text-[var(--color-text-muted)]">No completed surveys yet.</p>
		</div>
	{/if}
</div>
