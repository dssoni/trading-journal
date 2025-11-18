FROM ubuntu:latest
LABEL authors="dhruvsoni"

ENTRYPOINT ["top", "-b"]