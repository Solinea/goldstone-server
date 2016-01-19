/usr/bin/getent group goldstone || /usr/sbin/groupadd -r goldstone
/usr/bin/getent passwd goldstone \
    || /usr/sbin/useradd -r -g goldstone -d %{prefix}/goldstone -s /sbin/nologin goldstone

# install docker-compose
export GS_PATH="/opt"
export DC_URL="https://github.com/docker/compose/releases/download/1.5.2/docker-compose-"

if [[ $# == 1 && $1 == 1 ]] ; then
    echo "Installing docker-compose to %{prefix}/goldstone/bin"
    echo ""
    /usr/bin/curl -# -o $GS_PATH/goldstone/bin/docker-compose --create-dirs -L \
        $DC_URL`uname -s`-`uname -m` \
        && chmod +x $GS_PATH/goldstone/bin/docker-compose
fi
