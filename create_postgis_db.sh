#!/bin/bash

# Variables
USER="postgres"  # Utilisateur PostgreSQL
PASSWORD="postgres"  # Mot de passe de l'utilisateur PostgreSQL
HOST="postgis.dev.smp.ceo"  # Hôte du gestionnaire de base de données
PORT="5432"  # Port PostgreSQL par défaut, ajustez selon votre configuration
DATABASES=("smp_gateway" "smp_location" "smp_organization" "smp_document" "smp_userspace" "smp_catalog" "smp_accounting" "smp_audits" "smp_reviews" "smp_notification" "smp_authentication" "smp_comment" "smp_recsys" "smp_webapp" )  # Liste prédéfinie de noms de bases de données
USERS=("smp_gateway_u" "smp_location_u" "smp_organization_u" "smp_document_u" "smp_userspace_u" "smp_catalog_u" "smp_accounting_u" "smp_audits_u" "smp_reviews_u" "smp_notification_u" "smp_authentication_u" "smp_comment_u" "smp_recsys_u" "smp_webapp_u" )  # Liste prédéfinie de noms de bases de données
USERS=("smp_gateway_u" "smp_location_u" "smp_organization_u" "smp_document_u" "smp_userspace_u" "smp_catalog_u" "smp_accounting_u" "smp_audits_u" "smp_reviews_u" "smp_notification_u" "smp_authentication_u" "smp_comment_u" "smp_recsys_u" "smp_webapp_u" )  # Liste prédéfinie de noms de bases de données
USERS=("user1" "user2" "user3")  # Liste prédéfinie de noms d'utilisateurs
PASSWORDS=("password1" "password2" "password3")  # Liste prédéfinie de mots de passe
EXTENSIONS=("pg_stat_statements" "pg_partman" "pg_prewarm")  # Extensions à installer

# Vérification que les listes ont la même longueur
if [[ ${#DATABASES[@]} != ${#USERS[@]} || ${#DATABASES[@]} != ${#PASSWORDS[@]} ]]; then
    echo "Erreur : Les listes DATABASES, USERS et PASSWORDS doivent avoir la même longueur."
    exit 1
fi

# Boucle pour créer les bases de données, les utilisateurs et activer les extensions
for ((i=0; i<${#DATABASES[@]}; i++)); do
    dbname="${DATABASES[$i]}"
    username="${USERS[$i]}"
    userpassword="${PASSWORDS[$i]}"

    # Création de la base de données
    sudo -u $USER psql -h $HOST -p $PORT -c "CREATE DATABASE $dbname;"
    # Création de l'utilisateur avec mot de passe défini
    sudo -u $USER psql -h $HOST -p $PORT -c "CREATE USER $username WITH ENCRYPTED PASSWORD '$userpassword';"
    # Attribution des privilèges à l'utilisateur sur la base de données
    sudo -u $USER psql -h $HOST -p $PORT -c "GRANT ALL PRIVILEGES ON DATABASE $dbname TO $username;"

    sudo -u $USER psql -h $HOST -p $PORT -c "GRANT CONNECT ON DATABASE $dbname TO $username CREATEDB;"
    # Attribution de la base de données à l'utilisateur
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER DATABASE OWNER TO $username;"

    # Set client encoding to UTF-8
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER ROLE $username SET client_encoding TO 'utf8';"
    # Set default_transaction_isolation to read committed
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER ROLE $username SET default_transaction_isolation TO 'read committed';"
    # Set timezone to UTC
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER ROLE $username SET timezone TO 'UTC';"
    # Alter User as SuperUser
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER USER $username WITH SUPERUSER;"
    # Alter user to provide createdb
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "ALTER USER $username CREATEDB;"
    # Alter user to provide create role
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "DEFAULT PRIVILEGES FOR USER $username IN SCHEMA public;"
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $username;"
    sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $username;"
    # Installation des extensions supplémentaires
    for ext in "${EXTENSIONS[@]}"; do
        sudo -u $USER psql -h $HOST -p $PORT -d $dbname -c "CREATE EXTENSION IF NOT EXISTS $ext;"
    done
done
