# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React-based web application for prompt-class generation with a Python Flask backend. The application enables users to create and manage visual layouts with AI-generated content.

### Frontend Architecture (React)

- **Main Components**: 
  - `App.js`: Root component handling session state and routing between landing page and main UI
  - `AppUI.js`: Main application interface with three-board layout system
  - `LandingPage.js`: Initial user onboarding and condition selection

- **Board System**: The core UI consists of three interactive boards:
  - `LayoutBoard.js`: Main canvas for visual layout creation and editing using ReactFlow
  - `BaselineLayoutBoard.js`: Simplified baseline version of the layout system  
  - `ClassTreeBoard.js`: Manages class hierarchy and instance creation
  - `InstanceBoard.js`: Displays and manages individual instances

- **Context Management**:
  - `ImageContext.js`: Global state for images and captions
  - `ClassContext.js`: Complex state management for classes, instances, placeholders, and inheritance relationships

- **API Integration**: All API calls are in `src/api/` directory:
  - `generateImage.js`: Communicates with backend for AI image generation
  - `generateDescription.js`: Generates descriptions for regions
  - `generatePlaceholders.js`: Creates template placeholders
  - `generateTextToGraph.js`: Converts text to scene graph structures
  - `logEvent.js`: Frontend event logging

### Backend Architecture (Python/Flask)

- **Server**: `backend/server.py` - Flask server with CORS enabled
- **Key Endpoints**:
  - `/generate`: AI image generation using diffusion models
  - `/generate-caption`: Caption generation and refinement
  - `/describe`: Region description from cropped images
  - `/progress`: Real-time generation progress tracking
  - `/api/log`: Event logging from frontend

- **AI Models**: Located in `backend/src/`:
  - Custom diffusion pipeline implementations (Flux, SD3)
  - Attention processors with SiamLayout architecture
  - Transformer models for layout-aware generation

- **Dependencies**: Uses PyTorch, Diffusers, Transformers, OpenAI API, and Flask

### Key Features

1. **Dual System Architecture**: Users can switch between System 1 (baseline) and System 2 (advanced) layouts
2. **Class-Instance Pattern**: Create reusable class templates with placeholders that can generate multiple instances
3. **Scene Graph Management**: Complex data structures representing object relationships and attributes
4. **Real-time Generation**: Progress tracking for AI model inference
5. **Drag-and-Drop Interface**: ReactFlow-based visual editing with resizable nodes
6. **Override System**: Instances can override class properties while maintaining inheritance

### Development Notes

- The application uses session storage for user state persistence
- ReactFlow is used for the visual layout editor with custom node types
- Backend generates timestamped output directories for each generation
- Extensive logging system tracks user interactions and system events
- The codebase includes Korean comments in some areas

### Environment Variables

Set `REACT_APP_API_BASE_URL` to point to the backend server (defaults to backend endpoints).

### Build Output

The React build output is served by the Flask backend for production deployment.