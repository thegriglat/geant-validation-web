# check .env file in current directory
# bash docker_build.sh

FROM cern/cc7-base as plotter

RUN curl -q https://root.cern.ch/download/root_v6.10.08.Linux-centos7-x86_64-gcc4.8.tar.gz | tar --strip-components=1 -C /usr/local -xzf -

RUN yum install -y devtoolset-4-gcc-c++ cmake make libcurl-devel \
  # ROOT deps
  clang libpng libjpeg libSM libX11 libXext libXft libXpm
# end ROOT deps

COPY plotter-src /var/www/plotter-src/

RUN  source /opt/rh/devtoolset-4/enable \
  && cd /var/www/plotter-src \
  && mkdir build \
  && cd build \
  && cmake -DHOST="https://geant-val.cern.ch:8443" .. \
  && make -j `grep -c proc /proc/cpuinfo` plotter \
  && cp -v plotter /var/www/

FROM cern/cc7-base as angular7

RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - \
  && rpm -qa | grep epel | xargs rpm -e --nodeps \
  && rpm -i https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

RUN yum install -y nodejs make gcc-c++

RUN mkdir /var/www
COPY ./ /var/www
WORKDIR /var/www
RUN npm install
RUN npm run build
RUN npm run compile

FROM cern/cc7-base

RUN curl -q https://root.cern.ch/download/root_v6.10.08.Linux-centos7-x86_64-gcc4.8.tar.gz | tar --strip-components=1 -C /usr/local -xzf -

RUN curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - \
  && rpm -qa | grep epel | xargs rpm -e --nodeps \
  && rpm -i https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

RUN yum install -y nodejs make clang libpng libjpeg libSM libX11 libXext libXft libXpm ghostscript \
  ## pdf generation, temporary disabled
  # texlive sendmail \
  && yum clean all \
  && rm -rf /var/cache/yum

RUN groupadd -r gvalweb \
  && useradd --no-log-init -r -g gvalweb gvalweb \
  && mkdir -p /home/gvalweb /var/www/dist /var/www/src/app/classes \
  && chown -R gvalweb:gvalweb /home/gvalweb /var/www
USER gvalweb:gvalweb

WORKDIR "/var/www"

COPY --chown=gvalweb:gvalweb package.json package-lock.json /var/www/
RUN npm install --only=production

COPY --from=plotter --chown=gvalweb:gvalweb /var/www/plotter /var/www/
COPY --from=angular7 --chown=gvalweb:gvalweb /var/www/index.js /var/www/
COPY --chown=gvalweb:gvalweb src/app/classes/ /var/www/src/app/classes/
COPY --chown=gvalweb:gvalweb queries.json /var/www/queries.json
COPY --from=angular7 --chown=gvalweb:gvalweb /var/www/dist/ /var/www/dist/

RUN chown gvalweb.gvalweb -R /var/www

EXPOSE 8080:8080
EXPOSE 8443:8443

CMD ["/usr/bin/node", "/var/www/index.js"]