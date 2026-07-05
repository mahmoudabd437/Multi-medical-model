from __future__ import annotations

import json
import tempfile
import time
import zipfile
import sys
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

import numpy as np
from django.conf import settings
from PIL import Image, UnidentifiedImageError

try:  # TensorFlow is optional until the trained model is mounted into the project.
    from tensorflow.keras.applications.densenet import preprocess_input as densenet_preprocess_input
    from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
    from tensorflow.keras.models import load_model as keras_load_model
except Exception:  # pragma: no cover - import availability depends on deployment image.
    densenet_preprocess_input = None
    efficientnet_preprocess_input = None
    keras_load_model = None

MODEL_VERSION = '1.0.0'
IMAGE_SIZE = (224, 224)
THRESHOLD = 0.5
MODEL_DIR = Path(settings.BASE_DIR) / 'services' / 'ai' / 'models'


def _scale_pixels(array: np.ndarray) -> np.ndarray:
    return array / 255.0


@dataclass(frozen=True)
class ChestXrayModelConfig:
    key: str
    name: str
    filename: str
    color_mode: str
    channels: int
    preprocess: Callable[[np.ndarray], np.ndarray]

    @property
    def path(self) -> Path:
        return MODEL_DIR / self.filename


MODEL_CONFIGS: dict[str, ChestXrayModelConfig] = {
    'efficientnetb0': ChestXrayModelConfig(
        key='efficientnetb0',
        name='EfficientNetB0',
        filename='efficientnetb0.keras',
        color_mode='RGB',
        channels=3,
        preprocess=lambda array: efficientnet_preprocess_input(array),
    ),
    'densenet121': ChestXrayModelConfig(
        key='densenet121',
        name='DenseNet121',
        filename='DenseNet121_best.keras',
        color_mode='RGB',
        channels=3,
        preprocess=lambda array: densenet_preprocess_input(array),
    ),
    'custom_cnn': ChestXrayModelConfig(
        key='custom_cnn',
        name='Custom CNN',
        filename='best_model.h5',
        color_mode='L',
        channels=1,
        preprocess=_scale_pixels,
    ),
}
DEFAULT_MODEL_KEY = 'efficientnetb0'


class EfficientNetServiceError(RuntimeError):
    pass


class ModelLoadError(EfficientNetServiceError):
    pass


class InvalidModelError(EfficientNetServiceError):
    pass


class ImageProcessingError(EfficientNetServiceError):
    pass


class PredictionError(EfficientNetServiceError):
    pass


@dataclass(frozen=True)
class ModelStatus:
    loaded: bool
    model_path: str
    detail: str | None = None


def _get_model_config(model_key: str | None) -> ChestXrayModelConfig:
    normalized_key = (model_key or DEFAULT_MODEL_KEY).strip().lower()
    try:
        return MODEL_CONFIGS[normalized_key]
    except KeyError as exc:
        supported_models = ', '.join(config.name for config in MODEL_CONFIGS.values())
        raise InvalidModelError(f'Unsupported chest X-ray model. Choose one of: {supported_models}.') from exc


def _remove_unsupported_quantization_config(value: Any) -> int:
    removed_count = 0

    if isinstance(value, dict):
        if 'quantization_config' in value:
            value.pop('quantization_config')
            removed_count += 1

        for nested_value in value.values():
            removed_count += _remove_unsupported_quantization_config(nested_value)

    elif isinstance(value, list):
        for item in value:
            removed_count += _remove_unsupported_quantization_config(item)

    return removed_count


def _load_model_with_compatibility_fallback(model_path: Path) -> Any:
    try:
        return keras_load_model(model_path, compile=False)
    except TypeError as exc:
        if 'quantization_config' not in str(exc):
            raise

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.keras', delete=False) as temp_file:
                temp_path = Path(temp_file.name)

            with zipfile.ZipFile(model_path, 'r') as source_archive:
                with zipfile.ZipFile(temp_path, 'w') as target_archive:
                    for archive_item in source_archive.infolist():
                        archive_data = source_archive.read(archive_item.filename)

                        if archive_item.filename == 'config.json':
                            config = json.loads(archive_data)
                            removed_count = _remove_unsupported_quantization_config(config)
                            if removed_count == 0:
                                raise
                            archive_data = json.dumps(config).encode('utf-8')

                        target_archive.writestr(archive_item, archive_data)

            return keras_load_model(temp_path, compile=False)
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)


@lru_cache(maxsize=len(MODEL_CONFIGS))
def _load_model_once(model_key: str = DEFAULT_MODEL_KEY) -> Any:
    if keras_load_model is None or efficientnet_preprocess_input is None or densenet_preprocess_input is None:
        raise ModelLoadError(
            f'TensorFlow is not available in the current environment. '
            f'Django is running with Python executable: {sys.executable}'
        )

    model_config = _get_model_config(model_key)
    model_path = model_config.path
    if not model_path.exists():
        raise ModelLoadError(f'{model_config.name} model file was not found at {model_path}.')

    return _load_model_with_compatibility_fallback(model_path)


def warm_up_efficientnet_model(model_key: str = DEFAULT_MODEL_KEY) -> ModelStatus:
    model_config = _get_model_config(model_key)
    model_path = str(model_config.path)
    try:
        _load_model_once(model_config.key)
        return ModelStatus(loaded=True, model_path=model_path)
    except Exception as exc:  # pragma: no cover - startup diagnostics only.
        return ModelStatus(loaded=False, model_path=model_path, detail=str(exc))


def get_model_status() -> ModelStatus:
    return warm_up_efficientnet_model()


def _prepare_image(image_file, model_config: ChestXrayModelConfig) -> np.ndarray:
    if efficientnet_preprocess_input is None or densenet_preprocess_input is None:
        raise ModelLoadError('TensorFlow preprocessing utilities are unavailable.')

    try:
        image = Image.open(image_file).convert(model_config.color_mode)
    except UnidentifiedImageError as exc:
        raise ImageProcessingError('Unsupported or corrupted image file.') from exc
    except Exception as exc:  # pragma: no cover - guards file system / stream edge cases.
        raise ImageProcessingError('Unable to read the uploaded image.') from exc

    image = image.resize(IMAGE_SIZE)
    array = np.array(image, dtype=np.float32)
    if model_config.channels == 1:
        array = np.expand_dims(array, axis=-1)
    array = np.expand_dims(array, axis=0)
    return model_config.preprocess(array)


def predict_chest_xray(image_file, model_key: str | None = None) -> dict[str, Any]:
    start_time = time.perf_counter()
    model_config = _get_model_config(model_key)
    model = _load_model_once(model_config.key)
    prepared_image = _prepare_image(image_file, model_config)

    try:
        prediction_output = model.predict(prepared_image, verbose=0)
    except Exception as exc:  # pragma: no cover - depends on runtime model behaviour.
        raise PredictionError(f'{model_config.name} inference failed.') from exc

    probability = float(np.squeeze(prediction_output))
    class_index = 1 if probability >= THRESHOLD else 0
    prediction_label = 'Pneumonia' if class_index == 1 else 'Normal'
    confidence = round(
        (probability if class_index == 1 else 1 - probability) * 100,
        2,
    )

    inference_time_seconds = round(time.perf_counter() - start_time, 2)

    result = {
        'prediction': prediction_label,
        'confidence': confidence,
        'probability': round(probability, 4),
        'class_index': class_index,
        'model': model_config.name,
        'threshold': THRESHOLD,
        'version': MODEL_VERSION,
        'inference_time_seconds': inference_time_seconds,
        'inference_time': f'{inference_time_seconds:.2f} sec',
        'medical_note': (
            'The uploaded chest X-ray demonstrates radiographic findings suggestive of pneumonia. '
            'This AI prediction is intended to assist healthcare professionals and should always '
            'be confirmed by a qualified radiologist.'
        ),
    }
## comment
    return result