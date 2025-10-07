#!/bin/bash

# PlantUML to PNG Converter with MD5 Caching
# Usage: ./plantuml_converter.sh <source_folder> <output_folder>

set -e  # Exit on any error

# Check if required arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <source_folder> <output_folder>"
    echo "Example: $0 /path/to/plantuml/files /path/to/output/folder"
    exit 1
fi

SOURCE_FOLDER="$1"
OUTPUT_FOLDER="$2"

# Check if source folder exists
if [ ! -d "$SOURCE_FOLDER" ]; then
    echo "Error: Source folder '$SOURCE_FOLDER' does not exist."
    exit 1
fi

# Check if PlantUML is installed (try latest version first, then fall back to system version)
PLANTUML_CMD=""
if command -v plantuml-latest &> /dev/null; then
    PLANTUML_CMD="plantuml-latest"
    echo "Using latest PlantUML version (supports themes and latest features)"
elif command -v plantuml &> /dev/null; then
    PLANTUML_CMD="plantuml"
    echo "Using system PlantUML version (may not support all features like !theme)"
    echo "Consider installing the latest version for full feature support"
else
    echo "Error: PlantUML is not installed."
    echo "Please install it using: sudo apt-get install plantuml"
    echo "Or for latest features, download the JAR file from: https://github.com/plantuml/plantuml/releases/latest"
    exit 1
fi

# Get the absolute paths
SOURCE_FOLDER=$(realpath "$SOURCE_FOLDER")
OUTPUT_FOLDER=$(realpath -m "$OUTPUT_FOLDER")  # -m allows non-existent paths

echo "Source folder: $SOURCE_FOLDER"
echo "Output folder: $OUTPUT_FOLDER"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_FOLDER"

# MD5 cache file location
CACHE_FILE="$OUTPUT_FOLDER/.plantuml_cache.md5"

# Load existing cache into associative array
declare -A MD5_CACHE
if [ -f "$CACHE_FILE" ]; then
    echo "Loading cache from previous run..."
    while IFS='|' read -r file_path md5_hash; do
        MD5_CACHE["$file_path"]="$md5_hash"
    done < "$CACHE_FILE"
    echo "Loaded ${#MD5_CACHE[@]} cached entries"
fi

# Counter for processed files (use temp files since we're in a subshell)
TEMP_DIR=$(mktemp -d)
PROCESSED_FILE="$TEMP_DIR/processed"
SKIPPED_FILE="$TEMP_DIR/skipped"
ERRORS_FILE="$TEMP_DIR/errors"
NEW_CACHE_FILE="$TEMP_DIR/new_cache"
echo "0" > "$PROCESSED_FILE"
echo "0" > "$SKIPPED_FILE"
echo "0" > "$ERRORS_FILE"
touch "$NEW_CACHE_FILE"

# Function to calculate MD5 hash of a file
calculate_md5() {
    local file="$1"
    if command -v md5sum &> /dev/null; then
        md5sum "$file" | awk '{print $1}'
    elif command -v md5 &> /dev/null; then
        md5 -q "$file"
    else
        echo "ERROR: No MD5 utility found"
        exit 1
    fi
}

# Function to process a single PlantUML file
process_file() {
    local src_file="$1"
    local rel_path="$2"
    
    # Calculate current MD5
    current_md5=$(calculate_md5 "$src_file")
    
    # Get the directory structure relative to source
    rel_dir=$(dirname "$rel_path")
    
    # Create corresponding directory in output folder
    if [ "$rel_dir" != "." ]; then
        mkdir -p "$OUTPUT_FOLDER/$rel_dir"
    fi
    
    # Get filename without extension
    filename=$(basename "$src_file" | sed 's/\.[^.]*$//')
    
    # Determine output path
    if [ "$rel_dir" != "." ]; then
        output_file="$OUTPUT_FOLDER/$rel_dir/$filename.png"
    else
        output_file="$OUTPUT_FOLDER/$filename.png"
    fi
    
    # Check if file needs processing
    cached_md5="${MD5_CACHE[$rel_path]}"
    
    if [ -f "$output_file" ] && [ "$cached_md5" == "$current_md5" ]; then
        echo "Skipping (unchanged): $rel_path"
        SKIPPED=$(cat "$SKIPPED_FILE")
        echo $((SKIPPED + 1)) > "$SKIPPED_FILE"
        # Add to new cache
        echo "$rel_path|$current_md5" >> "$NEW_CACHE_FILE"
        return
    fi
    
    if [ -f "$output_file" ] && [ -n "$cached_md5" ]; then
        echo "Processing (modified): $rel_path"
    else
        echo "Processing (new): $rel_path"
    fi
    
    # Convert PlantUML to PNG
    if $PLANTUML_CMD -tpng "$src_file" -o "$(dirname "$output_file")" 2>/dev/null; then
        # PlantUML creates the PNG with the same name as the source file
        # We need to move it to our desired location if it's different
        plantuml_output="$(dirname "$output_file")/$filename.png"
        if [ "$plantuml_output" != "$output_file" ]; then
            mv "$plantuml_output" "$output_file" 2>/dev/null || true
        fi
        
        if [ -f "$output_file" ]; then
            echo "  ✓ Created: $output_file"
            PROCESSED=$(cat "$PROCESSED_FILE")
            echo $((PROCESSED + 1)) > "$PROCESSED_FILE"
            # Add to new cache with current MD5
            echo "$rel_path|$current_md5" >> "$NEW_CACHE_FILE"
        else
            echo "  ✗ Failed to create: $output_file"
            ERRORS=$(cat "$ERRORS_FILE")
            echo $((ERRORS + 1)) > "$ERRORS_FILE"
        fi
    else
        echo "  ✗ Error processing: $src_file"
        ERRORS=$(cat "$ERRORS_FILE")
        echo $((ERRORS + 1)) > "$ERRORS_FILE"
    fi
}

# Export the function and variables so they can be used by the subshell
export -f process_file
export -f calculate_md5
export SOURCE_FOLDER
export OUTPUT_FOLDER
export PLANTUML_CMD
export TEMP_DIR
export PROCESSED_FILE
export SKIPPED_FILE
export ERRORS_FILE
export NEW_CACHE_FILE
# Export the associative array
export MD5_CACHE_DUMP=$(declare -p MD5_CACHE)

echo "Searching for PlantUML files..."

# Find and count all PlantUML files first
TOTAL_FILES=$(find "$SOURCE_FOLDER" -type f \( -name "*.puml" -o -name "*.plantuml" -o -name "*.pu" \) | wc -l)
echo "Found $TOTAL_FILES PlantUML files to process"

echo ""
echo "Starting conversion..."

# Find all PlantUML files and process them
while IFS= read -r file; do
    # Recreate the associative array in the subshell
    eval "$MD5_CACHE_DUMP"
    
    # Calculate relative path from source folder
    rel_path=$(realpath --relative-to="$SOURCE_FOLDER" "$file")
    process_file "$file" "$rel_path"
done < <(find "$SOURCE_FOLDER" -type f \( -name "*.puml" -o -name "*.plantuml" -o -name "*.pu" \))

echo ""
echo "Conversion completed!"

# Read final counts
PROCESSED=$(cat "$PROCESSED_FILE")
SKIPPED=$(cat "$SKIPPED_FILE")
ERRORS=$(cat "$ERRORS_FILE")

echo "Files processed: $PROCESSED"
echo "Files skipped (unchanged): $SKIPPED"
if [ $ERRORS -gt 0 ]; then
    echo "Files with errors: $ERRORS"
fi

# Save the new cache
mv "$NEW_CACHE_FILE" "$CACHE_FILE"
echo "Cache updated: $CACHE_FILE"

echo "Output directory: $OUTPUT_FOLDER"

# Clean up temp files
rm -rf "$TEMP_DIR"

# List the output structure
echo ""
echo "Output folder structure:"
if command -v tree &> /dev/null; then
    tree "$OUTPUT_FOLDER" -I ".plantuml_cache.md5"
else
    find "$OUTPUT_FOLDER" -type f -name "*.png" | sort
fi