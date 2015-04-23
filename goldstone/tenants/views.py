"""Tenant views."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from djoser.utils import SendEmailViewMixin
from rest_framework.permissions import BasePermission
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ModelViewSet
from rest_framework_extensions.mixins import NestedViewSetMixin

from goldstone.utils import django_admin_only, django_and_tenant_admins_only
from goldstone.user.views import UserSerializer
from .models import Tenant, Cloud

logger = logging.getLogger(__name__)


class TenantSerializer(ModelSerializer):
    """The Tenant model serializer."""

    class Meta:          # pylint: disable=C1001,C0111,W0232
        model = Tenant
        fields = ["name", "owner", "owner_contact", "uuid"]
        read_only_fields = ('uuid', )


class CloudSerializer(ModelSerializer):
    """The cloud model serializer."""

    class Meta:                        # pylint: disable=C0111,W0232,C1001
        model = Cloud

        # We use exclude, so the code will do the right thing if per-cloud
        # settings are defined,
        exclude = ("id", "tenant")
        read_only_fields = ("uuid", )


class DjangoOrTenantAdminPermission(BasePermission):
    """A custom permissions class that allows single object access to Django
    Admins, or a tenant_admin for the Tenant object in question."""

    def has_object_permission(self, request, view, obj):
        """Override the permissions check for single Tenant row access.

        :return: True if the request should be granted, False otherwise
        :rtype: bool

        """

        user = request.user
        return user.is_superuser or (user.tenant_admin and user.tenant == obj)


class BaseViewSet(NestedViewSetMixin, SendEmailViewMixin, ModelViewSet):
    """A base class for this app's Tenant, User, and Cloud ViewSets."""

    lookup_field = "uuid"

    def get_object(self):
        """Return the desired object for this request.

        Because the API's selection string is a UUID, we have to
        do a little extra work to filter by UUID. Hence, we have to
        override get_object().

        """
        from uuid import UUID

        # Pad the UUID hexadecimal value, extracted from the request URL, to 32
        # hex digits. Then create a UUID object with it.
        value = UUID(hex=self.kwargs[self.lookup_field].zfill(32))

        # Return the object having this UUID. It won't exist if the user is
        # malevolent.
        try:
            return self.get_queryset().get(**{self.lookup_field: value})
        except ObjectDoesNotExist:
            raise PermissionDenied

    def get_email_context(self, user):
        """Replace the SendEmailViewMixin's e-mail sending method.

        When we send new tenant members, or new tenant_admins, e-mail about
        their being added to a new tenant, this provides additional
        context for the templates.

        :param user: A user, with the additional attribute
                     perform_create_tenant_name
        :type user: User

        """
        from djoser import settings

        return {'domain': settings.get('DOMAIN'),
                'site_name': settings.get('SITE_NAME'),
                'protocol': 'https' if self.request.is_secure() else 'http',
                "tenant_name": user.perform_create_tenant_name,
                "username": user.username
                }


class TenantsViewSet(BaseViewSet):
    """Provide all of the /tenants views."""

    serializer_class = TenantSerializer
    permission_classes = (DjangoOrTenantAdminPermission, )

    def get_send_email_extras(self):
        """Override djoser's SendEmailViewMixin method.

        At some point it'll be more sensible to just write code for sending an
        email rather than do all this subclassing.

        """

        return {'subject_template_name': 'new_tenant_for_tenant_admin.txt',
                'plain_body_template_name':
                'new_tenant_body_for_tenant_admin.txt'}

    def get_queryset(self):
        """Return the queryset for list views."""

        return Tenant.objects.all()

    def get_object(self):
        """Return an object (e.g., for a detail view) iff (the user is a Django
        admin) or ((the request isn't a DELETE) and (the user is a tenant_admin
        of the tenant in question))."""

        try:
            tenant = super(TenantsViewSet, self).get_object()
        except ObjectDoesNotExist:
            raise PermissionDenied

        # N.B. user.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           (self.request.user.is_superuser or
            (self.request.user.tenant == tenant and
             self.request.method != "DELETE")):
            return tenant
        else:
            raise PermissionDenied

    @django_admin_only
    def perform_create(self, serializer):
        """Add the system's default tenant_admin as the tenant_admin, and
        member, of the tenant we are creating.

        """

        # Do what the superclass' perform_create() does, to get the newly
        # created row.
        tenant = serializer.save()

        # Find the default tenant_admin. Use a filter in case there's
        # erroneously more than one in the system.
        admin_user = get_user_model().objects.filter(default_tenant_admin=True)

        if not admin_user:
            # There should always be a default tenant_admin.
            logger.warning("There are no default tenant_admins in the system."
                           " Using the Django administrator instead.")
            admin_user = self.request.user
        elif admin_user.count() > 1:
            # More than one default tenant_admin is odd, but we'll continue.
            logger.warning("The system has more then one default tenant admin."
                           " There should be only one: %s",
                           admin_user)
            admin_user = admin_user[0]
        else:
            # We found the single default tenant_admin.
            admin_user = admin_user[0]

        # Insert the default tenant_admin into the tenant and save it.
        admin_user.tenant_admin = True
        admin_user.tenant = tenant
        admin_user.save()

        # Notify the tenant_admin by e-mail that he/she's administering this
        # tenant. We tack the tenant's name to the User object so that our
        # overridden get_email_context can get at it.
        admin_user.perform_create_tenant_name = tenant.name
        self.send_email(**self.get_send_email_kwargs(admin_user))

    @django_admin_only
    def perform_destroy(self, instance):
        """Delete a tenant.

        Today, tenants have a 1:m relationship with users. I.e., the User table
        has an FK to the Tenant table. PostgresSQL does a cascading delete on a
        row deletion. So if we deleted a Tenant row the simple way, we could
        delete Django admins (a.k.a. Goldstone system admins) or the
        default_tenant_admin, if they belonged to the doomed tenant.

        This override finds every Django superuser or default_tenant_admin
        who belongs to the doomed tenant.  These users are then moved out of
        the tenant before it's deleted.

        """
        from django.db.models import Q

        # For every Django admin or default_tenant_admin who's in the doomed
        # tenant...
        for user in get_user_model().objects.filter(
                Q(tenant=instance),
                Q(is_superuser=True) | Q(default_tenant_admin=True)):
            # ...Move the account out so it won't be deleted.
            user.tenant = None
            user.save()

        # Now do the delete.
        return super(TenantsViewSet, self).perform_destroy(instance)

    @django_and_tenant_admins_only
    def list(self, request, *args, **kwargs):
        """Provide a collection-of-objects GET response, for Django admins or
        tenant_admins.

        For Django admins, all the tenants are returned. For tenant_admins,
        only those tenants that are administered by the user are returned.

        """

        # return super(TenantsViewSet, self).list(request, *args, **kwargs)

        from rest_framework.response import Response

        # Create the queryset for this Django admin, or tenant_admin.
        instance = \
            self.filter_queryset(self.get_queryset()) \
            if request.user.is_superuser else \
            self.filter_queryset(Tenant.objects.filter(user=request.user))

        page = self.paginate_queryset(instance)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(instance, many=True)

        return Response(serializer.data)


class UserViewSet(BaseViewSet):
    """Access User resources that are nested under Tenant resources."""

    serializer_class = UserSerializer

    def get_send_email_extras(self):
        """Override djoser's SendEmailViewMixin method.

        At some point it'll be more sensible to just write code for sending an
        email rather than do all this subclassing.

        """

        return {'subject_template_name': 'new_tenant.txt',
                'plain_body_template_name': 'new_tenant_body.txt'}

    def _get_tenant(self):
        """Return the underlying Tenant row, or raise a
        PermissionDenied exception."""

        target_uuid = self.get_parents_query_dict()["tenant"]

        try:
            return Tenant.objects.get(uuid=target_uuid)
        except ObjectDoesNotExist:
            raise PermissionDenied

    def get_queryset(self):
        """Return the queryset for list views iff the user is a tenant_admin of
        the underlying tenant."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == tenant and \
           self.request.user.tenant_admin:
            return get_user_model().objects.filter(tenant=tenant)
        else:
            raise PermissionDenied

    def perform_create(self, serializer):
        """Create a user for the underlying Tenant."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == tenant and \
           self.request.user.tenant_admin:
            # We are clear to create a new user, as a member of this tenant.
            user = serializer.save(tenant=tenant)

            # Notify the new user that he/she's created, and a member of this
            # tenant. We tack the tenant's name to the User object so that our
            # overridden get_email_context can get at it.
            user.perform_create_tenant_name = tenant.name
            self.send_email(**self.get_send_email_kwargs(user))

        else:
            raise PermissionDenied

    def perform_destroy(self, instance):
        """Delete a user of the underlying Tenant, if permissions and delete
        restrictions are met."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == instance.tenant == tenant and \
           self.request.user.tenant_admin and \
           not instance.default_tenant_admin and \
           not instance.is_superuser and \
           instance != self.request.user:
            super(UserViewSet, self).perform_destroy(instance)
        else:
            raise PermissionDenied


class CloudViewSet(BaseViewSet):
    """Access Cloud resources that are nested under Tenant resources."""

    serializer_class = CloudSerializer

    def _get_tenant(self):
        """Return the underlying Tenant row, or raise a
        PermissionDenied exception."""

        target_uuid = self.get_parents_query_dict()["tenant"]

        try:
            return Tenant.objects.get(uuid=target_uuid)
        except ObjectDoesNotExist:
            raise PermissionDenied

    def get_queryset(self):
        """Return the queryset for list views iff the user is a tenant_admin of
        the underlying tenant."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == tenant and \
           self.request.user.tenant_admin:
            return Cloud.objects.filter(tenant=tenant)
        else:
            raise PermissionDenied

    def perform_create(self, serializer):
        """Create a cloud in the underlying Tenant."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == tenant and \
           self.request.user.tenant_admin:
            # We are clear to create a new cloud, as a member of this tenant.
            # Save this row with a relation to the underlying tenant.
            serializer.save(tenant=tenant)
        else:
            raise PermissionDenied

    def perform_destroy(self, instance):
        """Delete a cloud in the underlying Tenant, if permissions and delete
        restrictions are met."""

        # Get the underlying Tenant row.
        tenant = self._get_tenant()

        # N.B. User.is_authenticated() filters out the AnonymousUser object.
        if self.request.user.is_authenticated() and \
           self.request.user.tenant == instance.tenant == tenant and \
           self.request.user.tenant_admin:
            super(CloudViewSet, self).perform_destroy(instance)
        else:
            raise PermissionDenied
