# Insight Maker

[![Build Status](https://travis-ci.org/endiangroup/insightmaker.svg?branch=master)](https://travis-ci.org/endiangroup/insightmaker)

Open-source central command for InsightMaker.com: System Dynamics, Differential Equations, and Agent Based Modeling in the web browser.

## Running the native application

Download a binary from the [current release](https://github.com/endiangroup/insightmaker/releases/latest). The OS X and Windows applications are not currently signed, so you'll have to ignore warnings in order to install them

## Running the local version with Docker

If you want a web version, and for some reason don't wan to use [insightmaker.com](https://insightmaker.com), we provide a [docker image](https://hub.docker.com/r/endian/insightmaker). To use port `8080`:

```
docker run -p 8080:80 endian/insightmaker
```

Then access http://localhost:8080.
