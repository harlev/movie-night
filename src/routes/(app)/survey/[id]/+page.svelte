<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	let { data, form } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';
	const POLL_INTERVAL = 5000; // 5 seconds

	// Initialize ballot state from existing ballot or empty
	let ballot = $state<Map<number, string>>(new Map());
	let submitting = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let lastBallotCount = $state(data.allBallots.length);

	// Polling for live updates
	onMount(() => {
		if (data.survey.state === 'live') {
			pollInterval = setInterval(async () => {
				try {
					const response = await fetch(`/api/survey/${$page.params.id}`);
					if (response.ok) {
						const pollData: { ballotCount: number; survey: { state: string } } = await response.json();
						// Only refresh if ballot count changed or survey state changed
						if (pollData.ballotCount !== lastBallotCount || pollData.survey.state !== data.survey.state) {
							lastBallotCount = pollData.ballotCount;
							await invalidateAll();
						}
					}
				} catch (e) {
					console.error('Poll error:', e);
				}
			}, POLL_INTERVAL);
		}
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	// Initialize from user's existing ballot
	$effect(() => {
		if (data.userBallot?.ranks) {
			const initial = new Map<number, string>();
			for (const { rank, movieId } of data.userBallot.ranks) {
				initial.set(rank, movieId);
			}
			ballot = initial;
		}
	});

	function setRank(rank: number, movieId: string) {
		const newBallot = new Map(ballot);

		// Remove movie from any existing rank
		for (const [r, m] of newBallot) {
			if (m === movieId) {
				newBallot.delete(r);
			}
		}

		// If clicking on already-selected rank, just remove it
		if (ballot.get(rank) === movieId) {
			ballot = newBallot;
			return;
		}

		// Set new rank
		newBallot.set(rank, movieId);
		ballot = newBallot;
	}

	function clearBallot() {
		ballot = new Map();
	}

	function getMovieForRank(rank: number): string | undefined {
		return ballot.get(rank);
	}

	function getMovieById(id: string) {
		return data.entries.find((e) => e.movie.id === id)?.movie;
	}

	function isMovieSelected(movieId: string): number | null {
		for (const [rank, mid] of ballot) {
			if (mid === movieId) return rank;
		}
		return null;
	}

	function getBallotAsArray(): Array<{ rank: number; movieId: string }> {
		return Array.from(ballot.entries()).map(([rank, movieId]) => ({ rank, movieId }));
	}

	const isLive = $derived(data.survey.state === 'live');
	const isFrozen = $derived(data.survey.state === 'frozen');
</script>

<svelte:head>
	<title>{data.survey.title} - Movie Night</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<a
			href="/dashboard"
			class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
		<div class="flex items-center gap-3 mt-2">
			<h1 class="text-2xl font-bold text-[var(--color-text)]">{data.survey.title}</h1>
			<span
				class="px-2 py-1 text-xs font-medium rounded
					{isLive
					? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
					: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'}"
			>
				{data.survey.state}
			</span>
		</div>
		{#if data.survey.description}
			<p class="text-[var(--color-text-muted)] mt-1">{data.survey.description}</p>
		{/if}
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
			Your ballot has been submitted!
		</div>
	{/if}

	<div class="grid lg:grid-cols-2 gap-6">
		<!-- Ballot Section -->
		<div class="space-y-4">
			<div class="bg-[var(--color-surface)] rounded-lg p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-[var(--color-text)]">Your Ballot</h2>
					{#if isLive && ballot.size > 0}
						<button
							type="button"
							onclick={clearBallot}
							class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
						>
							Clear
						</button>
					{/if}
				</div>

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

				<!-- Rank slots -->
				<div class="space-y-2">
					{#each { length: data.survey.maxRankN } as _, i}
						{@const rank = i + 1}
						{@const movieId = getMovieForRank(rank)}
						{@const movie = movieId ? getMovieById(movieId) : null}
						<div
							class="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed
								{movie
								? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
								: 'border-[var(--color-border)]'}"
						>
							<span
								class="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface-elevated)] font-bold text-[var(--color-text)]"
							>
								{rank}
							</span>
							{#if movie}
								<div class="flex items-center gap-3 flex-1">
									{#if movie.metadataSnapshot?.posterPath}
										<img
											src="{TMDB_IMAGE_BASE}{movie.metadataSnapshot.posterPath}"
											alt={movie.title}
											class="w-10 h-15 object-cover rounded"
										/>
									{/if}
									<span class="font-medium text-[var(--color-text)]">{movie.title}</span>
								</div>
								{#if isLive && movieId}
									<button
										type="button"
										onclick={() => setRank(rank, movieId)}
										class="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)]"
										aria-label="Remove from rank {rank}"
									>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								{/if}
							{:else}
								<span class="text-[var(--color-text-muted)] italic">Select a movie</span>
							{/if}
						</div>
					{/each}
				</div>

				{#if isLive}
					<form
						method="POST"
						action="?/submit"
						class="mt-4"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								submitting = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="ranks" value={JSON.stringify(getBallotAsArray())} />
						<button
							type="submit"
							disabled={submitting || ballot.size === 0}
							class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							{submitting ? 'Submitting...' : data.userBallot ? 'Update Ballot' : 'Submit Ballot'}
						</button>
					</form>
				{:else}
					<p class="mt-4 text-center text-sm text-[var(--color-text-muted)]">
						This survey is closed for voting.
					</p>
				{/if}
			</div>

			<!-- Available Movies -->
			<div class="bg-[var(--color-surface)] rounded-lg p-6">
				<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">
					Movies ({data.entries.length})
				</h2>
				<div class="space-y-2 max-h-96 overflow-y-auto">
					{#each data.entries as entry}
						{@const selectedRank = isMovieSelected(entry.movie.id)}
						<button
							type="button"
							disabled={!isLive}
							onclick={() => {
								if (!isLive) return;
								// Find first empty slot
								for (let r = 1; r <= data.survey.maxRankN; r++) {
									if (!ballot.has(r)) {
										setRank(r, entry.movie.id);
										return;
									}
								}
								// All slots full, replace last
								setRank(data.survey.maxRankN, entry.movie.id);
							}}
							class="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
								{selectedRank !== null
								? 'bg-[var(--color-primary)]/10 ring-2 ring-[var(--color-primary)]'
								: 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)]'}
								{!isLive ? 'cursor-default' : ''}"
						>
							{#if entry.movie.metadataSnapshot?.posterPath}
								<img
									src="{TMDB_IMAGE_BASE}{entry.movie.metadataSnapshot.posterPath}"
									alt={entry.movie.title}
									class="w-12 h-18 object-cover rounded"
								/>
							{:else}
								<div
									class="w-12 h-18 bg-[var(--color-border)] rounded flex items-center justify-center"
								>
									<span class="text-[var(--color-text-muted)]">?</span>
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="font-medium text-[var(--color-text)] truncate">{entry.movie.title}</p>
								{#if entry.movie.metadataSnapshot?.releaseDate}
									<p class="text-xs text-[var(--color-text-muted)]">
										{entry.movie.metadataSnapshot.releaseDate.slice(0, 4)}
									</p>
								{/if}
							</div>
							{#if selectedRank !== null}
								<span
									class="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-sm font-bold"
								>
									{selectedRank}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Standings & Ballots Section -->
		<div class="space-y-4">
			<!-- Current Standings -->
			<div class="bg-[var(--color-surface)] rounded-lg p-6">
				<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Current Standings</h2>
				{#if data.standings.length > 0 && data.allBallots.length > 0}
					<div class="space-y-2">
						{#each data.standings as standing}
							<div class="flex items-center gap-3 p-3 bg-[var(--color-surface-elevated)] rounded-lg">
								<span
									class="w-8 h-8 flex items-center justify-center rounded-full font-bold
										{standing.position === 1
										? 'bg-yellow-500/20 text-yellow-500'
										: standing.position === 2
											? 'bg-gray-300/20 text-gray-300'
											: standing.position === 3
												? 'bg-orange-400/20 text-orange-400'
												: 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}"
								>
									{standing.position}
								</span>
								{#if standing.posterPath}
									<img
										src="{TMDB_IMAGE_BASE}{standing.posterPath}"
										alt={standing.title}
										class="w-10 h-15 object-cover rounded"
									/>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="font-medium text-[var(--color-text)] truncate">
										{standing.title}
										{#if standing.tied}
											<span class="text-xs text-[var(--color-text-muted)]">(tied)</span>
										{/if}
									</p>
								</div>
								<span class="text-lg font-bold text-[var(--color-primary)]">
									{standing.totalPoints}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-[var(--color-text-muted)] text-center py-4">No votes yet.</p>
				{/if}
			</div>

			<!-- All Ballots (Transparency) -->
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
					<p class="text-[var(--color-text-muted)] text-center py-4">No ballots submitted yet.</p>
				{/if}
			</div>
		</div>
	</div>
</div>
