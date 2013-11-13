from django.shortcuts import render


# class LeaseTableMixIn(object):
#     def _get_leases(self, search_opts=None):
#         try:
#             return lease.lease_list(self.request, search_opts=search_opts)
#         except Exception:
#             exceptions.handle(self.request,
#                               _('Unable to retrieve lease list.'))
#             return []
# 
# 
# class IndexView(tables.DataTableView, VolumeTableMixIn):
#     table_class = project_tables.VolumesTable
#     template_name = 'project/volumes/index.html'
# 
#     def get_data(self):
#         """
#         Given a tenant id, list all leases for that tenant.
# 
#         :param tenant_id: The tenant id to list. Default to listing all
#                         leases with admin priviledges.
#         """
#         leases = self._get_leases()
#         return leases
# 
# 
# class CreateView(forms.ModalFormView):
#     form_class = project_forms.CreateForm
#     template_name = 'project/volumes/create.html'
#     success_url = reverse_lazy("horizon:project:volumes:index")
# 
#     def create(lease):
#         """
#         Create a lease and persist it to the database.
#         """
#         pass
# 
# 
# def update(lease):
#     """
#     update an existing lease
#     """
#     pass
# 
# 
# def delete(lease):
#     """
#     delete a lease
#     """
#     pass
# 
# 
# def expiring_leases(tolerance=300, tenant=None):
#     """
#     Find leases expiring
#     """
#     pass
