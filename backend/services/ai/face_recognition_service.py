from __future__ import annotations

import sys
import time
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
from django.conf import settings
from django.db import models
from PIL import Image, UnidentifiedImageError

try:
    import cv2
    from insightface.app import FaceAnalysis
except Exception:  # pragma: no cover - import availability depends on deployment image.
    cv2 = None
    FaceAnalysis = None

MODEL_VERSION = '1.0.0'
FACE_DETECTION_SIZE = (640, 640)
DEFAULT_SIMILARITY_THRESHOLD = 0.45
MIN_FACE_CONFIDENCE = 0.0
MODEL_DIR = Path(settings.BASE_DIR) / 'services' / 'ai' / 'models'


class FaceRecognitionServiceError(RuntimeError):
    pass


class ModelLoadError(FaceRecognitionServiceError):
    pass


class ImageProcessingError(FaceRecognitionServiceError):
    pass


class EnrollmentError(FaceRecognitionServiceError):
    pass


class MatchError(FaceRecognitionServiceError):
    pass


def _slugify_person_name(person_name: str) -> str:
    normalized = ''.join(char.lower() if char.isalnum() else '_' for char in person_name.strip())
    normalized = '_'.join(part for part in normalized.split('_') if part)
    return normalized or 'person'


@lru_cache(maxsize=1)
def _get_face_analysis_app() -> Any:
    if FaceAnalysis is None or cv2 is None:
        raise ModelLoadError(
            'InsightFace and OpenCV are not available in the current environment. '
            f'Django is running with Python executable: {sys.executable}'
        )

    try:
        app = FaceAnalysis(providers=['CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=FACE_DETECTION_SIZE)
        return app
    except Exception as exc:  # pragma: no cover - depends on runtime model availability.
        raise ModelLoadError(f'Unable to initialize the InsightFace model: {exc}') from exc


def _read_image_as_bgr(image_file) -> np.ndarray:
    try:
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        image = Image.open(image_file).convert('RGB')
    except UnidentifiedImageError as exc:
        raise ImageProcessingError('Unsupported or corrupted image file.') from exc
    except Exception as exc:  # pragma: no cover - guards file system / stream edge cases.
        raise ImageProcessingError('Unable to read the uploaded image.') from exc

    image_array = np.array(image, dtype=np.uint8)
    return cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR) if cv2 is not None else image_array


def _select_primary_face(faces: list[Any]) -> Any:
    if not faces:
        raise ImageProcessingError('No face was detected in the uploaded image.')

    def face_area(face: Any) -> float:
        bbox = np.array(face.bbox, dtype=float)
        return max(0.0, float((bbox[2] - bbox[0]) * (bbox[3] - bbox[1])))

    return max(faces, key=face_area)


def extract_face_embedding(image_file) -> tuple[np.ndarray, dict[str, Any]]:
    app = _get_face_analysis_app()
    image = _read_image_as_bgr(image_file)
    faces = app.get(image)
    primary_face = _select_primary_face(faces)
    embedding = np.asarray(primary_face.normed_embedding, dtype=np.float32)

    if embedding.ndim != 1 or embedding.size == 0:
        raise ImageProcessingError('The detected face did not produce a valid embedding.')

    metadata = {
        'face_count': len(faces),
        'confidence': float(getattr(primary_face, 'det_score', 0.0)),
        'bbox': [float(value) for value in np.asarray(primary_face.bbox, dtype=float).tolist()],
    }
    return embedding, metadata


def enrollment_payload(enrollment: Any) -> dict[str, Any]:
    return {
        'id': str(enrollment.id),
        'person_id': enrollment.person_id,
        'person_name': enrollment.person_name,
        'notes': enrollment.notes,
        'source_image_name': enrollment.source_image_name,
        'embedding_size': enrollment.embedding_size,
        'match_count': enrollment.match_count,
        'last_similarity': enrollment.last_similarity,
        'created_at': enrollment.created_at.isoformat(),
        'updated_at': enrollment.updated_at.isoformat(),
    }


def enroll_face(*, person_name: str, image_file, person_id: str | None = None, notes: str = '') -> dict[str, Any]:
    from apps.face_recognition.models import FaceEnrollment

    start_time = time.perf_counter()
    embedding, metadata = extract_face_embedding(image_file)
    resolved_person_id = (person_id or '').strip() or f"{_slugify_person_name(person_name)}_{uuid.uuid4().hex[:8]}"
    source_image_name = getattr(image_file, 'name', '') or ''

    enrollment, created = FaceEnrollment.objects.update_or_create(
        person_id=resolved_person_id,
        defaults={
            'person_name': person_name.strip(),
            'notes': notes.strip(),
            'source_image_name': source_image_name,
            'embedding': embedding.astype(float).tolist(),
            'embedding_size': int(embedding.size),
        },
    )

    inference_time_seconds = round(time.perf_counter() - start_time, 2)
    return {
        'enrolled': True,
        'created': created,
        'person_id': enrollment.person_id,
        'person_name': enrollment.person_name,
        'notes': enrollment.notes,
        'source_image_name': enrollment.source_image_name,
        'embedding_size': enrollment.embedding_size,
        'face_count': metadata['face_count'],
        'confidence': round(metadata['confidence'] * 100, 2),
        'bbox': metadata['bbox'],
        'version': MODEL_VERSION,
        'inference_time_seconds': inference_time_seconds,
        'inference_time': f'{inference_time_seconds:.2f} sec',
        'message': 'Face enrolled successfully.',
        'enrollment': enrollment_payload(enrollment),
    }


def _similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def match_face(*, image_file, person_id: str | None = None, threshold: float = DEFAULT_SIMILARITY_THRESHOLD) -> dict[str, Any]:
    from apps.face_recognition.models import FaceEnrollment

    start_time = time.perf_counter()
    query_embedding, metadata = extract_face_embedding(image_file)
    enrollments = FaceEnrollment.objects.all()

    if person_id:
        enrollments = enrollments.filter(person_id=person_id.strip())

    candidates: list[dict[str, Any]] = []
    best_match: dict[str, Any] | None = None

    for enrollment in enrollments:
        stored_embedding = np.asarray(enrollment.embedding, dtype=np.float32)
        if stored_embedding.size == 0:
            continue

        similarity = _similarity(query_embedding, stored_embedding)
        candidate = {
            'id': str(enrollment.id),
            'person_id': enrollment.person_id,
            'person_name': enrollment.person_name,
            'similarity': round(similarity, 4),
            'confidence': round(max(similarity, 0.0) * 100, 2),
        }
        candidates.append(candidate)
        if best_match is None or similarity > best_match['similarity']:
            best_match = candidate

    candidates.sort(key=lambda item: item['similarity'], reverse=True)

    match_found = bool(best_match and best_match['similarity'] >= threshold)
    confidence = best_match['confidence'] if match_found and best_match is not None else 0.0
    similar_person = best_match if match_found else None

    if match_found and similar_person is not None:
        FaceEnrollment.objects.filter(id=similar_person['id']).update(
            match_count=models.F('match_count') + 1,
            last_similarity=similar_person['similarity'],
        )

    inference_time_seconds = round(time.perf_counter() - start_time, 2)

    return {
        'match_found': match_found,
        'confidence': confidence,
        'similarity': best_match['similarity'] if best_match is not None else 0.0,
        'threshold': threshold,
        'person_id': person_id.strip() if person_id else None,
        'match': similar_person,
        'candidates': candidates[:5],
        'face_count': metadata['face_count'],
        'bbox': metadata['bbox'],
        'version': MODEL_VERSION,
        'inference_time_seconds': inference_time_seconds,
        'inference_time': f'{inference_time_seconds:.2f} sec',
        'message': 'Match found.' if match_found else 'No enrolled face passed the similarity threshold.',
    }
