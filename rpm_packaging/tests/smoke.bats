#!/usr/bin/env bats

# expects to be run as
# bats [this file name] [GSA_RPMNAME] [GSA_BINARY] [GSA_CONF_FILE]
export GS_BINARY=${3-/opt/goldstone/bin/docker-compose}
export GS_CONF_FILE=${4-/etc/rsyslog.d/goldstone.conf}
export STARTUP_SCRIPT="/usr/lib/systemd/system/${PKGNAME}.service"

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

@test "log dir in place" {
  run stat /var/log/goldstone
  [ "$status" -eq 0 ]
}

@test "sql_data dir in place" {
  run stat /var/lib/goldstone/sql_data
  [ "$status" -eq 0 ]
}

@test "es_data dir in place" {
  run stat /var/lib/goldstone/es_data
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

@test "server rpm removes" {
  run yum remove -y $PKGNAME
  [ "$status" -eq 0 ]
}
