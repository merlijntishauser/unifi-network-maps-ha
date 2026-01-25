.PHONY: help venv install install-dev test test-unit test-integration test-contract test-e2e test-e2e-debug test-e2e-all format frontend-install frontend-build frontend-test frontend-typecheck frontend-lint frontend-format pre-commit-install pre-commit-run ci version-bump version release release-hotfix clean

VENV_DIR := .venv
PYTHON_BIN := $(shell command -v python3.13 >/dev/null 2>&1 && echo python3.13 || echo python3)
PYTHON := $(VENV_DIR)/bin/python
PIP := $(VENV_DIR)/bin/pip
PIP_CACHE_DIR := $(CURDIR)/.venv/.pip-cache
VERSION_FILE := VERSION
HA_IMAGE_TAG ?= stable
HA_CONFIG_DIR ?= $(CURDIR)/tests/e2e/ha-config-stable

help:
	@echo "Targets:"
	@echo "  venv            Create local .venv"
	@echo "  install         Install Python requirements into .venv"
	@echo "  install-dev     Install Python dev requirements into .venv"
	@echo "  test            Run all Python tests with coverage"
	@echo "  test-unit       Run unit tests"
	@echo "  test-integration Run integration tests"
	@echo "  test-contract   Run contract tests"
	@echo "  test-e2e        Run E2E tests with Docker (requires Docker)"
	@echo "  test-e2e-debug  Run E2E tests with visible browser"
	@echo "  test-e2e-all    Run E2E tests for all HA versions in tests/e2e/ha-matrix.yaml"
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
	@echo "  version-bump    Bump integration and card versions, build frontend bundle, tag, and push"
	@echo "  release         Build release zip and print the gh release command"
	@echo "  release-hotfix  Rebuild bundle, retag, and print gh upload command"
	@echo "  clean           Remove .venv"

venv:
	$(PYTHON_BIN) -m venv $(VENV_DIR)

install: venv
	$(PIP) install --upgrade pip
	PIP_CACHE_DIR=$(PIP_CACHE_DIR) $(PIP) install -r requirements.txt

install-dev: install
	PIP_CACHE_DIR=$(PIP_CACHE_DIR) $(PIP) install -r requirements-dev.txt

test: install-dev
	$(VENV_DIR)/bin/pytest -v --cov=custom_components --cov-report=term-missing tests/unit tests/integration tests/contract

test-unit: install-dev
	$(VENV_DIR)/bin/pytest -v tests/unit

test-integration: install-dev
	$(VENV_DIR)/bin/pytest -v tests/integration

test-contract: install-dev
	$(VENV_DIR)/bin/pytest -v tests/contract

test-e2e: frontend-build
	@echo "Installing E2E test dependencies..."
	$(PIP) install -r tests/e2e/requirements.txt
	$(VENV_DIR)/bin/playwright install chromium
	@echo "Starting Docker services..."
	@echo "Pulling latest Home Assistant image..."
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml pull homeassistant
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml up -d --build --wait
	@echo "Waiting for Home Assistant..."
	@timeout 120 bash -c 'until curl -sf http://localhost:28123/api/ 2>/dev/null; do sleep 2; done' || true
	@sleep 10
	@echo "Running E2E tests..."
	@VERSION_FILE=$$(mktemp) ; \
	STATUS=0 ; \
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) E2E_VERSION_FILE=$$VERSION_FILE $(VENV_DIR)/bin/pytest tests/e2e -v --browser chromium || STATUS=$$? ; \
	if [ $$STATUS -ne 0 ]; then HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml logs ; fi ; \
	echo "Stopping Docker services..." ; \
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml down -v ; \
	VERSION=$$(python3 -c 'import json,sys; from pathlib import Path; p=Path(sys.argv[1]); print(json.loads(p.read_text()).get("version","unknown") if p.exists() else "unknown")' $$VERSION_FILE); \
	IMAGE_TAG=$${HA_IMAGE_TAG:-stable} ; \
	RESULT=$$(if [ $$STATUS -eq 0 ]; then echo passed; else echo failed; fi) ; \
	echo "" ; \
	echo "E2E Summary" ; \
	printf "%-10s %-10s %-12s %s\n" "Name" "Image Tag" "HA Version" "Result" ; \
	printf "%-10s %-10s %-12s %s\n" "single" "$$IMAGE_TAG" "$$VERSION" "$$RESULT" ; \
	rm -f $$VERSION_FILE ; \
	exit $$STATUS

test-e2e-debug: frontend-build
	@echo "Installing E2E test dependencies..."
	$(PIP) install -r tests/e2e/requirements.txt
	$(VENV_DIR)/bin/playwright install chromium
	@echo "Starting Docker services..."
	@echo "Pulling latest Home Assistant image..."
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml pull homeassistant
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml up -d --build --wait
	@echo "Waiting for Home Assistant..."
	@timeout 120 bash -c 'until curl -sf http://localhost:28123/api/ 2>/dev/null; do sleep 2; done' || true
	@sleep 10
	@echo "Running E2E tests with visible browser..."
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) $(VENV_DIR)/bin/pytest tests/e2e -v --browser chromium --headed --slowmo 500 || true
	@echo "Stopping Docker services..."
	HA_IMAGE_TAG=$(HA_IMAGE_TAG) HA_CONFIG_DIR=$(HA_CONFIG_DIR) docker compose -f tests/e2e/docker-compose.yml down -v

test-e2e-all: install-dev frontend-build
	@$(PYTHON) tests/e2e/scripts/run_e2e_matrix.py
format: install-dev
	$(VENV_DIR)/bin/ruff format .

frontend-install:
	cd frontend && npm install

frontend-build: frontend-install
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

release: ci test-e2e version-bump
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
	echo "Release zip created at $$zip_path. Run the following to publish:"; \
	echo "gh release create \"v$$version\" \"$$zip_path\" --title \"v$$version\" --notes-file CHANGELOG.md"

release-hotfix: ci
	@version=$$(cat $(VERSION_FILE)); \
	if ! echo "$$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$$'; then \
		echo "Invalid semver in $(VERSION_FILE): $$version"; exit 1; \
	fi; \
	if ! command -v gh >/dev/null 2>&1; then \
		echo "GitHub CLI not found. Install gh first."; exit 1; \
	fi; \
	if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "Working tree not clean. Commit or stash changes first."; exit 1; \
	fi; \
	$(MAKE) frontend-build; \
	if ! git diff --quiet; then \
		git add frontend/dist/unifi-network-map.js custom_components/unifi_network_map/frontend/unifi-network-map.js; \
		git commit -m "Rebuild card bundle for v$$version"; \
		git push origin HEAD; \
	fi; \
	git tag -f "v$$version"; \
	git push -f origin "v$$version"; \
	zip_name=$$(python3 -c 'import json; print(json.load(open("hacs.json"))["filename"])'); \
	if [ -z "$$zip_name" ]; then \
		echo "hacs.json filename is missing"; exit 1; \
	fi; \
	dist_dir="dist"; \
	mkdir -p "$$dist_dir"; \
	zip_path="$$dist_dir/$$zip_name"; \
	rm -f "$$zip_path"; \
	python3 scripts/build_release_zip.py "$$zip_path"; \
	echo "Release zip created at $$zip_path. Run the following to update the release asset:"; \
	echo "gh release upload \"v$$version\" \"$$zip_path\" --clobber"

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
	$(MAKE) frontend-build; \
	git add $(VERSION_FILE) custom_components/unifi_network_map/manifest.json frontend/package.json frontend/package-lock.json hacs.json frontend/dist/unifi-network-map.js custom_components/unifi_network_map/frontend/unifi-network-map.js; \
	git commit -m "Bump version to $$next"; \
	git tag -a "v$$next" -m "v$$next"; \
	git push origin HEAD; \
	git push origin "v$$next"

clean:
	rm -rf $(VENV_DIR)
