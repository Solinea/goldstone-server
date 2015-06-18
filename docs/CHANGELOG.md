# Change Log

## [0.6.0](https://github.com/Solinea/goldstone-server/tree/0.6.0) (2015-06-17)

[Full Changelog](https://github.com/Solinea/goldstone-server/compare/0.5.1...0.6.0)

**Fixed bugs:**

- fab uninstall postgres cleanup errors when run from /opt/goldstone [\#33](https://github.com/Solinea/goldstone-server/issues/33)

**Closed issues:**

- fab install python 'name' TypeError on collecting OpenStack resources [\#36](https://github.com/Solinea/goldstone-server/issues/36)

**Merged pull requests:**

- Event design phase1 [\#38](https://github.com/Solinea/goldstone-server/pull/38) ([jxstanford](https://github.com/jxstanford))

- updated rpm spec for doc moves [\#54](https://github.com/Solinea/goldstone-server/pull/54) ([jxstanford](https://github.com/jxstanford))

- fixed broken tox runs by cleaning up setup.cfg [\#53](https://github.com/Solinea/goldstone-server/pull/53) ([jxstanford](https://github.com/jxstanford))

- First pass at travis-ci build, fixed RTD build problem [\#52](https://github.com/Solinea/goldstone-server/pull/52) ([jxstanford](https://github.com/jxstanford))

- Gold 808 [\#51](https://github.com/Solinea/goldstone-server/pull/51) ([lexjacobs](https://github.com/lexjacobs))

- Empty buckets [\#49](https://github.com/Solinea/goldstone-server/pull/49) ([stugots](https://github.com/stugots))

- Events api updates: add parameter-based querying of the events in the system [\#47](https://github.com/Solinea/goldstone-server/pull/47) ([stugots](https://github.com/stugots))

- Bump elasticsearch and logstash along with misc fixes/cleanups [\#46](https://github.com/Solinea/goldstone-server/pull/46) ([jxstanford](https://github.com/jxstanford))

- Config ceilometer events [\#45](https://github.com/Solinea/goldstone-server/pull/45) ([jxstanford](https://github.com/jxstanford))

- Dockerized development environment [\#44](https://github.com/Solinea/goldstone-server/pull/44) ([jxstanford](https://github.com/jxstanford))

- update fab installer to handle unspecified cloud settings [\#43](https://github.com/Solinea/goldstone-server/pull/43) ([stugots](https://github.com/stugots))

- Expose cloud settings for cloud admin users via API [\#42](https://github.com/Solinea/goldstone-server/pull/42) ([stugots](https://github.com/stugots))

- removed repo rpm stuff, and moved server rpm spec to rpm\_packaging. [\#41](https://github.com/Solinea/goldstone-server/pull/41) ([jxstanford](https://github.com/jxstanford))

## [0.5.1](https://github.com/Solinea/goldstone-server/tree/0.5.1) (2015-05-20)

[Full Changelog](https://github.com/Solinea/goldstone-server/compare/0.5.0...0.5.1)

**Closed issues:**

- API docs instructions in README.md are wrong [\#31](https://github.com/Solinea/goldstone-server/issues/31)

**Merged pull requests:**

- issue \#33: uninstaller cwd fix and removal of reconcile\_hosts from goldstone\_init [\#34](https://github.com/Solinea/goldstone-server/pull/34) ([jxstanford](https://github.com/jxstanford))

## [0.5.0](https://github.com/Solinea/goldstone-server/tree/0.5.0) (2015-05-17)

[Full Changelog](https://github.com/Solinea/goldstone-server/compare/0.4.9...0.5.0)

**Merged pull requests:**

- issue\_31: Fix API docs URL in README.md. [\#32](https://github.com/Solinea/goldstone-server/pull/32) ([stugots](https://github.com/stugots))

- added freenode channel \#goldstone [\#30](https://github.com/Solinea/goldstone-server/pull/30) ([jxstanford](https://github.com/jxstanford))

- Create freenode channel [\#29](https://github.com/Solinea/goldstone-server/pull/29) ([jxstanford](https://github.com/jxstanford))

- GOLD-776 convert all raw metric calls in client to summarized metric calls [\#27](https://github.com/Solinea/goldstone-server/pull/27) ([lexjacobs](https://github.com/lexjacobs))

- Gold 805: Create a CHANGELOG.md file, and set up for automatic generation [\#26](https://github.com/Solinea/goldstone-server/pull/26) ([stugots](https://github.com/stugots))

- GOLD-803: Remove references to Creative Commons licensing. [\#25](https://github.com/Solinea/goldstone-server/pull/25) ([stugots](https://github.com/stugots))

- Gold 786: Add API endpoints for the resource type and resource graphs [\#24](https://github.com/Solinea/goldstone-server/pull/24) ([stugots](https://github.com/stugots))

- Remove dummy viz' from nodeReport page; populate metric/resource lists via $.get; css mods [\#23](https://github.com/Solinea/goldstone-server/pull/23) ([lexjacobs](https://github.com/lexjacobs))

- CentOS7 RPM and installer [\#21](https://github.com/Solinea/goldstone-server/pull/21) ([jxstanford](https://github.com/jxstanford))

- Corrects filter param in logAnalysis viz. loglevel --\> syslog\_severity. [\#20](https://github.com/Solinea/goldstone-server/pull/20) ([lexjacobs](https://github.com/lexjacobs))

- GOLD-787 Dark theme for front end [\#19](https://github.com/Solinea/goldstone-server/pull/19) ([lexjacobs](https://github.com/lexjacobs))

- Shrinkwrap dependencies and set up sass to output to base.css. [\#18](https://github.com/Solinea/goldstone-server/pull/18) ([lexjacobs](https://github.com/lexjacobs))

## [0.4.9](https://github.com/Solinea/goldstone-server/tree/0.4.9) (2015-05-06)

[Full Changelog](https://github.com/Solinea/goldstone-server/compare/0.0.0...0.4.9)

**Closed issues:**

- merge master to GOLD-780 branch [\#14](https://github.com/Solinea/goldstone-server/issues/14)

**Merged pull requests:**

- Gold 778; metric viewer layout changes [\#17](https://github.com/Solinea/goldstone-server/pull/17) ([lexjacobs](https://github.com/lexjacobs))

- Gold 736 \> master;  Move js files outside of goldstone folder, but leave concatenated files inside for builds. [\#16](https://github.com/Solinea/goldstone-server/pull/16) ([lexjacobs](https://github.com/lexjacobs))

- stray import error made it through review and/or merge.  fixed. [\#15](https://github.com/Solinea/goldstone-server/pull/15) ([jxstanford](https://github.com/jxstanford))

- \(GOLD-708, GOLD 719\) - node avail chart circles placed properly and right colors [\#13](https://github.com/Solinea/goldstone-server/pull/13) ([lexjacobs](https://github.com/lexjacobs))

- clean up installer and support non-interactive installation \(GOLD-720, GOLD-773\) [\#12](https://github.com/Solinea/goldstone-server/pull/12) ([jxstanford](https://github.com/jxstanford))

- Trailing slashes on URLs, complete djoser password-reset loop [\#11](https://github.com/Solinea/goldstone-server/pull/11) ([stugots](https://github.com/stugots))

- test data generation [\#10](https://github.com/Solinea/goldstone-server/pull/10) ([jxstanford](https://github.com/jxstanford))

- cleaned up license, issue, and contact links [\#9](https://github.com/Solinea/goldstone-server/pull/9) ([jxstanford](https://github.com/jxstanford))

- API documentation [\#8](https://github.com/Solinea/goldstone-server/pull/8) ([stugots](https://github.com/stugots))

- Changes to README, INSTALL, and HACKING [\#7](https://github.com/Solinea/goldstone-server/pull/7) ([stugots](https://github.com/stugots))

- Initial pass at adding a custom metric viewer [\#6](https://github.com/Solinea/goldstone-server/pull/6) ([jxstanford](https://github.com/jxstanford))

- added CLAs and contribution instructions. moved HACKING to .md suffix to... [\#5](https://github.com/Solinea/goldstone-server/pull/5) ([jxstanford](https://github.com/jxstanford))

- Gold 731 3pp licenses [\#4](https://github.com/Solinea/goldstone-server/pull/4) ([jxstanford](https://github.com/jxstanford))

- Move all apps out of goldstone/apps [\#3](https://github.com/Solinea/goldstone-server/pull/3) ([stugots](https://github.com/stugots))

- Gold-760 add apache 2.0 license and update headers, remove prop license [\#2](https://github.com/Solinea/goldstone-server/pull/2) ([jxstanford](https://github.com/jxstanford))

- Remove all TODOs, add "fab clean" command [\#1](https://github.com/Solinea/goldstone-server/pull/1) ([stugots](https://github.com/stugots))

## [0.0.0](https://github.com/Solinea/goldstone-server/tree/0.0.0) (2015-04-17)



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*