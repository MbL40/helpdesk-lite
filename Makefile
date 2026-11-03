.PHONY: test

test:
	docker compose up -d --build
	docker compose --profile test run --build --rm api-test
	docker compose --profile test run --rm web-test
