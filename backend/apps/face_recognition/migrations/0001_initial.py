from __future__ import annotations

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies: list[tuple[str, str]] = []

    operations = [
        migrations.CreateModel(
            name='FaceEnrollment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('person_id', models.CharField(max_length=64, unique=True)),
                ('person_name', models.CharField(max_length=128)),
                ('notes', models.TextField(blank=True, default='')),
                ('source_image_name', models.CharField(blank=True, default='', max_length=255)),
                ('embedding', models.JSONField(default=list)),
                ('embedding_size', models.PositiveSmallIntegerField(default=0)),
                ('match_count', models.PositiveIntegerField(default=0)),
                ('last_similarity', models.FloatField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
