<script lang="ts">
	let { data } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
</script>

<svelte:head>
	<title>Dashboard - Movie Night</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text)]">Dashboard</h1>
		<p class="text-[var(--color-text-muted)] mt-1">Welcome back to Movie Night!</p>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<p class="text-[var(--color-text-muted)] text-sm">Total Movies</p>
			<p class="text-3xl font-bold text-[var(--color-text)] mt-1">{data.stats.totalMovies}</p>
		</div>
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<p class="text-[var(--color-text-muted)] text-sm">Community Members</p>
			<p class="text-3xl font-bold text-[var(--color-text)] mt-1">{data.stats.totalUsers}</p>
		</div>
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<p class="text-[var(--color-text-muted)] text-sm">Surveys Completed</p>
			<p class="text-3xl font-bold text-[var(--color-text)] mt-1">{data.stats.surveysCompleted}</p>
		</div>
	</div>

	<!-- Live Survey -->
	{#if data.liveSurvey}
		<div class="bg-[var(--color-surface)] rounded-lg p-6 border border-[var(--color-primary)]">
			<div class="flex items-center justify-between mb-4">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)]"
						>
							Live
						</span>
						<h2 class="text-xl font-semibold text-[var(--color-text)]">{data.liveSurvey.title}</h2>
					</div>
					{#if data.liveSurvey.description}
						<p class="text-[var(--color-text-muted)] mt-1">{data.liveSurvey.description}</p>
					{/if}
				</div>
				<div class="text-right">
					<p class="text-[var(--color-text-muted)] text-sm">
						{data.liveSurvey.movieCount} movies
					</p>
					<p class="text-[var(--color-text-muted)] text-sm">
						Rank top {data.liveSurvey.maxRankN}
					</p>
				</div>
			</div>

			<div class="flex items-center justify-between">
				{#if data.liveSurvey.hasVoted}
					<span class="text-[var(--color-success)] text-sm">You've submitted your ballot</span>
				{:else}
					<span class="text-[var(--color-warning)] text-sm">You haven't voted yet</span>
				{/if}
				<a
					href="/survey/{data.liveSurvey.id}"
					class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
				>
					{data.liveSurvey.hasVoted ? 'Update Vote' : 'Vote Now'}
				</a>
			</div>
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-6 text-center">
			<p class="text-[var(--color-text-muted)]">No active survey right now. Check back later!</p>
		</div>
	{/if}

	<!-- Recent Movies -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-[var(--color-text)]">Recent Suggestions</h2>
			<a href="/movies" class="text-[var(--color-primary)] hover:underline text-sm">
				View all movies
			</a>
		</div>

		{#if data.recentMovies.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
				{#each data.recentMovies as movie}
					<a
						href="/movies/{movie.id}"
						class="bg-[var(--color-surface)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
					>
						{#if movie.metadataSnapshot?.posterPath}
							<img
								src="{TMDB_IMAGE_BASE}{movie.metadataSnapshot.posterPath}"
								alt={movie.title}
								class="w-full aspect-[2/3] object-cover"
							/>
						{:else}
							<div
								class="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center"
							>
								<span class="text-[var(--color-text-muted)] text-4xl">?</span>
							</div>
						{/if}
						<div class="p-2">
							<p class="text-sm font-medium text-[var(--color-text)] truncate">{movie.title}</p>
							{#if movie.metadataSnapshot?.releaseDate}
								<p class="text-xs text-[var(--color-text-muted)]">
									{movie.metadataSnapshot.releaseDate.slice(0, 4)}
								</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-[var(--color-surface)] rounded-lg p-6 text-center">
				<p class="text-[var(--color-text-muted)]">No movies suggested yet.</p>
				<a href="/movies/suggest" class="text-[var(--color-primary)] hover:underline text-sm">
					Be the first to suggest a movie!
				</a>
			</div>
		{/if}
	</div>
</div>
