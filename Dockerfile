FROM postgres:latest

# Copier le fichier SQL d'initialisation
COPY init.sql /docker-entrypoint-initdb.d/

# Définir les variables d'environnement
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=athao03200
ENV POSTGRES_DB=expense_db
