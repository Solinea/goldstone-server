# echo "Pulling goldstone containers"
# $GS_PATH/goldstone/bin/docker-compose -f $GS_PATH/goldstone/docker-compose.yml pull

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

# restart the syslog daemon (assumes systemd)
systemctl restart rsyslog
