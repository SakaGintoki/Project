# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend + serve React build
FROM python:3.10-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Remove frontend source (not needed in production)
RUN rm -rf frontend/node_modules frontend/src frontend/public

# Copy built React assets from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["python", "main.py"]
