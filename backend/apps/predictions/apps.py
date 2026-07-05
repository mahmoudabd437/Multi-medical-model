from django.apps import AppConfig


class PredictionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.predictions'

    def ready(self):
        from services.ai.efficientnet_service import warm_up_efficientnet_model

        warm_up_efficientnet_model()
