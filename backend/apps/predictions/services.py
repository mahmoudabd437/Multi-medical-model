from __future__ import annotations

from typing import Any, Callable

from apps.ai.service import predict_cnn, predict_densenet, predict_efficientnet
from apps.common.mock_data import MOCK_PREDICTIONS
from apps.predictions.serializers import PredictionRequestSerializer

PredictionStrategy = Callable[[dict[str, Any]], dict[str, Any]]

PREDICTION_STRATEGIES: dict[str, PredictionStrategy] = {
    'chest_xray': predict_efficientnet,
    'brain_mri': predict_densenet,
    'skin_disease': predict_cnn,
    'face_recognition': predict_cnn,
}


def get_prediction_strategy(modality: str) -> PredictionStrategy:
    return PREDICTION_STRATEGIES.get(modality, predict_cnn)


def build_prediction_history(payload: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    if payload is None:
        return MOCK_PREDICTIONS

    serializer = PredictionRequestSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    strategy = get_prediction_strategy(serializer.validated_data['modality'])
    return [strategy(serializer.validated_data)] + MOCK_PREDICTIONS
