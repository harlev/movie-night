<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard - Movie Night</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-[var(--color-text)]">Admin Dashboard</h1>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-[var(--color-surface)] rounded-lg p-4">
			<p class="text-sm text-[var(--color-text-muted)]">Total Users</p>
			<p class="text-2xl font-bold text-[var(--color-text)]">{data.stats.totalUsers}</p>
		</div>
		<div class="bg-[var(--color-surface)] rounded-lg p-4">
			<p class="text-sm text-[var(--color-text-muted)]">Active Users</p>
			<p class="text-2xl font-bold text-[var(--color-text)]">{data.stats.activeUsers}</p>
		</div>
		<div class="bg-[var(--color-surface)] rounded-lg p-4">
			<p class="text-sm text-[var(--color-text-muted)]">Total Movies</p>
			<p class="text-2xl font-bold text-[var(--color-text)]">{data.stats.totalMovies}</p>
		</div>
		<div class="bg-[var(--color-surface)] rounded-lg p-4">
			<p class="text-sm text-[var(--color-text-muted)]">Total Surveys</p>
			<p class="text-2xl font-bold text-[var(--color-text)]">{data.stats.totalSurveys}</p>
		</div>
	</div>

	<!-- Live Survey Status -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Live Survey Status</h2>
		{#if data.stats.liveSurvey}
			<div class="flex items-center justify-between">
				<div>
					<p class="font-medium text-[var(--color-text)]">{data.stats.liveSurvey.title}</p>
					<p class="text-sm text-[var(--color-text-muted)]">
						{data.stats.liveSurvey.ballotCount} ballots submitted
					</p>
				</div>
				<div class="flex items-center gap-3">
					<span
						class="px-2 py-1 text-xs font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] rounded"
					>
						Live
					</span>
					<a
						href="/admin/surveys/{data.stats.liveSurvey.id}"
						class="text-[var(--color-primary)] hover:underline text-sm"
					>
						Manage
					</a>
				</div>
			</div>
		{:else}
			<p class="text-[var(--color-text-muted)]">No survey is currently live.</p>
			<a
				href="/admin/surveys"
				class="inline-block mt-3 text-[var(--color-primary)] hover:underline text-sm"
			>
				Create or activate a survey
			</a>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Quick Actions</h2>
		<div class="flex flex-wrap gap-3">
			<a
				href="/admin/surveys/new"
				class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
			>
				Create Survey
			</a>
			<a
				href="/admin/invites/new"
				class="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
			>
				Generate Invite
			</a>
			<a
				href="/admin/users"
				class="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
			>
				Manage Users
			</a>
		</div>
	</div>
</div>
