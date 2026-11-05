# Third-party software

Application tracker bundles Node.js (MIT license and third-party notices in each runtime's LICENSE), ExcelJS 4.4.0 (MIT), JSZip 3.10.1 (MIT/GPLv3 dual license, used under MIT), and flag-icons 7.5.0 (MIT). Their dependency licenses and notices are retained in node_modules; pinned versions are recorded in package-lock.json. Node archives and official SHA-256 checksums are pinned in scripts/runtime-manifest.json in the source repository and RUNTIME_CHECKSUMS.json in the release.

The source package overrides ExcelJS's transitive uuid dependency to 11.1.1 to address GHSA-w5hq-g745-h8pq; spreadsheet read/write tests cover the resulting dependency tree. No runtime package installation or private Codex/Claude cache is used by the release.
