# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailproducer',
            name='owner',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='emailproducer',
            name='polymorphic_ctype',
            field=models.ForeignKey(related_name='polymorphic_core.emailproducer_set+', editable=False, to='contenttypes.ContentType', null=True),
        ),
        migrations.AddField(
            model_name='alertdefinition',
            name='owner',
            field=models.ForeignKey(editable=False, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='alertdefinition',
            name='search',
            field=models.ForeignKey(editable=False, to='core.SavedSearch'),
        ),
        migrations.AddField(
            model_name='alert',
            name='alert_def',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, editable=False, to='core.AlertDefinition'),
        ),
        migrations.AddField(
            model_name='alert',
            name='owner',
            field=models.ForeignKey(editable=False, to=settings.AUTH_USER_MODEL),
        ),
    ]
