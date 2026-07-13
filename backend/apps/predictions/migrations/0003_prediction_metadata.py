from __future__ import annotations

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('predictions', '0002_chestxrayprediction_modality'),
    ]

    operations = [
        migrations.AddField(
            model_name='chestxrayprediction',
            name='filename',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='chestxrayprediction',
            name='upload_time',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='chestxrayprediction',
            name='prediction_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='chestxrayprediction',
            name='processing_time',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
