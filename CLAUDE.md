# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Formal Specification IDE** that helps engineers write correct mechanized specs and review others' specs. The application bridges human-readable specifications with formal mechanized specs (in languages like Lean4, Dafny) through automated annotation generation using AI.

## Architecture

### Full-Stack Structure
- **Frontend**: React + TypeScript (served on port 3000)
- **Backend**: Express.js + TypeScript (served on port 3001)  
- **AI Engine**: LangGraph-based agent system for annotation generation
- **Common**: Shared TypeScript types and utilities

### Key Components

#### Frontend (`frontend/src/`)
- **React Components**: Main UI components in `components/`
- **Context**: Global state management via `AppContext.tsx`
- **Hooks**: Custom React hooks for data fetching and state management
- **Services**: API client in `services/api.ts`

#### Backend (`server/src/`)
- **Express Server**: Main server in `server.ts` with REST endpoints
- **Agents System**: Core AI functionality using LangGraph workflows
  - **Graphs**: Multi-step AI workflows (annotation, chat, categorization)  
  - **Nodes**: Individual processing units in the workflow
  - **State**: Shared data structure flowing through workflows
- **Endpoints**: API handlers for dataset operations and AI functions
- **Data**: JSON-based dataset storage in `server/data/`

#### Common (`common/`)
- **API Types**: Shared TypeScript interfaces for server communication
- **Utilities**: Shared utility functions and classes

### AI Agents Architecture

The system uses **LangGraph** to implement complex AI workflows as directed graphs:

- **StateInfo**: Shared state containing LHS text (natural language), RHS text (formal spec), text blocks, annotations, and conversation history
- **Primary Workflow**: `annotateGraph` generates semantic mappings between natural language and formal specifications
- **Chat Workflow**: `chatGraph` enables conversational interaction about annotations  
- **Block Processing**: `blockCategoriesGraph` and `blockMappingsGraph` analyze text structure
- **Multi-Provider Support**: Anthropic Claude, OpenAI, and DeepSeek models

## Development Commands

### Setup
```bash
npm install                    # Install all dependencies
```

### Development 
```bash
npm start                      # Start backend server (port 3001)
npm run dev                    # Start frontend dev server (port 3000)
```

### Type Checking
```bash
npm run type-check            # Run TypeScript type checking across entire project
```

### Production Build
```bash
npm run build                 # Build frontend for production
npm run preview               # Preview production build
```

### Direct Commands (Skip Type Checking)
```bash
npm run start-skip-checks     # Start backend without type checking
npm run dev-skip-checks       # Start frontend without type checking  
```

## Environment Setup

Requires `ANTHROPIC_API_KEY` environment variable for AI functionality.

## Data Structure

Datasets are stored in `server/data/` with each dataset containing:
- `full-text.txt`: Complete specification text
- `selected-text.txt`: Selected portions for analysis  
- `annotations.json`: Generated semantic annotations
- `pdf.pdf`: Source document (optional)
- `pre-written.txt`: Pre-written annotations (optional)

## Key Files for Understanding

- `server/src/agents/agent.ts`: Core agent system and state management
- `server/src/agents/graphs/annotateGraph.ts`: Main annotation generation workflow
- `frontend/src/context/AppContext.tsx`: Frontend state management
- `common/serverAPI/`: Shared API type definitions
- `server/src/endpoints/`: REST API implementations