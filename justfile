# List all available commands
default:
    just --list

# Install dependencies and build the extension
setup:
    pnpm install
    just build

# Run tests
test:
    pnpm test

# Build the extension
build:
    pnpm run build

# Clean build artifacts
teardown:
    shx rm -rf dist node_modules
