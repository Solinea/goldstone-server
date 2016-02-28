#!/bin/bash

SHELL_PROFILE=${HOME}/.bash_profile
SRC_HOME=${HOME}/devel
export GS_PROJ_TOP_DIR=${SRC_HOME}/goldstone-server

# 
# install brew prerequisites
# 
brew install python || /bin/true
brew install git || /bin/true
brew install pyenv-virtualenvwrapper || /bin/true
brew install postgres || /bin/true               # TODO: verify this is still required

# 
# set up virtual env
# 
/usr/local/bin/pyenv-sh-virtualenvwrapper
export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
export WORKON_HOME=${HOME}/.virtualenvs
export PROJECT_HOME=${SRC_HOME}
source /usr/local/bin/virtualenvwrapper.sh

# 
# make the environment changes stick
#
echo >> $SHELL_PROFILE
echo "##### Begin Goldstone Server Environment #####" >> $SHELL_PROFILE
echo "export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python" >> $SHELL_PROFILE
echo "export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv" >> $SHELL_PROFILE
echo "export WORKON_HOME=${HOME}/.virtualenvs" >> $SHELL_PROFILE
echo "export PROJECT_HOME=${SRC_HOME}" >> $SHELL_PROFILE
echo "export GS_PROJ_TOP_DIR=${SRC_HOME}/goldstone-server" >> $SHELL_PROFILE
echo "source /usr/local/bin/virtualenvwrapper.sh" >> $SHELL_PROFILE
echo "##### End Goldstone Server Environment #####" >> $SHELL_PROFILE

# 
# create the python virtual environment
# 
mkvirtualenv -a $PROJECT_HOME/goldstone-server goldstone-server
workon goldstone-server
pip install Django==1.8.7
deactivate
