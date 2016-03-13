# echo "Pulling goldstone containers"
# $GS_PATH/goldstone/bin/docker-compose -f $GS_PATH/goldstone/docker-compose.yml pull

# find pkg type
if [ -f /usr/lib/systemd/system/goldstone-server-enterprise.service ]; then
  PKGNAME=goldstone-server-enterprise
else
  PKGNAME=goldstone-server
fi
export GS_PATH="/opt"


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

if [ $PKGNAME="goldstone-server-enterprise" ]; then
  echo " Before starting $PKGNAME you must set your Goldstone license variables."
  echo " You can do this via the following commands:     "
  echo "      # export GOLDSTONE_REPO_USER=<<YOUR_REPO_USER>> "
  echo "      # export GOLDSTONE_REPO_PASS=<<YOUR_REPO_PASS>>"
  echo "      # export GOLDSTONE_REPO_EMAIL=<<YOUR_REPO_EMAIL>>"
  echo ""
  echo "Please contact your Goldstone sales rep is you have any questions."
fi

echo "*****************************************************************************"

# restart the syslog daemon (assumes systemd)
systemctl restart rsyslog
