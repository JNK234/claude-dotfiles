#!/bin/bash

# Run tests for InferenceMD API
# Usage: ./run_tests.sh [options]

# Function to display help
function show_help {
    echo "Usage: ./run_tests.sh [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -u, --unit        Run unit tests only"
    echo "  -i, --integration Run integration tests only"
    echo "  -e, --e2e         Run end-to-end tests only"
    echo "  -a, --all         Run all tests (default)"
    echo "  -v, --verbose     Show verbose output"
    echo "  -c, --coverage    Generate coverage report"
    echo ""
    echo "Examples:"
    echo "  ./run_tests.sh -u            # Run unit tests only"
    echo "  ./run_tests.sh -i -v         # Run integration tests with verbose output"
    echo "  ./run_tests.sh -c            # Run all tests and generate coverage report"
}

# Default values
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_E2E=false
VERBOSE=""
COVERAGE=""

# Parse arguments
if [ $# -eq 0 ]; then
    # Default to running all tests if no arguments provided
    RUN_UNIT=true
    RUN_INTEGRATION=true
    RUN_E2E=true
else
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -u|--unit)
                RUN_UNIT=true
                shift
                ;;
            -i|--integration)
                RUN_INTEGRATION=true
                shift
                ;;
            -e|--e2e)
                RUN_E2E=true
                shift
                ;;
            -a|--all)
                RUN_UNIT=true
                RUN_INTEGRATION=true
                RUN_E2E=true
                shift
                ;;
            -v|--verbose)
                VERBOSE="-v"
                shift
                ;;
            -c|--coverage)
                COVERAGE="--cov=app --cov-report=term --cov-report=html"
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
fi

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "Error: pytest is not installed."
    echo "Please run 'pip install -r requirements.txt' to install the required dependencies."
    exit 1
fi

# Set test paths based on options
TEST_PATHS=""

if [ "$RUN_UNIT" = true ]; then
    TEST_PATHS="$TEST_PATHS tests/unit"
fi

if [ "$RUN_INTEGRATION" = true ]; then
    TEST_PATHS="$TEST_PATHS tests/integration"
fi

if [ "$RUN_E2E" = true ]; then
    TEST_PATHS="$TEST_PATHS tests/e2e"
fi

# Run the tests
echo "Running tests for InferenceMD API..."
echo "-----------------------------------"
python -m pytest $VERBOSE $COVERAGE $TEST_PATHS

# Check if test execution was successful
TEST_EXIT_CODE=$?
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "-----------------------------------"
    echo "All tests passed successfully!"
    
    # Show coverage report location if generated
    if [ -n "$COVERAGE" ]; then
        echo "Coverage report generated in htmlcov/index.html"
    fi
    
    exit 0
else
    echo "-----------------------------------"
    echo "Tests failed with exit code $TEST_EXIT_CODE"
    exit $TEST_EXIT_CODE
fi
