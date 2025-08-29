#!/bin/bash

# CTF Application Restart Script
# This script stops, rebuilds, and restarts the vulnerable CTF application

set -e  # Exit on any error

echo "🔄 CTF Application Restart Script"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to cleanup existing containers and images
cleanup() {
    echo "🧹 Cleaning up existing containers and images..."
    
    # Stop and remove existing container
    if docker ps -a --format 'table {{.Names}}' | grep -q '^ctf-challenge$'; then
        echo "  - Stopping existing container..."
        docker stop ctf-challenge >/dev/null 2>&1 || true
        echo "  - Removing existing container..."
        docker rm ctf-challenge >/dev/null 2>&1 || true
    fi
    
    # Remove existing image
    if docker images --format 'table {{.Repository}}' | grep -q '^vulnerable-ctf-app$'; then
        echo "  - Removing existing image..."
        docker rmi vulnerable-ctf-app >/dev/null 2>&1 || true
    fi
    
    # Docker compose cleanup
    echo "  - Docker compose cleanup..."
    docker-compose down >/dev/null 2>&1 || true
    
    echo "  ✅ Cleanup completed"
}

# Function to setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Remove existing database
    if [ -f "database.db" ]; then
        echo "  - Removing existing database..."
        rm -f database.db
    fi
    
    # Run database setup
    echo "  - Running database initialization..."
    node database-setup.js
    
    echo "  ✅ Database setup completed"
}

# Function to build and start with Docker Compose
start_with_compose() {
    echo "🐳 Building and starting with Docker Compose..."
    
    # Build and start
    docker-compose up --build -d
    
    # Wait for container to be ready
    echo "  - Waiting for container to be ready..."
    sleep 5
    
    # Check if container is running
    if docker-compose ps | grep -q "Up"; then
        echo "  ✅ Application started successfully"
        echo "  🌐 Access the application at: http://localhost:3000"
    else
        echo "  ❌ Failed to start application"
        echo "  📋 Container logs:"
        docker-compose logs
        exit 1
    fi
}

# Function to build and start manually (alternative method)
start_manually() {
    echo "🔨 Building Docker image..."
    docker build -t vulnerable-ctf-app .
    
    echo "🚀 Starting container..."
    docker run -d -p 3000:3000 --name ctf-challenge vulnerable-ctf-app
    
    # Wait for container to be ready
    echo "  - Waiting for container to be ready..."
    sleep 5
    
    # Check if container is running
    if docker ps --format 'table {{.Names}}' | grep -q '^ctf-challenge$'; then
        echo "  ✅ Application started successfully"
        echo "  🌐 Access the application at: http://localhost:3000"
    else
        echo "  ❌ Failed to start application"
        echo "  📋 Container logs:"
        docker logs ctf-challenge
        exit 1
    fi
}

# Function to run tests
run_tests() {
    echo "🧪 Running automated tests..."
    
    # Wait a bit more for the application to be fully ready
    sleep 3
    
    # Run the test script
    if node test-sqli.js; then
        echo "  ✅ All tests passed!"
    else
        echo "  ⚠️  Some tests failed. Check the application status."
    fi
}

# Function to show application status
show_status() {
    echo ""
    echo "📊 Application Status"
    echo "===================="
    echo "🐳 Docker containers:"
    docker ps --filter "name=ctf" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "🔗 Application URL: http://localhost:3000"
    echo "🧪 Run tests: node test-sqli.js"
    echo "🛑 Stop application: docker-compose down (or docker stop ctf-challenge)"
    echo ""
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        echo "❌ Please run this script from the vulnerable-ctf-app directory"
        exit 1
    fi
    
    # Check Docker
    check_docker
    
    # Cleanup
    cleanup
    
    # Setup database
    setup_database
    
    # Choose startup method based on availability
    if [ -f "docker-compose.yml" ]; then
        start_with_compose
    else
        start_manually
    fi
    
    # Run tests
    run_tests
    
    # Show status
    show_status
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "CTF Application Restart Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --no-tests     Skip running tests"
        echo "  --cleanup-only Only cleanup, don't restart"
        echo ""
        echo "This script will:"
        echo "1. Stop and remove existing containers/images"
        echo "2. Rebuild the database"
        echo "3. Build and start the Docker container"
        echo "4. Run automated tests"
        echo "5. Show application status"
        exit 0
        ;;
    --no-tests)
        # Run main without tests
        check_docker
        cleanup
        setup_database
        if [ -f "docker-compose.yml" ]; then
            start_with_compose
        else
            start_manually
        fi
        show_status
        ;;
    --cleanup-only)
        check_docker
        cleanup
        echo "✅ Cleanup completed. Run without --cleanup-only to restart."
        ;;
    *)
        # Run main function
        main
        ;;
esac