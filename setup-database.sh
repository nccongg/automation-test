#!/bin/bash

# Database Setup Script for Automation Testing Platform
# This script initializes the database with schema and sample data

set -e

echo "🔧 Setting up Automation Testing Database..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-automation_test}
DB_USER=${DB_USER:-postgres}
export PGPASSWORD=${DB_PASSWORD:-postgres}

echo "📊 Database Configuration:"
echo "   Host: ${DB_HOST:-localhost}"
echo "   Port: ${DB_PORT:-5432}"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "📦 Checking if database exists..."
if psql -h ${DB_HOST:-localhost} -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "⚠️  Database '$DB_NAME' already exists"
else
    echo "🆕 Creating database '$DB_NAME'..."
    psql -h ${DB_HOST:-localhost} -U postgres -c "CREATE DATABASE $DB_NAME;" || {
        echo "❌ Failed to create database. Check permissions."
        exit 1
    }
    echo "✅ Database created successfully"
fi

echo ""
echo "📄 Applying schema and sample data..."
psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -f ./Automation_testing_DB.sql || {
    echo "❌ Failed to apply schema"
    exit 1
}

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Verifying setup..."
psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as project_count FROM projects;"
psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as user_count FROM users;"
psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as test_case_count FROM test_cases;"
psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as test_run_count FROM test_runs;"

echo ""
echo "🎉 Database is ready to use!"
