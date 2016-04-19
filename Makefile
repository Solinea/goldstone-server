USE_CONTAINER ?= true
DOCKER_IMAGE_NAME=goldstone-server-build-image
DOCKER_CONTAINER_NAME=goldstone-server-build-container
RUNNING=`bin/check_for_containers.sh $(DOCKER_CONTAINER_NAME)`
PKGCAT=Applications/System
PKGURL=http://www.solinea.com/goldstone
PKGOS=linux
PKGPREFIX=/
RPMPREREQ=-d "python >= 2.7.5" -d curl
DEBPREREQ=-d python -d curl
PKGVENDOR=Solinea
PKGUSER=goldstone
PKGCONF=
PKGDES="For the most up-to-date information please visit the project website at https://github.com/solinea/goldstone-server. To stay informed about new releases and other user related topics, please register with the Solinea mailing list."
PKGEMAIL=goldstone@solinea.com
UBUBINDIR=rpm_packaging/pkg/ubuntu
RHBINDIR=rpm_packaging/pkg/redhat
PKGARCH=x86_64
RPMDIST=el7
# version management variables
PKGEPOCH=`bin/semver.sh epoch`
PKGVER=`bin/semver.sh version`
PKGREL=`bin/semver.sh release`
RPMFILENAME=`bin/semver.sh rpmname $(PKGNAME)`
DEBFILENAME=`bin/semver.sh debname`

###########################################################################
# Targets
#
# Two major targets inside Docker containers: rpm and gse
#     * `make rpm` builds an open source Goldstone Server RPM
#     * `make gse` builds an Goldstone Server Enterprise RPM
# Both targets assume that Docker and docker-machine are installed
#
# Other targets include:
#     * rpm_native (same as rpm but executed locally without a container)
#     * gse_native (same as gse but executed locally without a container)
#     * clean (removes already made RPM packages)
#     * rpm_container (creates container for RPM build)
#     * rpm_build (creates the RPM)
#     * rpm_test (runs integration tests on RPM)
#     * rpm_collect (copies the RPMs from the container to local FS)
###########################################################################

.PHONY: clean rpm rpm_container rpm_collect rpm_build rpm_test gse gse_native rpm_native version test

default: clean rpm

clean:
	rm -rf rpm_packaging/pkg/*

gse: PKGNAME=goldstone-server-enterprise
gse: JOB=gse_native
gse: rpm_container rpm_collect

rpm: JOB=rpm_native
rpm: rpm_container rpm_collect

gse_native: PKGNAME=goldstone-server-enterprise
gse_native: PKGSUMMARY=Solinea Goldstone Server Enterprise
gse_native: PKGLIC=Core Server: Apache 2.0, Addons: Solinea 1.0
gse_native: DCFILE=docker/docker-compose-enterprise.yml=/opt/goldstone/docker-compose.yml
gse_native: GSE_LIC=rpm_packaging/GSE_LICENSE.pdf=/opt/goldstone/GSE_LICENSE.pdf
gse_native: GSE_SYSTEMD=rpm_packaging/systemd/system/goldstone-server-enterprise.service=/usr/lib/systemd/system/goldstone-server-enterprise.service
gse_native: GSE_START=rpm_packaging/goldstone-server-enterprise=/usr/bin/goldstone-server-enterprise
gse_native: GSE_START_ATTR=--rpm-attr 0750,root,root:/usr/bin/goldstone-server-enterprise
gse_native: GSE_SYSTEMD_ATTR=--rpm-attr 0644,root,root:/usr/lib/systemd/system/goldstone-server-enterprise.service
gse_native: version rpm_build rpm_test

rpm_native: PKGNAME=goldstone-server
rpm_native: PKGSUMMARY=Solinea Goldstone server
rpm_native: PKGLIC=Apache 2.0
rpm_native: DCFILE=docker/docker-compose.yml=/opt/goldstone/docker-compose.yml
rpm_native: GSE_SYSTEMD=rpm_packaging/systemd/system/goldstone-server.service=/usr/lib/systemd/system/goldstone-server.service
rpm_native: GSE_START=rpm_packaging/goldstone-server=/usr/bin/goldstone-server
rpm_native: GSE_START_ATTR=--rpm-attr 0750,root,root:/usr/bin/goldstone-server
rpm_native: GSE_SYSTEMD_ATTR=--rpm-attr 0644,root,root:/usr/lib/systemd/system/goldstone-server.service
rpm_native: version rpm_build rpm_test

version:
	@echo "***********************************************************************"
	@echo " version: $(PKGVER)"
	@echo " release: $(PKGREL)"
	@echo "***********************************************************************"

rpm_container:
	if [ $(USE_CONTAINER) ]; then \
		if [ $(RUNNING) -gt 0 ] ; then docker rm -f $(DOCKER_CONTAINER_NAME) 2>/dev/null; fi; \
		docker build --force-rm=true -t $(DOCKER_IMAGE_NAME) -f rpm_packaging/Dockerfile.rpm . ; \
		docker run --name $(DOCKER_CONTAINER_NAME) $(DOCKER_IMAGE_NAME) make $(JOB); \
	fi

rpm_build:
	@echo "***********************************************************************"
	@echo " RPM BUILD"
	@echo " package name: $(PKGNAME)"
	@echo " rpm name    : $(RPMFILENAME)"
	@echo "***********************************************************************"
	# this target assumes fpm (https://github.com/jordansissel/fpm) is installed
	# --iteration is RPM release
	fpm -s dir -t rpm -n $(PKGNAME) $(RPMPREREQ) --license "$(PKGLIC)" \
	--verbose --epoch $(PKGEPOCH) --vendor $(PKGVENDOR) --category $(PKGCAT) \
	--rpm-os $(PKGOS) --rpm-user $(PKGUSER) --rpm-group $(PKGUSER) --description $(PKGDES) \
	--url $(PKGURL) $(PKGCONF) -m $(PKGEMAIL) --iteration $(PKGREL) \
	--rpm-dist $(RPMDIST) -v $(PKGVER) --prefix $(PKGPREFIX) \
	--before-install rpm_packaging/before-install.sh \
	--after-install rpm_packaging/after-install.sh \
	--before-remove rpm_packaging/before-remove.sh \
	--after-remove rpm_packaging/after-remove.sh \
    --config-files /opt/goldstone/config/goldstone-prod.env \
    --exclude '**placeholder' \
    --rpm-defattrdir 0700 \
	--rpm-attr 0750,root,root:/etc/rsyslog.d/goldstone.conf \
	$(GSE_START_ATTR) \
	$(GSE_SYSTEMD_ATTR) \
	-p $(RPMFILENAME) \
	$(DCFILE) \
	$(GSE_SYSTEMD) \
	$(GSE_START) \
	$(GSE_LIC) \
    rpm_packaging/var/log/goldstone/=/var/log/goldstone/ \
    rpm_packaging/var/lib/goldstone/=/var/lib/goldstone/ \
    rpm_packaging/var/lib/goldstone/sql_data/=/var/lib/goldstone/sql_data/ \
    rpm_packaging/var/lib/goldstone/es_data/=/var/lib/goldstone/es_data/ \
	rpm_packaging/rsyslog/goldstone.conf=/etc/rsyslog.d/goldstone.conf \
	docs/RELEASE_NOTES.md=/opt/goldstone/RELEASE_NOTES.md \
	docs/CHANGELOG.md=/opt/goldstone/CHANGELOG.md \
	docs/INSTALL.md=/opt/goldstone/INSTALL.md \
	LICENSE=/opt/goldstone/LICENSE \
    OSS_DISCLOSURE.pdf=/opt/goldstone/OSS_DISCLOSURE.pdf \
	README.md=/opt/goldstone/README.md \
	docker/config/goldstone-prod.env=/opt/goldstone/config/goldstone-prod.env \
	docker/goldstone-search/config/templates/api_stats_template.json=/usr/share/elasticsearch/config/templates/api_stats_template.json \
	docker/goldstone-search/config/templates/ceilo_events_template.json=/usr/share/elasticsearch/config/templates/ \
	docker/goldstone-search/config/templates/goldstone_metrics_template.json=/usr/share/elasticsearch/config/templates/ \
	docker/goldstone-search/config/templates/goldstone_reports_template.json=/usr/share/elasticsearch/config/templates/ \
	docker/goldstone-search/config/elasticsearch.yml=/usr/share/elasticsearch/config/ \
	docker/goldstone-search/config/logging.yml=/usr/share/elasticsearch/config/

rpm_test:
	@echo "***********************************************************************"
	@echo " RPM TEST"
	@echo " package name: $(PKGNAME)"
	@echo " rpm name    : $(RPMFILENAME)"
	@echo "***********************************************************************"
	env GSA_RPMNAME=$(RPMFILENAME) PKGNAME=$(PKGNAME) bats rpm_packaging/tests/smoke.bats

rpm_collect:
	@echo "***********************************************************************"
	@echo " RPM COLLECT"
	@echo " package name: $(PKGNAME)"
	@echo " rpm name    : $(RPMFILENAME)"
	@echo "***********************************************************************"
	mkdir -p $(RHBINDIR)
	docker cp $(DOCKER_CONTAINER_NAME):/tmp/goldstone-server/$(RPMFILENAME) $(RHBINDIR)
	file $(RHBINDIR)/*

test:
	if [ $(USE_CONTAINER) ]; then \
		if [ `bin/check_for_containers.sh goldstoneserver_gsapp_1` -gt 0 ] ; \
			then docker rm -f $(DOCKER_CONTAINER_NAME) 2>/dev/null; fi; \
		docker exec goldstoneserver_gsapp_1 python manage.py test \
	else \
		python manage.py test; \
	fi

cover:
	coverage run --source='./goldstone' --omit='./goldstone/settings/*,*/test*' \
		manage.py test goldstone --settings=goldstone.settings.docker_dev

run-desktop:
	./node_modules/.bin/electron desktop/

build-desktop:
	@echo "copying libraries to build directory ..."
	cp -r node_modules desktop/node_modules
	@echo "compiling mac application ..."
	./node_modules/.bin/electron-packager desktop/ Goldstone --overwrite --platform=darwin --arch=x64 --version=0.37.2 --icon=desktop/Icon.icns --app-version $(PKGVER) --ignore 'grunt*|karma*|casper'
	rm -rf desktop/node_modules
	@echo "done."
