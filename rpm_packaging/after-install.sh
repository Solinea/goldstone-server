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
if [ "$PKGNAME" = "goldstone-server-enterprise" ]; then
  echo ""
  echo " Before starting $PKGNAME you must set your Goldstone license variables."
  echo " and login into the custom repository."
  echo " You can do this via the following commands:        "
  echo "   # `tput setaf 6`export GOLDSTONE_REPO_USER=<<YOUR_REPO_USER>>`tput sgr0`  "
  echo "   # `tput setaf 6`export GOLDSTONE_REPO_PASS=<<YOUR_REPO_PASS>>`tput sgr0`  "
  echo "   # `tput setaf 6`docker login -u \$GOLDSTONE_REPO_USER -p \$GOLDSTONE_REPO_PASS gs-docker-ent.bintray.io`tput sgr0`"
  echo ""
  echo "Please contact `tput setaf 2`support@solinea.com`tput sgr0` if you have any questions."
fi

echo ""
echo " `tput setaf 6`Modify $GS_PATH/goldstone/config/goldstone-prod.env`tput sgr0`"
echo " before starting $PKGNAME. See $GS_PATH/goldstone/INSTALL.md"
echo " for details."
echo ""
echo " To enable and start $PKGNAME, run:"
echo ""
echo "     `tput setaf 6`systemctl enable $PKGNAME`tput sgr0`"
echo "     `tput setaf 6`systemctl start $PKGNAME`tput sgr0`"
echo ""


echo "*****************************************************************************"

# restart the syslog daemon (assumes systemd)
systemctl restart rsyslog
