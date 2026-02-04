<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

	let showAddMovie = $state(false);
	let selectedMovieId = $state('');
	let processing = $state(false);

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

	function canGoLive(): boolean {
		return data.survey.state === 'draft' && data.entries.length > 0;
	}

	function canFreeze(): boolean {
		return data.survey.state === 'live';
	}
</script>

<svelte:head>
	<title>{data.survey.title} - Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a
				href="/admin/surveys"
				class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to Surveys
			</a>
			<h1 class="text-2xl font-bold text-[var(--color-text)] mt-2">{data.survey.title}</h1>
		</div>
		<span class="px-3 py-1 text-sm font-medium rounded {getStateColor(data.survey.state)}">
			{data.survey.state}
		</span>
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

	<!-- Survey Info -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Survey Details</h2>

		{#if data.survey.state === 'draft'}
			<form
				method="POST"
				action="?/updateInfo"
				use:enhance={() => {
					processing = true;
					return async ({ update }) => {
						processing = false;
						await update();
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Title
						</label>
						<input
							type="text"
							id="title"
							name="title"
							value={data.survey.title}
							required
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
						/>
					</div>
					<div>
						<label for="description" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							value={data.survey.description || ''}
							rows="2"
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
						></textarea>
					</div>
					<div>
						<label for="maxRankN" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Max Rank
						</label>
						<select
							id="maxRankN"
							name="maxRankN"
							class="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
						>
							{#each [3, 5, 7, 10] as n}
								<option value={n} selected={data.survey.maxRankN === n}>Top {n}</option>
							{/each}
						</select>
					</div>
					<button
						type="submit"
						disabled={processing}
						class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						Save Changes
					</button>
				</div>
			</form>
		{:else}
			<div class="space-y-3 text-sm">
				<p class="text-[var(--color-text-muted)]">
					<span class="font-medium text-[var(--color-text)]">Title:</span>
					{data.survey.title}
				</p>
				{#if data.survey.description}
					<p class="text-[var(--color-text-muted)]">
						<span class="font-medium text-[var(--color-text)]">Description:</span>
						{data.survey.description}
					</p>
				{/if}
				<p class="text-[var(--color-text-muted)]">
					<span class="font-medium text-[var(--color-text)]">Max Rank:</span>
					Top {data.survey.maxRankN}
				</p>
				<p class="text-[var(--color-text-muted)]">
					<span class="font-medium text-[var(--color-text)]">Ballots:</span>
					{data.ballotCount}
				</p>
			</div>
		{/if}
	</div>

	<!-- State Controls -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Survey State</h2>
		<div class="flex flex-wrap gap-3">
			{#if canGoLive()}
				<form method="POST" action="?/changeState" use:enhance>
					<input type="hidden" name="state" value="live" />
					<button
						type="submit"
						class="px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Go Live
					</button>
				</form>
			{/if}

			{#if canFreeze()}
				<form method="POST" action="?/changeState" use:enhance>
					<input type="hidden" name="state" value="frozen" />
					<button
						type="submit"
						class="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Freeze Survey
					</button>
				</form>
			{/if}

			{#if data.survey.state === 'draft'}
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						if (!confirm('Are you sure you want to delete this survey?')) {
							return async () => {};
						}
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<button
						type="submit"
						class="px-4 py-2 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Delete Survey
					</button>
				</form>
			{/if}
		</div>

		{#if data.survey.state === 'draft' && data.entries.length === 0}
			<p class="text-sm text-[var(--color-warning)] mt-3">
				Add at least one movie before going live.
			</p>
		{/if}
	</div>

	<!-- Movies -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-[var(--color-text)]">
				Movies ({data.entries.length})
			</h2>
			{#if data.survey.state !== 'frozen' && data.availableMovies.length > 0}
				<button
					type="button"
					onclick={() => (showAddMovie = !showAddMovie)}
					class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
				>
					{showAddMovie ? 'Cancel' : 'Add Movie'}
				</button>
			{/if}
		</div>

		{#if showAddMovie}
			<div class="mb-6 p-4 bg-[var(--color-surface-elevated)] rounded-lg">
				<form method="POST" action="?/addMovie" use:enhance>
					<label for="movieId" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Select Movie
					</label>
					<div class="flex gap-3">
						<select
							id="movieId"
							name="movieId"
							bind:value={selectedMovieId}
							class="flex-1 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
						>
							<option value="">Choose a movie...</option>
							{#each data.availableMovies as movie}
								<option value={movie.id}>{movie.title}</option>
							{/each}
						</select>
						<button
							type="submit"
							disabled={!selectedMovieId}
							class="px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							Add
						</button>
					</div>
				</form>
			</div>
		{/if}

		{#if data.entries.length > 0}
			<div class="space-y-2">
				{#each data.entries as entry}
					<div
						class="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg"
					>
						<div class="flex items-center gap-3">
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
									<span class="text-xs text-[var(--color-text-muted)]">?</span>
								</div>
							{/if}
							<div>
								<p class="font-medium text-[var(--color-text)]">{entry.movie.title}</p>
								{#if entry.movie.metadataSnapshot?.releaseDate}
									<p class="text-xs text-[var(--color-text-muted)]">
										{entry.movie.metadataSnapshot.releaseDate.slice(0, 4)}
									</p>
								{/if}
							</div>
						</div>
						{#if data.survey.state !== 'frozen'}
							<form method="POST" action="?/removeMovie" use:enhance>
								<input type="hidden" name="entryId" value={entry.id} />
								<input type="hidden" name="movieId" value={entry.movieId} />
								<button
									type="submit"
									class="p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
									title="Remove movie"
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
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-[var(--color-text-muted)] text-center py-8">No movies in this survey yet.</p>
		{/if}
	</div>
</div>
