# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React-based web application for prompt-class generation with a Python Flask backend implementing CreatiLayout, a layout-to-image framework using diffusion transformers. The application enables users to create and manage visual layouts with AI-generated content through a dual-system interface.

### Frontend Architecture (React)

**Core Application Flow**:
- `App.js`: Root component managing session state and routing between landing page and main UI
- `AppUI.js`: Main application interface with dual-system toggle (System 1/baseline vs System 2/advanced)
- `LandingPage.js`: Initial condition selection for baseline/advanced mode

**Board System**: Three-board layout with synchronized state:
- `LayoutBoard.js`: Advanced ReactFlow-based canvas with class-instance pattern
- `BaselineLayoutBoard.js`: Simplified version for baseline interactions
- `ClassTreeBoard.js`: Class hierarchy management with expandable library
- `InstanceBoard.js`: Instance display and selection interface

**Context Management**:
- `ImageContext.js`: Global image and caption state
- `ClassContext.js`: Complex state for classes, instances, placeholders, inheritance, and scene graphs

**API Layer** (`src/api/`):
- `generateImage.js`: Backend integration for AI image generation
- `generateDescription.js`: Region description generation
- `generatePlaceholders.js`: Template placeholder creation
- `generateTextToGraph.js`: Text-to-scene-graph conversion
- `logEvent.js`: Frontend event logging

### Backend Architecture (Python/Flask)

**Core Server** (`backend/server.py`):
- Flask server with CORS, serving both API and React build
- Real-time progress tracking with threading locks
- Timestamped output directory structure

**Key Endpoints**:
- `/generate`: CreatiLayout diffusion model inference
- `/generate-caption`: OpenAI-powered caption generation and refinement
- `/describe`: Region description from cropped images
- `/progress`: Real-time generation progress
- `/api/log`: Event logging from frontend

**CreatiLayout Integration** (`backend/src/`):
- SiamLayout diffusion transformer implementation
- Multiple model variants: SD3, SD3-LoRA, FLUX
- Custom attention processors and pipelines in `backend/src/`

**Model Architecture**:
- `pipeline/`: CreatiLayout pipelines for FLUX and SD3
- `models/`: Transformer and attention processor implementations
- Supports layout-to-image generation with bounding box control

### Development Commands

**Frontend (React)**:
```bash
npm start          # Development server on localhost:3000
npm run build      # Production build 
npm test           # Run Jest tests
```

**Backend (Python)**:
```bash
cd backend
python server.py  # Start Flask server (debug mode)
pip install -r requirements.txt  # Install dependencies
```

### Key Architecture Patterns

1. **Dual System Design**: Baseline vs Advanced mode with shared state management
2. **Class-Instance Pattern**: Reusable templates with placeholder substitution and inheritance
3. **Scene Graph Architecture**: Complex object relationships with spatial and attribute constraints
4. **ReactFlow Integration**: Custom nodes, handles, and real-time layout editing
5. **Session Persistence**: Browser session storage for user state
6. **Timestamped Outputs**: All generations saved with metadata for debugging

### Dependencies & Environment

**Frontend**: React 19, ReactFlow, Bootstrap, Axios, OpenAI client
**Backend**: Flask, PyTorch, Diffusers, Transformers, OpenAI API
**Models**: CreatiLayout (Stable Diffusion 3, FLUX.1-dev variants)

Set `REACT_APP_API_BASE_URL` for backend endpoint configuration.