FROM python:3.11-slim

WORKDIR /app

# ✅ Fix encodage UTF-8 pour les emojis
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3005

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3005"]