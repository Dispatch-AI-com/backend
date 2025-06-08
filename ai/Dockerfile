FROM python:3.11-slim-bullseye

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv venv && uv sync --no-cache

ENV VIRTUAL_ENV="/app/.venv"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

CMD ["uv", "run", "fastapi", "dev", "--host", "0.0.0.0"]
