# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.provider "virtualbox" do |vb|
    vb.gui = false
    vb.cpus = "2"
    vb.memory = "4096"
  end

  config.vm.provision "shell", inline: <<-SHELL
    echo -n                              >  /etc/profile.d/ospath.sh
    echo 'export OS_TENANT_NAME=admin'   >> /etc/profile.d/ospath.sh
    echo 'export OS_USERNAME=admin'      >> /etc/profile.d/ospath.sh
    echo 'export OS_PASSWORD=solinea'    >> /etc/profile.d/ospath.sh
    echo 'export OS_AUTH_URL=http://172.24.4.100:5000/v2.0' >> /etc/profile.d/ospath.sh
  SHELL

  config.vm.box = "ubuntu/trusty64"
  # config.vm.box = "coreos-alpha"
  config.vm.provision :docker
  config.vm.provision :docker_compose, yml: "/vagrant/docker/docker-compose.yml", run: "always"

  config.vm.provision "shell",
       inline: "docker exec docker_gsapp_1 . /venv/bin/activate &&  /venv/bin/fab -f post_install.py -H 172.24.4.100 -p solinea configure_stack:172.24.4.1,True,True"

end
