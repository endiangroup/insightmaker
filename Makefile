run:
	@go run server.go

build:
	@docker build -t endian/insightmaker:dev .

docker-run:
	@docker run -p 8080:80 endian/insightmaker:dev
