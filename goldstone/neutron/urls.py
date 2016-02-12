from django.conf.urls import url, patterns
from .views import AgentsDataView, ExtensionsDataView, RouterDataView, \
    NetworkDataView, QuotaDataView, SubnetDataView, SubnetPoolDataView, \
    FloatingIPDataView, PortDataView, SecurityGroupDataView, \
    SecurityGroupRuleDataView

# Views handled by DjangoRestFramework Views.
urlpatterns = patterns(
    '',
    url(r'^agents', AgentsDataView.as_view(),
        name='neutron-agents'),
    url(r'^extensions', ExtensionsDataView.as_view(),
        name='neutron-extensions'),
    url(r'^routers',
        RouterDataView.as_view(),
        name='neutron-routers'),
    url(r'^networks', NetworkDataView.as_view(),
        name='neutron-networks'),
    url(r'^quotas', QuotaDataView.as_view(),
        name='neutron-quotas'),
    url(r'^subnets', SubnetDataView.as_view(),
        name='neutron-subnets'),
    url(r'^subnet-pools', SubnetPoolDataView.as_view(),
        name='neutron-subnet-pools'),
    url(r'^floating-ips', FloatingIPDataView.as_view(),
        name='neutron-floating-ips'),
    url(r'^ports', PortDataView.as_view(),
        name='neutron-ports'),
    url(r'^security-groups',
        SecurityGroupDataView.as_view(),
        name='neutron-security-groups'),
    url(r'^security-group-rules',
        SecurityGroupRuleDataView.as_view(),
        name='neutron-security-group-rules'),
    )
