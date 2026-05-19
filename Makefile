APP = resume
OLLAMA_MODEL ?= llama3.2

.PHONY: setup ensure-env start-services dev prod frontend backend deploy down logs cleanup reset-db migrate pull-model shell-db

setup: ensure-env start-services migrate pull-model

start-services:
	docker compose up -d --build
	@echo "Waiting for db to be healthy..."
	@until docker compose exec db pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) > /dev/null 2>&1; do sleep 1; done

ensure-env:
	docker network create proxy 2>/dev/null || true
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$(openssl rand -hex 24)|" .env; \
		sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -hex 64)|" .env; \
		echo ".env created with generated credentials"; \
	else \
		echo ".env already exists, skipping"; \
	fi

dev: ensure-env
	docker compose up -d --build
	@echo "→ http://localhost:$$(grep DEV_PORT .env | cut -d= -f2)"

prod:
	NODE_ENV=production docker compose -f docker-compose.yml up -d --build

frontend:
	docker compose up -d --build frontend

backend:
	docker compose up -d --build backend

deploy:
	git pull
	NODE_ENV=production docker compose -f docker-compose.yml up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

cleanup:
	docker compose down -v --rmi local

reset-db:
	docker compose down -v
	$(MAKE) setup

migrate:
	docker compose exec -T db psql \
		-U $$(grep POSTGRES_USER .env | cut -d= -f2) \
		-d $$(grep POSTGRES_DB .env | cut -d= -f2) \
		< backend/src/db/schema.sql
	@for f in $$(ls backend/src/db/migrations/*.sql 2>/dev/null | sort); do \
		echo "Applying $$f..."; \
		docker compose exec -T db psql \
			-U $$(grep POSTGRES_USER .env | cut -d= -f2) \
			-d $$(grep POSTGRES_DB .env | cut -d= -f2) \
			< $$f; \
	done

pull-model:
	docker compose exec ollama ollama pull $(OLLAMA_MODEL)

shell-db:
	docker compose exec db psql -U $$(grep POSTGRES_USER .env | cut -d= -f2) $$(grep POSTGRES_DB .env | cut -d= -f2)
