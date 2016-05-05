#!/bin/bash

SHELL_PROFILE=${HOME}/.bash_profile
SRC_HOME=${HOME}/devel
DOWNLOAD_OVA=Y
DELETE_OVA=N
OVA_DOWNLOAD_DIR=/tmp
CONFIGURE_VBOX=Y
DOCKER_VM=

function usage {
    echo "Usage: $0 --docker-vm=name|none [--shell-profile=filename] [--src-home=dirname] [--ova-download-dir=dirname] [--no-download-ova] [--delete-ova] [--no-configure-vbox]"
}

for arg in "$@" ; do
    case $arg in
        --shell-profile=*)
            SHELL_PROFILE="${arg#*=}"
            shift
        ;;
        --src-home=*)
            SRC_HOME="${arg#*=}"
            shift
        ;;
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
        ;;
        --ova-download-dir=*)
            OVA_DOWNLOAD_DIR="${arg#*=}"
            shift
        ;;
        --no-download-ova)
            DOWNLOAD_OVA=N
        ;;
        --delete-ova)
            DELETE_OVA=Y
        ;;
        --no-configure-vbox)
            CONFIGURE_VBOX=N
        ;;
        --help)
            usage
            exit 0
        ;;
        *)
            # unknown option
            usage
            exit 1
        ;;
    esac
done

if [[ "X$DOCKER_VM" == "X" ]] ; then
    usage
    exit 1
fi

export GS_PROJ_TOP_DIR=${SRC_HOME}/goldstone-server

# 
# install brew prerequisites
#  (todo) this is very mac specific.  generalize for other platforms
OS_VARIANT=`uname -s`
BREW_INSTALLED=`which brew`
echo "OS_VARIANT = $OS_VARIANT"
echo "BREW_INSTALLED = $BREW_INSTALLED"
if [[ $OS_VARIANT == "Darwin" && $BREW_INSTALLED == /* ]] ; then
    echo "$(tput setaf 2)Installing prerequisites$(tput sgr 0)"
    brew install python > /dev/null 2>&1 
    brew install git > /dev/null 2>&1
    brew install postgresql > /dev/null 2>&1
    brew install pyenv-virtualenvwrapper > /dev/null 2>&1
else
    echo "$(tput setaf 3)This does not appear to be OSX.  Please install these manually when this script finishes:$(tput sgr 0)"
    echo "$(tput setaf 3)    - git$(tput sgr 0)"
    echo "$(tput setaf 3)    - python$(tput sgr 0)"
    echo "$(tput setaf 3)    - postgres$(tput sgr 0)"
    echo "$(tput setaf 3)    - pyenv-virtualenvwrapper$(tput sgr 0)"
fi

# 
# make the environment changes stick
#
echo "$(tput setaf 2)Adding environment to ${SHELL_PROFILE}.  Review and adjust as necessary.$(tput sgr 0)"
echo >> $SHELL_PROFILE
echo "##### Begin Goldstone Server Environment #####" >> $SHELL_PROFILE
echo "export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python" >> $SHELL_PROFILE
echo "export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv" >> $SHELL_PROFILE
echo "export WORKON_HOME=${HOME}/.virtualenvs" >> $SHELL_PROFILE
echo "export PROJECT_HOME=${SRC_HOME}" >> $SHELL_PROFILE
echo "export GS_PROJ_TOP_DIR=${SRC_HOME}/goldstone-server" >> $SHELL_PROFILE
echo "export STACK_VM='RDO-kilo'" >> $SHELL_PROFILE  # set to the name of your OpenStack VM
echo "export DOCKER_VM=$DOCKER_VM" >> $SHELL_PROFILE             # if you run docker in a VM, set to the name of the VM
echo "export GS_APP_LOCATION=container" >> $SHELL_PROFILE  # set to 'local' if you want to run the app server locally
echo "export GS_APP_EDITION=oss" >> $SHELL_PROFILE         # set to 'gse' if you have access to the enterprise repositories
echo "source /usr/local/bin/virtualenvwrapper.sh" >> $SHELL_PROFILE
echo "##### End Goldstone Server Environment #####" >> $SHELL_PROFILE

# 
# set up virtual env
# 
echo "$(tput setaf 2)Creating the goldstone-server virtualenv$(tput sgr 0)"
/usr/local/bin/pyenv-sh-virtualenvwrapper > /dev/null
export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
export WORKON_HOME=${HOME}/.virtualenvs
export PROJECT_HOME=${SRC_HOME}
source /usr/local/bin/virtualenvwrapper.sh > /dev/null
mkvirtualenv -a $PROJECT_HOME/goldstone-server goldstone-server

# 
# downloading and configuring the development RDO instance
# 
if [[ $DOWNLOAD_OVA == 'Y' ]] ; then 
    echo "$(tput setaf 2)Downloading a developer OpenStack VM (this might take a while)$(tput sgr 0)"
    cd $OVA_DOWNLOAD_DIR
    curl -GO https://ab869301cdc499c198b6-69cf3576870bc238e91b4537dc60466a.ssl.cf5.rackcdn.com/RDO-kilo-20160204.ova
fi 

if [ -f "$OVA_DOWNLOAD_DIR/RDO-kilo-20160204.ova" ] ; then
    echo "$(tput setaf 2)Importing the OpenStack VM$(tput sgr 0)"
    VBoxManage import $OVA_DOWNLOAD_DIR/RDO-kilo-20160204.ova --options keepallmacs
fi

if [[ $DELETE_OVA == 'Y' ]] ; then
    echo "$(tput setaf 2)Removing $OVA_DOWNLOAD_DIR/RDO-kilo-20160204.ova $(tput sgr 0)"
    rm -f $OVA_DOWNLOAD_DIR/RDO-kilo-20160204.ova
fi 

if [[ $CONFIGURE_VBOX == 'Y' ]] ; then
    cd ${GS_PROJ_TOP_DIR}
    echo "$(tput setaf 2)Configuring VirtualBox networking $(tput sgr 0)"
    if [[ $DOCKER_VM != "none" ]] ; then
        bin/configure_vbox.sh
    else
        bin/configure_vbox.sh --no-docker
    fi
fi
echo 
echo "$(tput setaf 3)Remember to source $SHELL_PROFILE before running 'workon goldstone-server'$(tput sgr 0)"
echo "$(tput setaf 3)If you will be building docker images, you should also execute:$(tput sgr 0)"
echo "$(tput setaf 3)    $ pip install -r docker/goldstone-base/config/requirements.txt$(tput sgr 0)"
echo "$(tput setaf 3)    $ pip install -r docker/goldstone-base/config/test-requirements.txt$(tput sgr 0)"

echo
