# LibSignal Specifications

Experiments with multifile block mapping.

## Introduction

Original specifications from the Signal team can be found here: https://signal.org/docs/specifications/x3dh/

The natural language documentation can be found in `text` folder. The files have been converted to markdown by first downloading the html file before asking Cursor to translate it to markdown.

## Block mappings

Blocks in the natural language text and in the formal Rust code are defined to be continuous segments which are separated by a newline, some white space (spaces, tabs and newlines) and another newline.

We look for matchings between the blocks, so that specification engineers can easily find text blocks which are related to a given code block, or code blocks which are related to a given text block.

The file `annotations-from-code.json` provides the top two text matches (by looking up a vector database of semantic embeddings of blocks) for each code block. Similarly, the file `annotation-from-text.json` gives the top two code matches for each text block.


