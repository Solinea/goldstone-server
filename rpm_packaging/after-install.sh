# echo "Pulling goldstone containers"
# $GS_PATH/goldstone/bin/docker-compose -f $GS_PATH/goldstone/docker-compose.yml pull

# find pkg type
if [ -z /usr/lib/systemd/system/goldstone-server-enterprise.service ]; then
  PKGNAME=goldstone-server-enterprise
else
  PKGNAME=goldstone-server
fi

echo "*****************************************************************************"
echo ""
echo " Modify $GS_PATH/goldstone/config/goldstone-prod.env"
echo " before starting $PKGNAME. See $GS_PATH/goldstone/INSTALL.md"
echo " for details."
echo ""
echo " To enable and start $PKGNAME, run:"
echo ""
echo "     systemctl enable $PKGNAME"
echo "     systemctl start $PKGNAME"
echo ""
echo "*****************************************************************************"

# restart the syslog daemon (assumes systemd)
systemctl restart rsyslog
