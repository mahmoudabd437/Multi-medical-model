from __future__ import annotations

from typing import Any

from rest_framework.response import Response


def success_response(data: Any, message: str = 'OK', status_code: int = 200) -> Response:
    return Response(
        {
            'success': True,
            'message': message,
            'data': data,
        },
        status=status_code,
    )


def error_response(message: str, errors: Any = None, status_code: int = 400) -> Response:
    payload = {
        'success': False,
        'message': message,
    }
    if errors is not None:
        payload['errors'] = errors
    return Response(payload, status=status_code)
