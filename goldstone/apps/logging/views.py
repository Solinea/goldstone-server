# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'John Stanford'

from goldstone.views import *
from goldstone.apps.logging.models import HostAvailData
import logging
import traceback
import sys

logger = logging.getLogger(__name__)


class HostAvailView(ContextMixin, View):

    def get_context_data(self, **kwargs):
        context = ContextMixin.get_context_data(self, **kwargs)
        return context

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        try:
            dao = HostAvailData()
            data = dao.get_all()
            content = {
                "status": "success",
                "data" : data
            }
            return HttpResponse(content=json.dumps(content),
                                content_type='application/json')
        except:
            content = {
                "status" : "error",
                "message": sys.exc_info()[1].message,
                "trace": traceback.format_stack()
            }
            return HttpResponse(content=json.dumps(content), status=400,
                                content_type='application/json')




