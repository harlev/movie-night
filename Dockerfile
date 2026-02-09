FROM node:22-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create .dev.vars with defaults for local Docker usage
RUN echo 'JWT_SECRET=docker-local-dev-secret-key-change-me' > .dev.vars && \
    echo 'TMDB_API_KEY=placeholder' >> .dev.vars

# Build the SvelteKit app
RUN npm run build

# Apply D1 migrations to local database
RUN npx wrangler d1 migrations apply movie-night-db --local

EXPOSE 8788

# Start wrangler pages dev (binds to 0.0.0.0 so it's accessible outside the container)
CMD ["npx", "wrangler", "pages", "dev", ".svelte-kit/cloudflare", "--ip", "0.0.0.0", "--port", "8788"]
