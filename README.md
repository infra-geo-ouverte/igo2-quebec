[![Angular Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide)
[![join chat https://gitter.im/igo2/Lobby](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/igo2/Lobby)
[![Known Vulnerabilities](https://snyk.io/test/github/infra-geo-ouverte/igo2/badge.svg)](https://snyk.io/test/github/infra-geo-ouverte/igo2)

# Infrastructure géomatique ouverte 2.0 (IGO2) / Open GIS Infrastructure 2.0

---

### Qu'est-ce qu'IGO?

IGO2 est une solution Web gratuite en géomatique basée sur [Angular - Material](https://github.com/angular/angular), [OpenLayers](https://github.com/openlayers/openlayers) et [IGO2lib](https://github.com/infra-geo-ouverte/igo2-lib).
IGO2 permet de tirer profit d’une multitude de données géographiques grâce à une interface cartographique accessible par un navigateur Web sur un poste de travail et par un appareil mobile.
IGO2 a été initié par l'administration publique du Québec (Canada) et issu d’un travail collaboratif basé sur la philosophie des logiciels libres et ouverts (« open source »). Les membres du public en géomatique et du Web qui soumettent des contributions conservent leurs droits d'auteur s'ils partagent leur code source selon la [LICENCE LiLiQ-R de type LGPL](LICENCE.txt).

---

### What is IGO?

IGO2 (for Open GIS Infrastructure - version 2.0) is a free open source Web Geospatial solution developed at first in Quebec, Canada based on [Angular - Material](https://github.com/angular/angular), [OpenLayers](https://github.com/openlayers/openlayers) and [IGO2lib](https://github.com/infra-geo-ouverte/igo2-lib).
IGO2 is having multiple features, such as Web GIS viewer adapted to Desktop and Mobile and many more available at [https://igo2.readthedocs.io/fr/latest/english.html](https://igo2.readthedocs.io/fr/latest/english.html). Since this project is open source, anyone can contribute as long as they share their work on the same open source [LICENCE LGPL-Style](LICENSE_ENGLISH.txt). All contributors in IGO keep their property rights.

---
### Qu'est-ce qu'IGO2-Québec?

IGO2-Québec est un assemblage basé sur IGO2 qui respecte le système de design du gouvernement du Québec (pour plus d'information, consulter le <a href="https://design.quebec.ca/apercu/systeme" target="_blank">Système de design</a>).
---
### What is IGO2-Québec?

IGO2-Québec is an assembly based on IGO2 which respects the design system of the Gouvernement du Québec (for more information, check the <a href="https://design.quebec.ca/apercu/systeme" target="_blank">Système de design</a>).

---

---

## Table des matières (Français)

- [Téléchargement](#téléchargement)
- [Installation pour déploiement serveur](#installation-pour-déploiement-serveur)
- [Installation pour développeurs](#installation-et-démarrage-pour-développeurs)
- [Intégration à un autre projet](#intégration-à-un-autre-projet)
- [Démo on GitHub](https://infra-geo-ouverte.github.io/igo2-quebec/)
- [Documentation](https://igo2.readthedocs.io/fr/latest/)
- [Tests](#tests)
- [Contribuer](#contribuer)

---

---

## Table of content (English)

- [Download](#download)
- [Installation (for server deployment)](#installation-for-server-deployment)
- [Installation for developpers](#installation-for-developpers)
- [Integration into another project](#integration-into-another-project)
- [Demo on GitHub](https://infra-geo-ouverte.github.io/igo2-quebec/)
- [Documentation (translation is not yet done)](https://igo2.readthedocs.io/fr/latest/)
- [Tests](#to-run-tests)
- [Contribute](#contribution)

---

## Téléchargement

- À venir...

## Installation (pour déploiement serveur)

- À venir...

## Installation et démarrage (pour développeurs)

Requis:

| IGO2 version | Node version |
| ------------ | ------------ |
| > 1.5.x      | >= 12, <= 14 |
| < 1.5.x      | >= 8, <= 11  |
| 0.x.x        | >= 6, <= 10  |

```bash
$ git clone --depth 1 https://github.com/infra-geo-ouverte/igo2.git
$ cd igo2

# Installer les dépendances
$ npm install

# Surveiller les fichiers et lancer une instance pour le développement
# Il est possible que vos changements de librairies ne soient pas appliqués.
# Webpack (suite au npm start) ne surveille plus les changement de node_modules. Il observe seulement la version des dépendances. De ce fait, les 
# changements de code ne sont pas recompilées.
# Pour corriger ceci, désactiver la cache avec la variable d'environnement NG_BUILD_CACHE = "false"
$ npm start
# Ouvrir un navigateur http://localhost:4202/

# Build prod
$ npm run build.prod
$ npm run serve.prod
# Ouvrir un navigateur http://localhost:4202/

# Générer l'api de documentation
$ npm run doc
# Ouvrir un navigateur http://localhost:4220/
```

## Tests

```bash
$ npm test

# Tests après chaque changement
$ npm run test.watch

# code coverage (istanbul)
$ npm run coverage

# e2e (end-to-end intégration)
$ npm start
$ npm run e2e
```
## Intégration à un autre projet

Il facile possible d'importer ce projet dans un autre projet hébergé sur une plateforme supportant Git. Voici la procédure :
```
git remote add igo2qc https://github.com/infra-geo-ouverte/igo2-quebec.git
```
Ensuite, pour importer le code, faire un pull depuis cette origine additionnelle, en spécifiant la branche :
```
git pull igo2qc master
```
Pour plus de détails sur la procédure, consultez <a href="https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories" target="_blank">Managing remote repositories</a>.

---

## Contribuer

Nous sommes bien heureux que vous pensiez contribuer à IGO! Avant de le faire, nous vous encourageons à lire le guide de [contribution](.github/CONTRIBUTING.md), la [LICENCE](LICENCE.txt) et le [WIKI](https://github.com/infra-geo-ouverte/igo2/wiki/IGO2-:-Auto-formation-pour-d%C3%A9veloppeurs). Si vous avez d'autres questions, n'hésitez pas à communiquer avec nous à l'adresse suivante info(a)igouverte.org ou par [Gitter](https://gitter.im/igo2/).

---

---

## Download

- Will come shortly


## Installation (for server deployment)

- Will come shortly
## Installation (for developpers)

Require:

| IGO2 version | Node version |
| ------------ | ------------ |
| > 1.5.x      | >= 12, <= 14 |
| < 1.5.x      | >= 8, <= 11  |
| 0.x.x        | >= 6, <= 10  |

```bash
$ git clone https://github.com/infra-geo-ouverte/igo2.git
$ cd igo2

# Install dépendencies
$ npm install

# Check files and launch dev instance
# Your library changes may not be applied.
# Webpack (following npm start) no longer monitors node_modules changes. It only observes the version of the dependencies. Therefore, the
# code changes are not recompiled.
# To fix this, disable the cache with the environment variable NG_BUILD_CACHE = "false"
$ npm start
# Open your browser at http://localhost:4202/

# Build prod
$ npm run build.prod
$ npm run serve.prod
# Open your browser at http://localhost:4202/

# Doc API generation
$ npm run doc
# Open your browser at http://localhost:4220/

```

## To run tests

```bash
$ npm test

# Check by karma
# Tests after each change
$ npm run test.watch

# code coverage (istanbul)
$ npm run coverage

# e2e (end-to-end intégration)
$ npm start
$ npm run e2e
```
## Integration into another project

It is easy to import this project into another one hosted in any platform supporting Git. Here is the procedure:
```
git remote add igo2qc https://github.com/infra-geo-ouverte/igo2-quebec.git
```
Then, to import the code, pull from that additionnal origin and specify the branch:
```
git pull igo2qc master
```
For more details on this procedure, check <a href="https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories" target="_blank">Managing remote repositories</a>.

---
## Contribution

Before contributing, please read the [guidelines](.github/CONTRIBUTING.md), the [LICENCE](LICENSE_ENGLISH.txt) and the [WIKI](https://github.com/infra-geo-ouverte/igo2/wiki). If you have any question and want to contribute, contact the main email of IGO info(a)igouverte.org or on [Gitter](https://gitter.im/igo2/)
