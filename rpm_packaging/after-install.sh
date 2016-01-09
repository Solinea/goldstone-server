# restart the syslog daemon (assumes systemd)
systemctl restart rsyslog

export GS_PATH="/opt"
export DC_URL="https://github.com/docker/compose/releases/download/1.4.0/docker-compose-"

if [[ $# == 1 && $1 == 1 ]] ; then
    echo "Installing docker-compose to %{prefix}/goldstone/bin"
    echo ""
    /usr/bin/curl -# -o $GS_PATH/goldstone/bin/docker-compose --create-dirs -L \
        $DC_URL`uname -s`-`uname -m` \
        && chmod +x $GS_PATH/goldstone/bin/docker-compose

fi
echo "Pulling goldstone containers"
$GS_PATH/goldstone/bin/docker-compose -f $GS_PATH/goldstone/docker-compose.yml pull

echo "*****************************************************************************"
echo ""
echo " Modify $GS_PATH/goldstone/config/goldstone-prod.env"
echo " before starting goldstone-server. See $GS_PATH/goldstone/INSTALL.md"
echo " for details."
echo ""
echo " To enable and start goldstone-server, run:"
echo ""
echo "     systemctl enable goldstone-server"
echo "     systemctl start goldstone-server"
echo ""
echo "*****************************************************************************"
