# shut down service
systemctl stop goldstone-server
systemctl disable goldstone-server

# remove stopped containers
echo "Removing containers..."
docker rm -f $(docker ps -a | grep goldstone | awk '{print $1}' | xargs) || /bin/true
echo "Removing images..."
docker rmi -f $(docker images | grep goldstone | awk '{print $3}' | xargs) || /bin/true
