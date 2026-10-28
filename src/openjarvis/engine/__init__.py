"""Inference Engine primitive — LLM runtime management."""

from __future__ import annotations

import importlib

# Import engine modules to trigger @EngineRegistry.register() decorators
import openjarvis.engine.ollama  # noqa: F401
from openjarvis.engine._base import (
    EngineConnectionError,
    InferenceEngine,
    messages_to_dicts,
)
from openjarvis.engine._discovery import discover_engines, discover_models, get_engine

# Other cloud/local engines intentionally disabled: only Ollama Cloud (beam) is used.
# for _optional in ("cloud", "litellm", "gemma_cpp"):
#     try:
#         importlib.import_module(f".{_optional}", __name__)
#     except ImportError:
#         pass
__all__ = [
    "EngineConnectionError",
    "InferenceEngine",
    "discover_engines",
    "discover_models",
    "get_engine",
    "messages_to_dicts",
]
