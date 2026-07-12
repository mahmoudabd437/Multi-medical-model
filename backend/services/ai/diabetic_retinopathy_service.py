from __future__ import annotations

import shutil
import tempfile
import time
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

import numpy as np
from django.conf import settings
from PIL import Image, UnidentifiedImageError

try:
    import tensorflow as tf
    from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
    from tensorflow.keras.applications import EfficientNetB0, ConvNeXtTiny
    try:
        from tensorflow.keras.applications.convnext import preprocess_input as convnext_preprocess_input
    except Exception:  # pragma: no cover - convnext preprocess availability depends on TF build.
        convnext_preprocess_input = None
    from tensorflow.keras.models import load_model as keras_load_model
except Exception:  # pragma: no cover - import availability depends on deployment image.
    tf = None
    efficientnet_preprocess_input = None
    convnext_preprocess_input = None
    EfficientNetB0 = None
    ConvNeXtTiny = None
    keras_load_model = None

MODEL_VERSION = '1.0.0'
IMAGE_SIZE = (224, 224)
CLASS_LABELS = [
    'Mild',
    'Moderate',
    'No DR',
    'Proliferative DR',
    'Severe'
]
MODEL_DIR = Path(settings.BASE_DIR) / 'services' / 'ai' / 'models'


def _scale_pixels(array: np.ndarray) -> np.ndarray:
    return array / 255.0


@dataclass(frozen=True)
class DiabeticRetinopathyModelConfig:
    key: str
    name: str
    filenames: tuple[str, ...]
    preprocess: Callable[[np.ndarray], np.ndarray]

    @property
    def path(self) -> Path:
        for filename in self.filenames:
            candidate = MODEL_DIR / filename
            if candidate.exists():
                return candidate
        return MODEL_DIR / self.filenames[0]


MODEL_CONFIGS: dict[str, DiabeticRetinopathyModelConfig] = {
    'efficientnetb0_dr': DiabeticRetinopathyModelConfig(
        key='efficientnetb0_dr',
        name='EfficientNetB0 DR',
        filenames=('EfficientNetB0_best_DR_cw.h5',),
        preprocess=lambda array: efficientnet_preprocess_input(array) if efficientnet_preprocess_input is not None else _scale_pixels(array),
    ),
    'convnext_dr': DiabeticRetinopathyModelConfig(
        key='convnext_dr',
        name='ConvNeXt DR',
        filenames=('ConvNeXt_best_DR_focal.h5',),
        preprocess=lambda array: convnext_preprocess_input(array) if convnext_preprocess_input is not None else _scale_pixels(array),
    ),
}
DEFAULT_MODEL_KEY = 'efficientnetb0_dr'


class DiabeticRetinopathyServiceError(RuntimeError):
    pass


class ModelLoadError(DiabeticRetinopathyServiceError):
    pass


class InvalidModelError(DiabeticRetinopathyServiceError):
    pass


class ImageProcessingError(DiabeticRetinopathyServiceError):
    pass


class PredictionError(DiabeticRetinopathyServiceError):
    pass


@dataclass(frozen=True)
class ModelStatus:
    loaded: bool
    model_path: str
    detail: str | None = None


def _get_model_config(model_key: str | None) -> DiabeticRetinopathyModelConfig:
    normalized_key = (model_key or DEFAULT_MODEL_KEY).strip().lower()
    try:
        return MODEL_CONFIGS[normalized_key]
    except KeyError as exc:
        supported_models = ', '.join(config.name for config in MODEL_CONFIGS.values())
        raise InvalidModelError(f'Unsupported diabetic retinopathy model. Choose one of: {supported_models}.') from exc


def _load_model_with_compatibility_fallback(model_path: Path, model_config: DiabeticRetinopathyModelConfig) -> Any:
    try:
        return keras_load_model(model_path, compile=False, safe_mode=False)
    except Exception as exc:
        fallback_message = str(exc)
        if 'No model config found' not in fallback_message and 'Unable to open file' not in fallback_message:
            raise

        return _load_weights_archive(model_path, model_config)


def _load_weights_archive(model_path: Path, model_config: DiabeticRetinopathyModelConfig) -> Any:
    if model_config.key == 'efficientnetb0_dr':
        if EfficientNetB0 is None:
            raise ModelLoadError('EfficientNetB0 is unavailable in the current TensorFlow installation.')
        model = EfficientNetB0(include_top=False, weights=None, input_shape=(*IMAGE_SIZE, 3), pooling='avg')
        head = [
            tf.keras.layers.Dense(512, activation='relu', name='dense'),
            tf.keras.layers.Dense(5, activation='softmax', name='dense_1'),
        ]
    elif model_config.key == 'convnext_dr':
        if ConvNeXtTiny is None:
            raise ModelLoadError('ConvNeXtTiny is unavailable in the current TensorFlow installation.')
        model = ConvNeXtTiny(include_top=False, weights=None, input_shape=(*IMAGE_SIZE, 3), pooling='avg')
        head = [tf.keras.layers.Dense(5, activation='softmax', name='dense_36')]
    else:  # pragma: no cover - guarded by model config selection.
        raise ModelLoadError(f'Unsupported diabetic retinopathy model key: {model_config.key}')

    x = model.output
    for layer in head:
        x = layer(x)
    compiled_model = tf.keras.Model(model.input, x)

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.weights.h5', delete=False) as temp_file:
            temp_path = Path(temp_file.name)
        shutil.copyfile(model_path, temp_path)
        compiled_model.load_weights(temp_path)
        return compiled_model
    except Exception as exc:
        raise ModelLoadError(f'Failed to load diabetic retinopathy weights from {model_path.name}: {exc}') from exc
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


@lru_cache(maxsize=len(MODEL_CONFIGS))
def _load_model_once(model_key: str = DEFAULT_MODEL_KEY) -> Any:
    if keras_load_model is None or (efficientnet_preprocess_input is None and convnext_preprocess_input is None):
        raise ModelLoadError(
            f'TensorFlow is not available in the current environment. '
            f'Django is running with Python executable: {sys.executable}'
        )

    model_config = _get_model_config(model_key)
    model_path = model_config.path
    if not model_path.exists():
        expected_files = ', '.join(model_config.filenames)
        raise ModelLoadError(f'{model_config.name} model file was not found. Expected one of: {expected_files}.')

    return _load_model_with_compatibility_fallback(model_path, model_config)


def warm_up_diabetic_retinopathy_model(model_key: str = DEFAULT_MODEL_KEY) -> ModelStatus:
    model_config = _get_model_config(model_key)
    model_path = str(model_config.path)
    try:
        _load_model_once(model_config.key)
        return ModelStatus(loaded=True, model_path=model_path)
    except Exception as exc:  # pragma: no cover - startup diagnostics only.
        return ModelStatus(loaded=False, model_path=model_path, detail=str(exc))


def _prepare_image(image_file, model_config: DiabeticRetinopathyModelConfig) -> np.ndarray:
    if efficientnet_preprocess_input is None and convnext_preprocess_input is None:
        raise ModelLoadError('TensorFlow preprocessing utilities are unavailable.')

    try:
        image = Image.open(image_file).convert('RGB')
    except UnidentifiedImageError as exc:
        raise ImageProcessingError('Unsupported or corrupted image file.') from exc
    except Exception as exc:  # pragma: no cover - guards file system / stream edge cases.
        raise ImageProcessingError('Unable to read the uploaded image.') from exc

    image = image.resize(IMAGE_SIZE)
    array = np.array(image, dtype=np.float32)
    array = np.expand_dims(array, axis=0)
    return model_config.preprocess(array)


def _format_prediction(scores: np.ndarray) -> tuple[str, int, float, dict[str, float], float]:
    scores = np.squeeze(scores).astype(float)
    if scores.ndim == 0:
        probability = float(scores)
        prediction_label = 'No DR' if probability < 0.5 else 'Referable DR'
        confidence = round((1 - probability if probability < 0.5 else probability) * 100, 2)
        return prediction_label, 1 if probability >= 0.5 else 0, probability, {
            'No DR': round(1 - probability, 4),
            'Referable DR': round(probability, 4),
        }, confidence

    class_index = int(np.argmax(scores))
    if scores.size == 2:
        labels = ['No DR', 'Referable DR']
    else:
        labels = CLASS_LABELS[: scores.size] if scores.size <= len(CLASS_LABELS) else CLASS_LABELS + [f'Class {index}' for index in range(len(CLASS_LABELS), scores.size)]

    prediction_label = labels[class_index] if class_index < len(labels) else f'Class {class_index}'
    probability = float(scores[class_index])
    confidence = round(probability * 100, 2)
    return prediction_label, class_index, probability, {label: round(float(score), 4) for label, score in zip(labels, scores)}, confidence


def predict_diabetic_retinopathy(image_file, model_key: str | None = None) -> dict[str, Any]:
    start_time = time.perf_counter()
    model_config = _get_model_config(model_key)
    model = _load_model_once(model_config.key)
    prepared_image = _prepare_image(image_file, model_config)

    try:
        prediction_output = model.predict(prepared_image, verbose=0)
    except Exception as exc:  # pragma: no cover - depends on runtime model behaviour.
        raise PredictionError(f'{model_config.name} inference failed.') from exc

    prediction_label, class_index, probability, scores, confidence = _format_prediction(prediction_output)
    inference_time_seconds = round(time.perf_counter() - start_time, 2)

    return {
        'prediction': prediction_label,
        'confidence': confidence,
        'probability': round(probability, 4),
        'class_index': class_index,
        'scores': scores,
        'model': model_config.name,
        'version': MODEL_VERSION,
        'inference_time_seconds': inference_time_seconds,
        'inference_time': f'{inference_time_seconds:.2f} sec',
        'medical_note': (
            f'The uploaded retinal fundus image is classified as {prediction_label} by the selected AI model. '
            'This result is intended for clinical decision support and should be confirmed by an ophthalmologist or retina specialist.'
        ),
    }
