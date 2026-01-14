# Contributing

Thanks for helping improve UniFi Network Map for Home Assistant.

## Development setup
- Python: use `make install-dev` to create `.venv` and install dependencies.
- Frontend: run `make frontend-install` to install Node dependencies.

## Pre-commit hooks
We use `pre-commit` to keep local checks consistent with CI. It runs:
- Hassfest via Docker (`ghcr.io/home-assistant/hassfest:latest`)
- Python tests (`make test`)
- Frontend tests (`make frontend-test`)

Enable it once:
```bash
pip install -r requirements-dev.txt
pre-commit install
```

Or use the Makefile (no activation required):
```bash
make pre-commit-install
make pre-commit-run
```

Run all hooks manually:
```bash
pre-commit run --all-files
```

## Testing
- Python: `make test`
- Frontend: `make frontend-test`

## Workflow guidelines
- Preferred branch: `TBD` until we settle on a release flow.
- We prefer rebasing over merge commits.
- PRs are for unknown contributors; regular contributors can push directly.
- Commit style: small and focused. Many small commits are preferred; no squashing.
