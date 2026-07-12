from __future__ import annotations

from datetime import datetime, timezone

MOCK_USER = {
    'id': 'user_001',
    'name': 'Dr. Amelia Carter',
    'role': 'Lead Radiologist',
    'department': 'Radiology',
    'email': 'amelia.carter@medaiplatform.dev',
    'initials': 'AC',
}

MOCK_AUTH = {
    'access': 'mock-access-token',
    'refresh': 'mock-refresh-token',
    'expires_in': 900,
    'token_type': 'Bearer',
    'user': MOCK_USER,
}

MOCK_PREDICTIONS = [
    {
        'id': 'pred_001',
        'modality': 'chest_xray',
        'study_type': 'Chest X-ray',
        'status': 'completed',
        'confidence': 0.988,
        'summary': 'No acute cardiopulmonary abnormality detected.',
        'created_at': '2026-07-04T08:30:00Z',
    },
    {
        'id': 'pred_002',
        'modality': 'brain_mri',
        'study_type': 'Brain MRI',
        'status': 'completed',
        'confidence': 0.941,
        'summary': 'Mild peri-hilar prominence flagged for review.',
        'created_at': '2026-07-04T08:42:00Z',
    },
    {
        'id': 'pred_003',
        'modality': 'diabetic_retinopathy',
        'study_type': 'Diabetic Retinopathy',
        'status': 'completed',
        'confidence': 0.913,
        'summary': 'Moderate diabetic retinopathy pattern detected for ophthalmology review.',
        'created_at': '2026-07-04T08:55:00Z',
    },
]

MOCK_HISTORY = [
    {
        'id': 'hist_001',
        'modality': 'chest_xray',
        'study_type': 'Chest X-ray',
        'patient_ref': 'PT-10021',
        'status': 'approved',
        'reviewer': 'Dr. Amelia Carter',
        'created_at': '2026-07-04T08:30:00Z',
    },
    {
        'id': 'hist_002',
        'modality': 'brain_mri',
        'study_type': 'Brain MRI',
        'patient_ref': 'PT-10042',
        'status': 'queued',
        'reviewer': 'Dr. Sara Ahmed',
        'created_at': '2026-07-03T14:18:00Z',
    },
    {
        'id': 'hist_003',
        'modality': 'diabetic_retinopathy',
        'study_type': 'Diabetic Retinopathy',
        'patient_ref': 'PT-10073',
        'status': 'approved',
        'reviewer': 'AI System',
        'created_at': '2026-07-04T09:12:00Z',
    },
]

MOCK_REPORTS = [
    {
        'id': 'rep_001',
        'title': 'Daily Chest X-ray Summary',
        'status': 'ready',
        'format': 'pdf',
        'generated_at': '2026-07-04T09:00:00Z',
    },
    {
        'id': 'rep_002',
        'title': 'Weekly Workflow Report',
        'status': 'processing',
        'format': 'xlsx',
        'generated_at': '2026-07-04T09:10:00Z',
    },
]

MOCK_FACE_SCENARIOS = [
    {
        'id': 'face_001',
        'status': 'placeholder',
        'message': 'Face recognition is reserved for a later release.',
    },
]

MOCK_NOW = datetime.now(timezone.utc).isoformat()
