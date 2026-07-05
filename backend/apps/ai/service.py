from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from django.conf import settings

AI_MODEL_DIR = Path(settings.BASE_DIR) / 'ai_models'


def _build_placeholder_prediction(model_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    model_path = AI_MODEL_DIR / f'{model_name}.keras'

    # TODO: import tensorflow as tf
    # TODO: load the .keras model from model_path with tf.keras.models.load_model(...)
    # TODO: preprocess the incoming payload, run model inference, and normalize the output scores
    # TODO: postprocess the prediction into the API response contract used by the frontend

    return {
        'model_name': model_name,
        'model_path': str(model_path),
        'loaded': False,
        'predicted': False,
        'status': 'placeholder',
        'confidence': 0.0,
        'summary': 'Prediction layer is scaffolded. TensorFlow inference will be added here later.',
        'payload': payload,
    }


@lru_cache(maxsize=1)
def _ensure_model_directory() -> Path:
    AI_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    return AI_MODEL_DIR


def predict_efficientnet(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_model_directory()
    return _build_placeholder_prediction('efficientnet', payload)


def predict_densenet(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_model_directory()
    return _build_placeholder_prediction('densenet', payload)


def predict_cnn(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure_model_directory()
    return _build_placeholder_prediction('cnn', payload)
