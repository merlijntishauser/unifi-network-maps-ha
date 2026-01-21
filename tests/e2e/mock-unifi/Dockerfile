FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir aiohttp

COPY server.py .
COPY fixtures/ ./fixtures/

EXPOSE 8443

HEALTHCHECK --interval=2s --timeout=5s --retries=10 --start-period=5s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8443/status')" || exit 1

CMD ["python", "server.py"]
