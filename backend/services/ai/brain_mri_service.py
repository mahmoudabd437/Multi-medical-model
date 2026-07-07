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

try:
    import tensorflow as tf
    from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
    from tensorflow.keras.models import load_model as keras_load_model
except Exception:  # pragma: no cover - import availability depends on deployment image.
    tf = None
    efficientnet_preprocess_input = None
    keras_load_model = None

try:
    import keras_hub  # noqa: F401
except Exception:  # pragma: no cover - only required for the ViT model.
    keras_hub = None

MODEL_VERSION = '1.0.0'
IMAGE_SIZE = (224, 224)
CLASS_LABELS = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary Tumor']
MODEL_DIR = Path(settings.BASE_DIR) / 'services' / 'ai' / 'models'


if tf is not None:
    @tf.keras.utils.register_keras_serializable(package='MedicalAI')
    class ClassTokenLayer(tf.keras.layers.Layer):
        def call(self, inputs, mask=None):
            return inputs[:, 0, :]
else:  # pragma: no cover - only used when TensorFlow is unavailable.
    ClassTokenLayer = None


def _scale_pixels(array: np.ndarray) -> np.ndarray:
    return array / 255.0


@dataclass(frozen=True)
class BrainMRIModelConfig:
    key: str
    name: str
    filenames: tuple[str, ...]
    preprocess: Callable[[np.ndarray], np.ndarray]
    requires_keras_hub: bool = False

    @property
    def path(self) -> Path:
        for filename in self.filenames:
            candidate = MODEL_DIR / filename
            if candidate.exists():
                return candidate
        return MODEL_DIR / self.filenames[0]


MODEL_CONFIGS: dict[str, BrainMRIModelConfig] = {
    'efficientnetb0_mri': BrainMRIModelConfig(
        key='efficientnetb0_mri',
        name='EfficientNetB0 MRI',
        filenames=('EfficientNetB0_best_MRI.keras', 'EfficientNetB0_best_MBI.keras'),
        preprocess=lambda array: efficientnet_preprocess_input(array),
    ),
    'vit_mri': BrainMRIModelConfig(
        key='vit_mri',
        name='ViT MRI',
        filenames=('ViT_best_MRI.keras',),
        preprocess=_scale_pixels,
        requires_keras_hub=True,
    ),
}
DEFAULT_MODEL_KEY = 'efficientnetb0_mri'


class BrainMRIServiceError(RuntimeError):
    pass


class ModelLoadError(BrainMRIServiceError):
    pass


class InvalidModelError(BrainMRIServiceError):
    pass


class ImageProcessingError(BrainMRIServiceError):
    pass


class PredictionError(BrainMRIServiceError):
    pass


@dataclass(frozen=True)
class ModelStatus:
    loaded: bool
    model_path: str
    detail: str | None = None


def _get_model_config(model_key: str | None) -> BrainMRIModelConfig:
    normalized_key = (model_key or DEFAULT_MODEL_KEY).strip().lower()
    try:
        return MODEL_CONFIGS[normalized_key]
    except KeyError as exc:
        supported_models = ', '.join(config.name for config in MODEL_CONFIGS.values())
        raise InvalidModelError(f'Unsupported Brain MRI model. Choose one of: {supported_models}.') from exc


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


def _replace_unsafe_vit_lambda_layers(value: Any) -> int:
    replaced_count = 0

    if isinstance(value, dict):
        if value.get('class_name') == 'Lambda':
            config = value.get('config', {})
            build_config = value.get('build_config', {})
            if (
                isinstance(config, dict)
                and isinstance(build_config, dict)
                and build_config.get('input_shape') == [None, 197, 768]
            ):
                value['module'] = None
                value['class_name'] = 'ClassTokenLayer'
                value['registered_name'] = 'MedicalAI>ClassTokenLayer'
                value['config'] = {
                    'name': config.get('name', 'lambda'),
                    'trainable': config.get('trainable', True),
                    'dtype': config.get('dtype', 'float32'),
                }
                replaced_count += 1

        for nested_value in value.values():
            replaced_count += _replace_unsafe_vit_lambda_layers(nested_value)

    elif isinstance(value, list):
        for item in value:
            replaced_count += _replace_unsafe_vit_lambda_layers(item)

    return replaced_count


def _build_sanitized_model_archive(model_path: Path) -> Path | None:
    temp_path = None
    with zipfile.ZipFile(model_path, 'r') as source_archive:
        config = json.loads(source_archive.read('config.json'))
        removed_count = _remove_unsupported_quantization_config(config)
        replaced_count = _replace_unsafe_vit_lambda_layers(config)

        if removed_count == 0 and replaced_count == 0:
            return None

        with tempfile.NamedTemporaryFile(suffix='.keras', delete=False) as temp_file:
            temp_path = Path(temp_file.name)

        with zipfile.ZipFile(temp_path, 'w') as target_archive:
            for archive_item in source_archive.infolist():
                archive_data = source_archive.read(archive_item.filename)
                if archive_item.filename == 'config.json':
                    archive_data = json.dumps(config).encode('utf-8')
                target_archive.writestr(archive_item, archive_data)

    return temp_path


def _load_model_with_compatibility_fallback(model_path: Path) -> Any:
    custom_objects = {'ClassTokenLayer': ClassTokenLayer} if ClassTokenLayer is not None else None
    temp_path = _build_sanitized_model_archive(model_path)
    if temp_path is not None:
        try:
            return keras_load_model(temp_path, compile=False, safe_mode=False, custom_objects=custom_objects)
        finally:
            temp_path.unlink(missing_ok=True)

    try:
        return keras_load_model(model_path, compile=False, safe_mode=False, custom_objects=custom_objects)
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

            return keras_load_model(temp_path, compile=False, safe_mode=False, custom_objects=custom_objects)
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)


@lru_cache(maxsize=len(MODEL_CONFIGS))
def _load_model_once(model_key: str = DEFAULT_MODEL_KEY) -> Any:
    if keras_load_model is None or efficientnet_preprocess_input is None:
        raise ModelLoadError(
            f'TensorFlow is not available in the current environment. '
            f'Django is running with Python executable: {sys.executable}'
        )

    model_config = _get_model_config(model_key)
    if model_config.requires_keras_hub and keras_hub is None:
        raise ModelLoadError('The ViT Brain MRI model requires the keras-hub package. Install backend requirements and restart Django.')

    model_path = model_config.path
    if not model_path.exists():
        expected_files = ', '.join(model_config.filenames)
        raise ModelLoadError(f'{model_config.name} model file was not found. Expected one of: {expected_files}.')

    return _load_model_with_compatibility_fallback(model_path)


def warm_up_brain_mri_model(model_key: str = DEFAULT_MODEL_KEY) -> ModelStatus:
    model_config = _get_model_config(model_key)
    model_path = str(model_config.path)
    try:
        _load_model_once(model_config.key)
        return ModelStatus(loaded=True, model_path=model_path)
    except Exception as exc:  # pragma: no cover - startup diagnostics only.
        return ModelStatus(loaded=False, model_path=model_path, detail=str(exc))


def _prepare_image(image_file, model_config: BrainMRIModelConfig) -> np.ndarray:
    if efficientnet_preprocess_input is None:
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


def predict_brain_mri(image_file, model_key: str | None = None) -> dict[str, Any]:
    start_time = time.perf_counter()
    model_config = _get_model_config(model_key)
    model = _load_model_once(model_config.key)
    prepared_image = _prepare_image(image_file, model_config)

    try:
        prediction_output = model.predict(prepared_image, verbose=0)
    except Exception as exc:  # pragma: no cover - depends on runtime model behaviour.
        raise PredictionError(f'{model_config.name} inference failed.') from exc

    scores = np.squeeze(prediction_output).astype(float)
    if scores.ndim == 0:
        raise PredictionError(f'{model_config.name} returned an invalid scalar output for a 4-class MRI task.')

    class_index = int(np.argmax(scores))
    prediction_label = CLASS_LABELS[class_index] if class_index < len(CLASS_LABELS) else f'Class {class_index}'
    probability = float(scores[class_index])
    confidence = round(probability * 100, 2)
    inference_time_seconds = round(time.perf_counter() - start_time, 2)

    return {
        'prediction': prediction_label,
        'confidence': confidence,
        'probability': round(probability, 4),
        'class_index': class_index,
        'scores': {label: round(float(score), 4) for label, score in zip(CLASS_LABELS, scores)},
        'model': model_config.name,
        'version': MODEL_VERSION,
        'inference_time_seconds': inference_time_seconds,
        'inference_time': f'{inference_time_seconds:.2f} sec',
        'medical_note': (
            f'The uploaded Brain MRI is classified as {prediction_label} by the selected AI model. '
            'This result is intended for clinical decision support and should be confirmed by a qualified radiologist.'
        ),
    }
