import os
import sys

def print_file_content(file_path, language="", remove_backticks=False):
    print(f"{file_path}:")
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            if language:
                print(f"```{language}")
            else:
                print("```")
            if (remove_backticks):
                content = content.replace('`', '')
            print(content)
            print("```")
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
    print("")

def omit_file_content(file_path, language=""):
    print(f"{file_path}:")
    print("[Content omitted. File is too large.]")
    print("")

def print_file_tree():
    print("```text")
    sys.stdout.flush()
    os.system("tree --gitignore")
    print("```")
    print("")

def print_files():
    # ├── README.md
    # ├── TODO.md    [SKIP]
    print_file_content("./README.md", "markdown", True)

    # ├── common
    # │   └── annotations.ts
    # │   └── util
    # │       ├── Counter.ts
    # │       └── timeUtils.ts
    print_file_content("./common/annotations.ts", "typescript")
    print_file_content("./common/util/Counter.ts", "typescript")
    print_file_content("./common/util/timeUtils.ts", "typescript")

    # ├── frontend
    # │   ├── index.html
    print_file_content("./frontend/index.html", "html")
    # │   ├── public
    # │   │   └── data
    # │   │       ├── SHA-1
    # │   │       │   ├── annotations.json
    # │   │       │   ├── full-text.txt      [OMIT]
    # │   │       │   ├── pdf.pdf            [SKIP]
    # │   │       │   ├── pre-written.txt
    # │   │       │   └── selected-text.txt
    # │   │       └── simpleText
    # │   │           ├── annotations.json
    # │   │           ├── full-text.txt
    # │   │           ├── pdf.pdf            [SKIP]
    # │   │           ├── pre-written.txt
    # │   │           └── selected-text.txt
    print_file_content("./frontend/public/data/SHA-1/annotations.json", "json")
    omit_file_content("./frontend/public/data/SHA-1/full-text.txt", "text")
    print_file_content("./frontend/public/data/SHA-1/pre-written.txt", "text")
    print_file_content("./frontend/public/data/SHA-1/selected-text.txt", "text")
    print_file_content("./frontend/public/data/simpleText/annotations.json", "json")
    print_file_content("./frontend/public/data/simpleText/full-text.txt", "text")
    print_file_content("./frontend/public/data/simpleText/pre-written.txt", "text")
    print_file_content("./frontend/public/data/simpleText/selected-text.txt", "text")
    # │   ├── src
    # │   │   ├── AnnotationLookup.ts
    # │   │   ├── AnnotationsSlice.ts
    # │   │   ├── TabState.ts
    # │   │   ├── TextPartitionIndices.ts
    # │   │   └── index.ts
    # │   └── tsconfig.json
    print_file_content("./frontend/src/AnnotationLookup.ts", "typescript")
    print_file_content("./frontend/src/AnnotationsSlice.ts", "typescript")
    print_file_content("./frontend/src/TabState.ts", "typescript")
    print_file_content("./frontend/src/TextPartitionIndices.ts", "typescript")
    print_file_content("./frontend/src/index.ts", "typescript")
    print_file_content("./frontend/tsconfig.json", "json")

    # ├── package-lock.json           [SKIP]
    # ├── package.json
    # ├── printProjectDescription.py  [SKIP]
    # ├── scratchwork.md              [SKIP]
    print_file_content("./package.json", "json")

    # ├── server
    # │   ├── src
    # │   │   ├── Logger.ts
    # │   │   ├── annotation
    # │   │   │   ├── annotate.ts
    # │   │   │   ├── cachedClaudeResponse.txt
    # │   │   │   └── prompt.ts
    # │   │   └── server.ts
    # │   └── tsconfig.json
    print_file_content("./server/src/Logger.ts", "typescript")
    print_file_content("./server/src/annotation/annotate.ts", "typescript")
    print_file_content("./server/src/annotation/cachedClaudeResponse.txt", "text")
    print_file_content("./server/src/annotation/prompt.ts", "typescript")
    print_file_content("./server/src/server.ts", "typescript")
    print_file_content("./server/tsconfig.json", "json")

    # ├── tsconfig.json
    # └── vite.config.ts
    print_file_content("./tsconfig.json", "json")
    print_file_content("./vite.config.ts", "typescript")

def main():
    print("I'm building a web app. My project includes the following files:")
    print("")
    print_file_tree()
    print_files()
    print("Let's collaborate on this tool. Whenever you provide code, please show only the code edits. For large blocks of 100% code additions, just show the code additions. For all other code changes, show code diffs.")

if __name__ == "__main__":
    main()

