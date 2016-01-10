USE_CONTAINER ?= true
DOCKER_IMAGE_NAME=goldstone-server-build-image
DOCKER_CONTAINER_NAME=goldstone-server-build-container
JOB ?= native
RUNNING=`bin/check_for_containers.sh $(DOCKER_CONTAINER_NAME)`
PKGNAME=goldstone-server
PKGSUMMARY=Solinea Goldstone server
PKGCAT=Applications/System
PKGLIC=Solinea Software License Agreement (version 1)
PKGURL=http://www.solinea.com/goldstone
PKGOS=linux
PKGPREFIX=/
RPMPREREQ=-d python -d curl
DEBPREREQ=-d python -d curl
PKGVENDOR=Solinea
PKGUSER=goldstone
PKGCONF=--config-files /etc/goldstone-agent.conf --config-files /etc/init.d/goldstone-agent
PKGVENDOR=Solinea
PKGUSER=goldstone
PKGCONF=
PKGDES="For the most up-to-date information please visit the project website at https://github.com/solinea/goldstone-server. To stay informed about new releases and other user related topics, please register with the Solinea mailing list."
PKGEMAIL=goldstone@solinea.com
UBUBINDIR=rpm_packaging/pkg/ubuntu
RHBINDIR=rpm_packaging/pkg/redhat
PKGARCH=x86_64
RPMDIST=el7
PKGBUILDDIR=rpm_packaging/temp/
PKGFILES=README.md  docs/INSTALL.md docs/CHANGELOG.md LICENSE docker/docker-compose.yml rpm_packaging/systemd/system/goldstone-server.service rpm_packaging/rsyslog/goldstone.conf
# version management variables
PKGEPOCH=`bin/semver.sh epoch`
PKGVER=`bin/semver.sh version`
PKGREL=`bin/semver.sh release`
RPMFILENAME?=`bin/semver.sh rpmname`
DEBFILENAME?=`bin/semver.sh debname`

.PHONY:

default: rpm

clean:
	rm -rf PKG_packaging/pkgs/*
	rm -rf rpm_packaging/temp/*

rpm: rpm_container rpm_collect

rpm_native: rpm_build rpm_test

deb: deb_container deb_build deb_test

rpm_container:
	mkdir -p $(PKGBUILDDIR)
	cp $(PKGFILES) $(PKGBUILDDIR)
	if [ $(USE_CONTAINER) ]; then \
		if [ $(RUNNING) -gt 0 ] ; then docker rm -f $(DOCKER_CONTAINER_NAME) 2>/dev/null; fi; \
		docker build --force-rm=true -t $(DOCKER_IMAGE_NAME) -f rpm_packaging/Dockerfile.rpm . ; \
		docker run --name $(DOCKER_CONTAINER_NAME) $(DOCKER_IMAGE_NAME) make rpm_native; \
	fi

deb_container:
	if [ $(USE_CONTAINER) ]; then \
		if [ $(RUNNING) -gt 0 ] ; then docker rm -f $(DOCKER_CONTAINER_NAME) 2>/dev/null; fi; \
		docker build -t $(DOCKER_IMAGE_NAME) -f rpm_packaging/Dockerfile.deb .; \
		docker run --name $(DOCKER_CONTAINER_NAME) $(DOCKER_IMAGE_NAME) make $(JOB); \
	fi

rpm_build:
	# this target assumes fpm (https://github.com/jordansissel/fpm) is installed
	# --iteration is RPM release
	fpm -s dir -t rpm -n $(PKGNAME) $(RPMPREREQ)  \
	--verbose --epoch $(PKGEPOCH) --vendor $(PKGVENDOR) --category $(PKGCAT) \
	--rpm-os $(PKGOS) --rpm-user $(PKGUSER) --rpm-group $(PKGUSER) --description $(PKGDES) \
	--url $(PKGURL) $(PKGCONF) -m $(PKGEMAIL) --iteration $(PKGREL) \
	--rpm-dist $(RPMDIST) -v $(PKGVER) --prefix $(PKGPREFIX) \
	--before-install rpm_packaging/before-install.sh \
	--after-install rpm_packaging/after-install.sh \
	--before-remove rpm_packaging/before-remove.sh \
	--after-remove rpm_packaging/after-remove.sh \
	rpm_packaging/rsyslog/goldstone.conf=/etc/rsyslog.d/goldstone.conf \
	rpm_packaging/systemd/system/goldstone-server.service=/usr/lib/systemd/system/goldstone-server.service \
	docker/docker-compose.yml=/opt/goldstone/docker-compose.yml \
	docs/CHANGELOG.md=/opt/goldstone/CHANGELOG.md \
	docs/INSTALL.md=/opt/goldstone/INSTALL.md \
	LICENSE=/opt/goldstone/LICENSE \
	README.md=/opt/goldstone/README.md \
	docker/config/goldstone-dev.env=/opt/goldstone/goldstone-dev.env \
	docker/config/goldstone-prod.env=/opt/goldstone/goldstone-prod.env \
	docker/config/goldstone-test.env=/opt/goldstone/goldstone-test.env \
	docker/config/goldstone-search/templates/api_stats_template.json=/opt/goldstone/api_stats_template.json

deb_build:
	fpm -s dir -t deb -n $(RPMNAME) -v $(RPMVER) --description $(RPMDES) \
	--verbose --epoch $(RPMEPOCH) --vendor $(RPMVENDOR) --category $(RPMCAT) \
	--deb-user $(RPMUSER) --deb-group $(RPMUSER) --url $(RPMURL) -m $(RPMEMAIL) \
	--license "$(RPMLIC)" --iteration $(RPMREL) $(DEBPREREQ) \
	--before-install scripts/rpm-pre.sh --before-remove scripts/rpm-preun.sh \
	./goldstone-agent=/opt/goldstone/bin/goldstone-agent \
	./goldstone-agent.example.conf=/etc/goldstone-agent.conf \
	./goldstone-agent.init=/etc/init.d/goldstone-agent

rpm_test:
	env GSA_RPMNAME=$(RPMFILENAME) bats rpm_packaging/tests/smoke.bats

deb_test:
	env GSA_RPMNAME=$(DEBFILENAME) bats rpm_packaging/tests/smoke.bats

rpm_collect:
	mkdir -p $(RHBINDIR)
	docker cp $(DOCKER_CONTAINER_NAME):/tmp/goldstone/$(RPMFILENAME) $(RHBINDIR)

deb_collect:
	mkdir -p $(RHBINDIR)
	docker cp $(DOCKER_CONTAINER_NAME):/tmp/goldstone/$(DEBFILENAME) $(UBUBINDIR)
