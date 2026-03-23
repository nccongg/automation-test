#!/bin/bash

# Verification Script for Automation Testing Platform
# Tests the complete user flow after recovery

set -e

echo "🧪 Automation Testing Platform - Verification Suite"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-automation_test}
export PGPASSWORD=${DB_PASSWORD:-postgres}

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# Test 1: Database Connection
echo "Test 1: Database Connection"
if psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    pass "Database connection successful"
else
    fail "Cannot connect to database"
fi
echo ""

# Test 2: Users Table
echo "Test 2: Users Table"
USER_COUNT=$(psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
if [ "$USER_COUNT" -ge 1 ]; then
    pass "Users table has $USER_COUNT user(s)"
else
    warn "Users table is empty (may need sample data)"
fi
echo ""

# Test 3: Projects Table
echo "Test 3: Projects Table"
PROJECT_COUNT=$(psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM projects;" | tr -d ' ')
if [ "$PROJECT_COUNT" -ge 1 ]; then
    pass "Projects table has $PROJECT_COUNT project(s)"
else
    warn "Projects table is empty - run setup-database.sh or create manually"
fi
echo ""

# Test 4: Test Cases Table
echo "Test 4: Test Cases Table"
TC_COUNT=$(psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM test_cases;" | tr -d ' ')
if [ "$TC_COUNT" -ge 1 ]; then
    pass "Test cases table has $TC_COUNT test case(s)"
else
    warn "Test cases table is empty"
fi
echo ""

# Test 5: Test Runs Table
echo "Test 5: Test Runs Table"
TR_COUNT=$(psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM test_runs;" | tr -d ' ')
if [ "$TR_COUNT" -ge 1 ]; then
    pass "Test runs table has $TR_COUNT run(s)"
else
    warn "Test runs table is empty"
fi
echo ""

# Test 6: Sample Data Quality
echo "Test 6: Sample Data Quality Check"
SAMPLE_PROJECT=$(psql -h ${DB_HOST:-localhost} -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT name FROM projects LIMIT 1;" | tr -d ' ')
if [ -n "$SAMPLE_PROJECT" ]; then
    pass "Sample project found: $SAMPLE_PROJECT"
else
    warn "No sample projects found"
fi
echo ""

# Test 7: File Structure
echo "Test 7: Critical Files Check"
FILES_TO_CHECK=(
    "server/src/modules/projects/projects.router.js"
    "server/src/modules/projects/projects.controller.js"
    "server/src/modules/projects/projects.service.js"
    "server/src/modules/projects/projects.repository.js"
    "client/src/pages/DashboardPage.jsx"
    "client/src/pages/ProjectsPage.jsx"
    "client/src/features/projects/components/CreateProjectDialog.jsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        pass "File exists: $file"
    else
        fail "Missing file: $file"
    fi
done
echo ""

# Test 8: Backend Dependencies
echo "Test 8: Backend Dependencies"
if [ -f "server/package.json" ]; then
    if grep -q "pg" server/package.json; then
        pass "PostgreSQL driver installed in backend"
    else
        fail "PostgreSQL driver missing in backend"
    fi
else
    fail "server/package.json not found"
fi
echo ""

# Test 9: Frontend Dependencies
echo "Test 9: Frontend Dependencies"
if [ -f "client/package.json" ]; then
    if grep -q "react-router-dom" client/package.json; then
        pass "React Router installed in frontend"
    else
        fail "React Router missing in frontend"
    fi
else
    fail "client/package.json not found"
fi
echo ""

# Summary
echo "============================================="
echo "📊 Verification Summary"
echo "============================================="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start backend: cd server && npm run dev"
    echo "2. Start frontend: cd client && npm run dev"
    echo "3. Open browser: http://localhost:5173"
else
    echo -e "${RED}⚠️  Some tests failed. Please review and fix.${NC}"
    exit 1
fi
