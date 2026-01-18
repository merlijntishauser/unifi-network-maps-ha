.PHONY: help venv install install-dev test format frontend-install frontend-build frontend-test frontend-typecheck frontend-lint frontend-format pre-commit-install pre-commit-run ci version-bump version release clean

VENV_DIR := .venv
PYTHON_BIN := $(shell command -v python3.13 >/dev/null 2>&1 && echo python3.13 || echo python3)
PYTHON := $(VENV_DIR)/bin/python
PIP := $(VENV_DIR)/bin/pip
PIP_CACHE_DIR := $(CURDIR)/.venv/.pip-cache
VERSION_FILE := VERSION

help:
	@echo "Targets:"
	@echo "  venv            Create local .venv"
	@echo "  install         Install Python requirements into .venv"
	@echo "  install-dev     Install Python dev requirements into .venv"
	@echo "  test            Run Python tests"
	@echo "  format          Run ruff format on the repo"
	@echo "  frontend-install Install frontend deps (requires Node.js)"
	@echo "  frontend-build  Run frontend build (requires Node.js)"
	@echo "  frontend-test   Run frontend tests (requires Node.js)"
	@echo "  frontend-typecheck Run frontend typecheck (requires Node.js)"
	@echo "  frontend-lint   Run frontend lint (requires Node.js)"
	@echo "  frontend-format Run frontend format check (requires Node.js)"
	@echo "  pre-commit-install Install git hooks (requires pre-commit)"
	@echo "  pre-commit-run  Run all pre-commit hooks"
	@echo "  ci              Run full local CI (pre-commit hooks)"
	@echo "  version-bump    Bump integration and card versions, tag, and push"
	@echo "  release         Create a GitHub release for the current VERSION"
	@echo "  clean           Remove .venv"

venv:
	$(PYTHON_BIN) -m venv $(VENV_DIR)

install: venv
	$(PIP) install --upgrade pip
	PIP_CACHE_DIR=$(PIP_CACHE_DIR) $(PIP) install -r requirements.txt

install-dev: install
	PIP_CACHE_DIR=$(PIP_CACHE_DIR) $(PIP) install -r requirements-dev.txt

test: install-dev
	$(VENV_DIR)/bin/pytest -v --cov=custom_components --cov-report=term-missing

format: install-dev
	$(VENV_DIR)/bin/ruff format .

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build
	@mkdir -p custom_components/unifi_network_map/frontend
	@cp frontend/dist/unifi-network-map.js custom_components/unifi_network_map/frontend/unifi-network-map.js

frontend-test:
	cd frontend && npm run test

frontend-typecheck:
	cd frontend && npm run typecheck

frontend-lint:
	cd frontend && npm run lint

frontend-format:
	cd frontend && npm run format:check

pre-commit-install: install-dev
	$(VENV_DIR)/bin/pre-commit install

pre-commit-run: install-dev
	$(VENV_DIR)/bin/pre-commit run --all-files

ci: pre-commit-run

version: version-bump

release: ci version-bump
	@version=$$(cat $(VERSION_FILE)); \
	if ! echo "$$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$$'; then \
		echo "Invalid semver in $(VERSION_FILE): $$version"; exit 1; \
	fi; \
	if ! command -v gh >/dev/null 2>&1; then \
		echo "GitHub CLI not found. Install gh first."; exit 1; \
	fi; \
	zip_name=$$(python3 -c 'import json; print(json.load(open("hacs.json"))["filename"])'); \
	if [ -z "$$zip_name" ]; then \
		echo "hacs.json filename is missing"; exit 1; \
	fi; \
	dist_dir="dist"; \
	mkdir -p "$$dist_dir"; \
	zip_path="$$dist_dir/$$zip_name"; \
	rm -f "$$zip_path"; \
	python3 scripts/build_release_zip.py "$$zip_path"; \
	gh release create "v$$version" "$$zip_path" --title "v$$version" --notes-file CHANGELOG.md

version-bump:
	@current=$$(cat $(VERSION_FILE)); \
	default=$$(python3 -c 'import sys; v=sys.argv[1].strip().split("."); \
		(len(v)==3 and all(p.isdigit() for p in v)) or sys.exit(1); \
		major,minor,patch=map(int,v); patch+=1; \
		print(f"{major}.{minor}.{patch}")' "$$current"); \
	echo "Current version: $$current"; \
	read -p "New version [$$default]: " next; \
	if [ -z "$$next" ]; then next="$$default"; fi; \
	if ! echo "$$next" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$$'; then \
		echo "Invalid semver (expected x.y.z)"; exit 1; \
	fi; \
	if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "Working tree not clean. Commit or stash changes first."; exit 1; \
	fi; \
	printf "%s\n" "$$next" > $(VERSION_FILE); \
	python3 scripts/version_sync.py; \
	if ! grep -q "\"version\": \"$$next\"" custom_components/unifi_network_map/manifest.json; then \
		echo "manifest.json version did not update"; exit 1; \
	fi; \
	if ! grep -q "\"filename\": \"unifi-network-maps-ha-$$next.zip\"" hacs.json; then \
		echo "hacs.json filename did not update"; exit 1; \
	fi; \
	git add $(VERSION_FILE) custom_components/unifi_network_map/manifest.json frontend/package.json frontend/package-lock.json hacs.json; \
	git commit -m "Bump version to $$next"; \
	git tag -a "v$$next" -m "v$$next"; \
	git push origin HEAD; \
	git push origin "v$$next"

clean:
	rm -rf $(VENV_DIR)
