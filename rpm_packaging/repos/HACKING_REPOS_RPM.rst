This document outlines the process for creating the goldstone_repos RPM.

This RPM installs several yum repositories that contain the goldstone application and it's dependencies.

The RPM is built with a tool called `RPMwand`_ which simplifies and automates RPM builds. It can be installed with the following command: ::

	# rpm -U https://rpmwand.googlecode.com/files/rpmwand-0.9.3-1.noarch.rpm

.. _RPMwand: https://code.google.com/p/rpmwand/

Once this tool has been installed, it is relatively trivial to create the new RPM. To do so, first add your files into the skeleton directory (goldstone_repo-skel) in the correct location (usualy ``/etc/yum.repos.d/``) and then run the ``files`` command: ::

	# rpmwand files goldstone_repos

This updates ``goldstone_repos-files.txt`` which contains all the files to be installed. It should look like this: ::

	#See details of directives at http://www.rpm.org/max-rpm/s1-rpm-inside-files-list-directives.html
	%dir /etc/yum.repos.d
	%attr(644,-,-) /etc/yum.repos.d/elasticsearch-1.2.repo
	%attr(644,-,-) /etc/yum.repos.d/epel-testing.repo
	%attr(644,-,-) /etc/yum.repos.d/goldstone.repo
	%attr(644,-,-) /etc/yum.repos.d/epel.repo
	%attr(644,-,-) /etc/yum.repos.d/logstash-1.4.repo	

Assuming that it has picked up all your files, go ahead and build the RPM: ::

	# rpmwand build goldstone_repo 1.0

The last argument is the version number. 

The new RPM should show up in ``RPMS/noarch/goldstone_repos-0.2-1.noarch.rpm`` (assuming you used 0.2 as the version).
