#!/bin/bash

# Initialize global counters
dir_count=0
file_count=0

function list_files() {
    local prefix="$1"
    local dir="$2"
    
    # Create array of files/dirs in current directory, excluding patterns
    local files=()
    while IFS= read -r -d $'\0' file; do
        files+=("$file")
    done < <(find "$dir" -maxdepth 1 -not -path '*/\.*' -not -path '*/node_modules*' \
                                    -not -path '*/dist*' -not -path '*/build*' \
                                    -not -path '*/coverage*' -print0)
    
    # Return if no files found
    [ ${#files[@]} -eq 0 ] && return
    
    # Sort files array
    IFS=$'\n' sorted=($(sort <<<"${files[*]}"))
    unset IFS
    
    # Process each file/directory
    for item in "${sorted[@]}"; do
        # Skip if item is the current directory
        [ "$item" = "$dir" ] && continue
        
        if [ -d "$item" ]; then
            # If it's a directory, print it and recurse into it
            echo "${prefix}├── $(basename "$item")/"
            ((dir_count++))
            list_files "$prefix│   " "$item"
        else
            # If it's a file, just print it
            echo "${prefix}├── $(basename "$item")"
            ((file_count++))
        fi
    done
}

# Start the recursion from the current directory
echo "."
list_files "" "."
echo
echo "$dir_count directories, $file_count files"
