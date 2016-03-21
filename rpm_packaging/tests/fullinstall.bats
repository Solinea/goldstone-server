#!/usr/bin/env bats

export PKGNAME=goldstone-server-enterprise
export GS_BINARY=${3-/opt/goldstone/bin/docker-compose}
export GS_CONF_FILE=${4-/etc/rsyslog.d/goldstone.conf}
export STARTUP_SCRIPT="/usr/lib/systemd/system/${PKGNAME}.service"
export GSA_RPMNAME=`ls /vagrant_data/pkg/redhat/goldstone-server-enterprise-*.rpm | head -1`

@test "rpmname env exists" {
  run echo $GSA_RPMNAME
  [ "$status" -eq 0 ]
  run echo $PKGNAME
  [ "$status" -eq 0 ]
}

@test "pkg exists" {
  run stat $GSA_RPMNAME
  [ "$status" -eq 0 ]
}

@test "pkg installs" {
  run yum localinstall -y $GSA_RPMNAME
  run rpm -qil $PKGNAME
  [[ ${lines[0]} = *"Name"*  ]]
}

@test "docker-compose is installed" {
  run stat $GS_BINARY
  [ "$status" -eq 0 ]
}

@test "server is running" {
  skip
  skip "not yet implemented"
  run stat $GS_BINARY
  [ "$status" -eq 0 ]
}

@test "syslog config file is installed" {
  run stat $GS_CONF_FILE
  [ "$status" -eq 0 ]
}

@test "startup script file is installed" {
  run stat $STARTUP_SCRIPT
  [ "$status" -eq 0 ]
}

@test "elasticsearch configs in place" {
  run stat /usr/share/elasticsearch/config/elasticsearch.yml
  [ "$status" -eq 0 ]
}

@test "elasticsearch templates in place" {
  run stat /usr/share/elasticsearch/config/templates/ceilo_events_template.json
  [ "$status" -eq 0 ]
}

@test "goldstone user created" {
  run getent passwd goldstone
  [ "$status" -eq 0 ]
}

@test "goldstone group created" {
  run getent group goldstone
  [ "$status" -eq 0 ]
}

@test "ensure docker login to bintray" {
  # check that $HOME/.docker/config.json contain gs-docker-ent.bintray.io
  run grep bintray.io /root/.docker/config.json
  [ "$status" -eq 0 ]
}

@test "docker images retrieved" {
  # docker images contains all images
  systemctl start goldstone-server-enterprise
  sleep 600
  run bash -c "docker images | grep gs-docker-ent.bintray.io/goldstone-app-e | wc -l"
  [[ ${output} = "1"  ]]
}

@test "docker containers running" {
  # docker containers running
  run bash -c "docker ps | grep goldstone_gsapp_1 | wc -l"
  [[ ${output} = "1" ]]
}

@test "server rpm removes" {
  run yum remove -y $PKGNAME
  [ "$status" -eq 0 ]
}

@test "docker containers stopped" {
  sleep 60
  run bash -c "docker ps | wc -l"
  [[ ${output} = 1  ]]
}

@test "docker images removed" {
  run bash -c "docker images | wc -l"
  [[ ${output} = "1"  ]]
}
