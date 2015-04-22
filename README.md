# Goldstone

Goldstone is the first purpose-built monitoring, management and analytics platform for operating OpenStack clouds. The Goldstone server allows OpenStack cloud operators to:

* Discover and visualize the OpenStack cloud configuration and logs
* Report on key events and metrics at all layers of the cloud platform 
* Analyze and diagnose common issues
* Automate common cloud management and maintenance tasks

## Installation

The installation instructions are in [INSTALL](INSTALL.md).

## Usage

The installation creates a system administrator account with the credentials, "admin" / "changeme".  Your first task is to change its password and e-mail address. You can do this from the account settings page.

The installation also creates an initial tenant, with a tenant administrator. The tenant administrator is also Goldstone's default tenant administrator. You may wish to:
* change this tenant's name, owner name, or contact information
* change the tenant admin's name or password, which is "gsadmin" / "changeme"
* create more tenant admins


## Support, feature requests, bug fixes, development, etc.

Please send a pull request to the master branch. All pull requests should include unit tests where feasible, and additional or updated documentation if appropriate.

### Code development

[HACKING](HACKING.md) has instructions for setting up a Goldstone development environment.

The recommended steps are:

1. Fork this repository on GitHub.
2. Follow the instructions in [HACKING](HACKING.md) to set up your development environment.
3. Verify that you can build a working Goldstone image before you make any edits!
4. Make your improvements in your fork.
5. Submit a pull request to us. Be sure to a problem description, overview of your changes, and unit tests.

#### Python code

Please follow the generally accepted practices, based on these style guidelines:

* [PEP 8](https://www.python.org/dev/peps/pep-0008/) - Style Guide
* [PEP 257](https://www.python.org/dev/peps/pep-0257/) - Docstring conventions
* [Openstack Style Guidelines](http://docs.openstack.org/developer/hacking/)

To test that your code conforms to this project's standards:

```bash
$ tox -e pep8
$ tox -e pylint
```

#### JavaScript code

TBD


#### Getting help

If you need help or have questions, you can submit them as issues in this repository. Or, you can ask your question in xxxxxxxxxxxxxxxxx.


## API

The Goldstone API is documented in xxxxxxxxxxxxxxxxx.

## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

* [Read the license's summary](http://creativecommons.org/licenses/by-sa/4.0/)
* [Read the license's full legal text](http://creativecommons.org/licenses/by-sa/4.0/legalcode)
