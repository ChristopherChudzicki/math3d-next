FROM python:3.12.5

WORKDIR /src/webserver

# Install uv first (single static binary install pattern)
RUN pip install --no-cache-dir uv

# Copy only dependency metadata first for better layer caching
COPY webserver/pyproject.toml ./
COPY webserver/uv.lock ./

# Set virtual environment location outside the mounted directory
ENV UV_PROJECT_ENVIRONMENT=/app/.venv
# Sync dependencies (no project source yet so this layer caches if deps unchanged)
RUN uv sync --frozen --all-groups || uv sync --all-groups

# Now copy the rest of the application code
COPY webserver/ ./

# Build wheel (optional; also ensures hatch metadata is valid)
RUN uv build

# Default command will be supplied by docker-compose (make devserver)
