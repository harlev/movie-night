<script lang="ts">
	let { data } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

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
	<title>{data.survey.title} - History - Movie Night</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<a
			href="/history"
			class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to History
		</a>
		<div class="flex items-center gap-3 mt-2">
			<h1 class="text-2xl font-bold text-[var(--color-text)]">{data.survey.title}</h1>
			<span
				class="px-2 py-1 text-xs font-medium rounded bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]"
			>
				{data.survey.state}
			</span>
		</div>
		{#if data.survey.description}
			<p class="text-[var(--color-text-muted)] mt-1">{data.survey.description}</p>
		{/if}
		<p class="text-sm text-[var(--color-text-muted)] mt-2">
			Frozen on {formatDate(data.survey.frozenAt)} | {data.allBallots.length} votes cast
		</p>
	</div>

	<div class="grid lg:grid-cols-2 gap-6">
		<!-- Final Standings -->
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Final Standings</h2>

			<!-- Points breakdown -->
			<div class="mb-4 p-3 bg-[var(--color-surface-elevated)] rounded-lg">
				<p class="text-xs text-[var(--color-text-muted)] mb-2">Points per position:</p>
				<div class="flex flex-wrap gap-2">
					{#each data.pointsBreakdown as { rank, points }}
						<span class="text-xs px-2 py-1 bg-[var(--color-surface)] rounded">
							#{rank} = {points}pts
						</span>
					{/each}
				</div>
			</div>

			{#if data.standings.length > 0}
				<div class="space-y-2">
					{#each data.standings as standing, i}
						<div
							class="flex items-center gap-3 p-3 rounded-lg
								{i === 0
								? 'bg-yellow-500/10 border border-yellow-500/30'
								: i === 1
									? 'bg-gray-300/10'
									: i === 2
										? 'bg-orange-400/10'
										: 'bg-[var(--color-surface-elevated)]'}"
						>
							<span
								class="w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg
									{i === 0
									? 'bg-yellow-500/20 text-yellow-500'
									: i === 1
										? 'bg-gray-300/20 text-gray-300'
										: i === 2
											? 'bg-orange-400/20 text-orange-400'
											: 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}"
							>
								{standing.position}
							</span>
							{#if standing.posterPath}
								<img
									src="{TMDB_IMAGE_BASE}{standing.posterPath}"
									alt={standing.title}
									class="w-12 h-18 object-cover rounded"
								/>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="font-medium text-[var(--color-text)] truncate">
									{standing.title}
									{#if standing.tied}
										<span class="text-xs text-[var(--color-text-muted)]">(tied)</span>
									{/if}
								</p>
								<div class="flex gap-2 mt-1">
									{#each standing.rankCounts as count, idx}
										{#if count > 0}
											<span class="text-xs text-[var(--color-text-muted)]">
												#{idx + 1}: {count}
											</span>
										{/if}
									{/each}
								</div>
							</div>
							<span
								class="text-xl font-bold {i === 0 ? 'text-yellow-500' : 'text-[var(--color-primary)]'}"
							>
								{standing.totalPoints}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-[var(--color-text-muted)] text-center py-4">No standings available.</p>
			{/if}
		</div>

		<!-- Your Ballot & All Ballots -->
		<div class="space-y-6">
			<!-- Your Ballot -->
			<div class="bg-[var(--color-surface)] rounded-lg p-6">
				<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Your Ballot</h2>
				{#if data.userBallot && data.userBallot.ranks.length > 0}
					<div class="space-y-2">
						{#each data.userBallot.ranks.sort((a, b) => a.rank - b.rank) as { rank, movie }}
							<div class="flex items-center gap-3 p-2 bg-[var(--color-surface-elevated)] rounded-lg">
								<span
									class="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-bold"
								>
									{rank}
								</span>
								<span class="text-[var(--color-text)]">{movie.title}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-[var(--color-text-muted)] text-center py-4">
						You did not vote in this survey.
					</p>
				{/if}
			</div>

			<!-- All Ballots -->
			<div class="bg-[var(--color-surface)] rounded-lg p-6">
				<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">
					All Ballots ({data.allBallots.length})
				</h2>
				{#if data.allBallots.length > 0}
					<div class="space-y-3 max-h-96 overflow-y-auto">
						{#each data.allBallots as { user, ranks }}
							<div class="p-3 bg-[var(--color-surface-elevated)] rounded-lg">
								<p class="font-medium text-[var(--color-text)] mb-2">{user.displayName}</p>
								{#if ranks.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each ranks.sort((a, b) => a.rank - b.rank) as { rank, movieTitle }}
											<span class="text-xs px-2 py-1 bg-[var(--color-surface)] rounded">
												#{rank}: {movieTitle}
											</span>
										{/each}
									</div>
								{:else}
									<p class="text-xs text-[var(--color-text-muted)] italic">Empty ballot</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-[var(--color-text-muted)] text-center py-4">No ballots submitted.</p>
				{/if}
			</div>
		</div>
	</div>
</div>
