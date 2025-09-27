#!/bin/bash

# PlantUML to PNG Converter
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

# Counter for processed files
PROCESSED=0
ERRORS=0

# Function to process a single PlantUML file
process_file() {
    local src_file="$1"
    local rel_path="$2"
    
    echo "Processing: $rel_path"
    
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
            ((PROCESSED++))
        else
            echo "  ✗ Failed to create: $output_file"
            ((ERRORS++))
        fi
    else
        echo "  ✗ Error processing: $src_file"
        ((ERRORS++))
    fi
}

# Export the function so it can be used by find
export -f process_file
export SOURCE_FOLDER
export OUTPUT_FOLDER
export PROCESSED
export ERRORS

echo "Searching for PlantUML files..."

# Find all PlantUML files and process them
while IFS= read -r -d '' file; do
    # Calculate relative path from source folder
    rel_path=$(realpath --relative-to="$SOURCE_FOLDER" "$file")
    process_file "$file" "$rel_path"
done < <(find "$SOURCE_FOLDER" -type f \( -name "*.puml" -o -name "*.plantuml" -o -name "*.pu" \) -print0)

echo ""
echo "Conversion completed!"
echo "Files processed successfully: $PROCESSED"
if [ $ERRORS -gt 0 ]; then
    echo "Files with errors: $ERRORS"
fi
echo "Output directory: $OUTPUT_FOLDER"

# List the output structure
echo ""
echo "Output folder structure:"
if command -v tree &> /dev/null; then
    tree "$OUTPUT_FOLDER"
else
    find "$OUTPUT_FOLDER" -type f -name "*.png" | sort
fi