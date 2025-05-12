FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
EXPOSE 8081
# Use gunicorn for production
CMD ["gunicorn", "--workers=4", "--bind=0.0.0.0:8081", "--log-level=debug", "app:app"]
