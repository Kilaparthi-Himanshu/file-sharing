from pathlib import Path
import tkinter as tk

ROOTS = [
    Path(r"D:\VS Code Projects\File Sharing\file-sharing\app\components\Instant"),
    Path(r"D:\VS Code Projects\File Sharing\file-sharing\lib\instant"),
]

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
}

# File extensions we want to include
ALLOWED_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".css",
    ".scss",
    ".html",
    ".md",
}

files = []

for root in ROOTS:
    if not root.exists():
        print(f"WARNING: Path does not exist: {root}")
        continue

    for path in root.rglob("*"):
        if not path.is_file():
            continue

        # Skip files inside unwanted directories
        if any(part in SKIP_DIRS for part in path.parts):
            continue

        # Only include known source/text files
        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        files.append(path)

# Sort files so the output is consistent
files.sort(key=lambda p: str(p).lower())

output = []

for file in files:
    try:
        content = file.read_text(encoding="utf-8")

        # output.append(
        #     f"\n{'=' * 80}\n"
        #     f"FILE: {file}\n"
        #     f"{'=' * 80}\n\n"
        #     f"{content}\n"
        # ) # With file names

        output.append(content) # Without file names

    except UnicodeDecodeError:
        print(f"Skipped non-UTF8 file: {file}")
    except Exception as e:
        print(f"Error reading {file}: {e}")

final_text = "\n".join(output)

# Copy to Windows clipboard
root = tk.Tk()
root.withdraw()

root.clipboard_clear()
root.clipboard_append(final_text)
root.update()

print(f"Copied {len(files)} files to clipboard.")
print(f"Total characters: {len(final_text):,}")
print("\nFiles:")

for file in files:
    print(f"  - {file}")

# Keep Tk alive briefly so clipboard ownership is safely established
root.after(1000, root.destroy)
root.mainloop()

print("\nDone. Everything is now in your clipboard.")
