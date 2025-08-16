# Script to concatenate all C# files in the current directory and subdirectories.
# Useful to create a single document that can be used by LLMs.

# Define the output file
$outputFile = "AllCode.js"

# Clear the output file if it already exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Get all .cs files recursively, excluding bin and obj folders
$csFiles = Get-ChildItem -Path . -Recurse -Include *.js,*.html,*.css |
    Where-Object { $_.FullName -notmatch '\\(bin|obj)\\' }

# Loop through each file
foreach ($file in $csFiles) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)

    # Add filename header
    Add-Content -Path $outputFile -Value "`n// ===== File: $relativePath =====`n"

    # Append file contents
    Get-Content $file.FullName | Add-Content -Path $outputFile
}