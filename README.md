# Formal Specification IDE

This prototype helps engineers write correct mechanized specs and review other people's specs. Requirements for theorem proving are typically written in natural language and pen-and-paper formalizations before they are mechanized. Engineers must make sure the mechanizations capture these human-readable specifications, but engineers have little support for bridging human-readable and mechanized specs. We think we can provide valuable support through automated bookkeeping and natural-language understanding, reducing the effort and skills needed to gain confidence in a mechanized spec.

Running this prototype requires an Anthropic API key. In our experience, experimenting with the built-in examples uses API credits at a rate of cents per hour.

## Install and Setup

1. Install Node.js & npm if needed (skip if installed)
```
brew install node
```

2. Install packages
```
npm install
```

3. Add your Anthropic API key to your environment. Edit your ~/.bashrc (or equivalent) to include:
```
ANTHROPIC_API_KEY=<YOUR_API_KEY>
```

## Build and Run

1. Run the LLM backend server (runs on http://localhost:3001)
```
npm start
```

2. Build and serve the web client at http://localhost:3000 (for now, this is served separately from the LLM backend)
```
npm run dev
```

3. Visit http://localhost:3000 to see the result


### Editing annotations

To add a manual annotation, either press the A key or click the Annotate button. Then, select one or more text ranges and hit Enter to create the new annotation. Alternatively, hit Escape or click Cancel Annotation to cancel. A newly-created annotation does not have a description, but descriptions can always be edited by double-clicking the description text in the Annotations panel.
