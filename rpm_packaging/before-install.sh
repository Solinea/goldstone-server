/usr/bin/getent group goldstone \
    || /usr/sbin/groupadd -r goldstone
/usr/bin/getent passwd goldstone \
    || /usr/sbin/useradd -r -g goldstone -d %{prefix}/goldstone -s /sbin/nologin goldstone
