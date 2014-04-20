from django.db import models
from goldstone.models import ApiPerfData


class ApiPerfData(ApiPerfData):
    component = 'cinder'
