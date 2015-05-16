# Goldstone

Goldstone is the first purpose-built monitoring, management and analytics platform for operating OpenStack clouds. The Goldstone server allows OpenStack cloud operators to:

* Discover and visualize the OpenStack cloud configuration and logs
* Report on key events and metrics at all layers of the cloud platform 

Future plans including adding the ability to:

* Analyze and diagnose common issues
* Automate common cloud management and maintenance tasks

## Installation

The installation instructions are in [INSTALL](INSTALL.md).

## Usage

Point your browser to the Goldstone server and login using the "superuser" account you created during the installation.

## Code development

[HACKING](HACKING.md) has instructions for installing and using the Goldstone development environment.

### Goldstone API

The client provided by this project is only one possible client. Anyone can create a new and different Goldstone client that uses the Goldstone API, and provideS a different user experience.

The Goldstone API is interactively documented via [swagger-ui](https://github.com/swagger-api/swagger-ui). To access the API documentation:

1. Install the Goldstone development environment.
2. Using your favorite browser, open the file `localhost:8000/docs`

## Support and discussion

If you need general help or have questions, please submit a message to the **goldstone-users** Google Group.

If you have a specific feature request or bug report, please submit it as an issue on this project's Issues page.

If you're working on the codebase and have a coding question, or a question about Goldstone internals, post your question to the **goldstone-dev** Google Group, or join the **#goldstone** IRC channel on freeenode.


All pull requests should be submitted to the master branch. They should include unit tests where feasible, and additional or updated documentation if appropriate.


## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

* [Read the license's summary](http://creativecommons.org/licenses/by-sa/4.0/)
* [Read the license's full legal text](http://creativecommons.org/licenses/by-sa/4.0/legalcode)
