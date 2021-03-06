import { GvpTest, GvpJSON, GvpParameter, GvpHistogram, GvpChart, GvpMctoolNameVersion, GvpMctoolName, EXPERIMENT_TEST_ID, GvpInspire, GvpPngRequest, GvpPngResponse, GvpPlotIdRequest, GvpPermalinkRequest, Nullable } from "./src/app/classes/gvp-plot";
import * as api from './src/app/classes/api_interfaces';

/* globals require, process */
import * as express from 'express';
const helmet = require('helmet');
const forceSSL = require('express-force-ssl');
const session = require('express-session');
const fs = require('fs');
import * as http from 'http';
import { isString, isUndefined, isNull } from 'util';
const https = require('https');
const bodyParser = require('body-parser');
const pg = require('pg');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const columnify = require('columnify');
const md5 = require('md5');
const compression = require('compression');
const logger = require('intel');
const path = require('path');
const mktemp = require('mktemp');

const MAX_REQUESTS: number = require('os').cpus().length;
let N_REQUESTS = 0;

console.log(`Found ${MAX_REQUESTS} cores.`);

logger.basicConfig({
  format: '[%(date)s] %(levelname)s: %(message)s',
  level: logger.INFO
});

const exec = require('child_process').exec;

require('dotenv').config();
require('array-find');

//QUERIES FILE
const queries: { [key: string]: string } = require('./queries.json');

//GLOBALS
const PLOTTERPATH = process.cwd();
const PORTNODE = process.env.PORTNODE || "80";
const PORTNODESSL = process.env.PORTNODESSL || "443";
const USERNAMEDB = process.env.USERNAMEDB;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;
const PORTDB = process.env.PORTDB;
const HOSTDB = process.env.HOSTDB;
const OAUTHID = process.env.OAUTHID;
const OAUTHCS = process.env.OAUTHCS;
const OAUTHCB = process.env.OAUTHCB;
const USESSL = Boolean(process.env.USESSL) || false;
const KEYFILE = 'SSL/geant-val.cern.ch.key';
const PEMFILE = 'SSL/fullchain.cer';

let keyData, pemData;

if (USESSL) {
  try {
    keyData = fs.readFileSync(KEYFILE, 'ascii');
    pemData = fs.readFileSync(PEMFILE, 'ascii');
  } catch (e) {
    logger.error('Unable to setup SSL: unable to read either of key or certificate files!');
    throw new Error(e);
  }
}

//Config to be used to connect to PostgreSQL.
const config = {
  user: USERNAMEDB, //env var: PGUSER
  database: DATABASE, //env var: PGDATABASE
  password: PASSWORD, //env var: PGPASSWORD
  port: PORTDB, //env var: PGPORT
  host: HOSTDB,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
};

if (USESSL) {
  passport.use(
    new OAuth2Strategy(
      {
        authorizationURL: 'https://oauth.web.cern.ch/OAuth/Authorize',
        tokenURL: 'https://oauth.web.cern.ch/OAuth/Token',
        clientID: OAUTHID,
        clientSecret: OAUTHCS,
        callbackURL: OAUTHCB
      },
      (accessToken, refreshToken, profile, cb) => {
        //    logger.info("token: %s", accessToken);
        //    logger.info("profile: %j", profile);
        //      logger.info("Logged in as : %s", profile.displayName);
        if (
          profile.groups.some(
            element =>
              element === 'genser-private' ||
              element === 'geant-val' ||
              element === 'ep-dep-sft' ||
              element === 'geant4'
          )
        ) {
          return cb(null, profile);
        } else {
          return cb(null, false);
        }
      }
    )
  );
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (!process.env.TOKENS) return res.status(401).send('Not authorized');
  const allowed_tokens = process.env.TOKENS.split(/s/).filter(e => e.length !== 0);
  if (!req.header('token')) return res.status(401).send('Not authorized');
  if (!allowed_tokens.includes(req.header('token'))) return res.status(401).send('Not authorized');
  return next();
}

passport.serializeUser((user, cb) => {
  //  logger.info("serialize user %s (%s)", user.name, user.displayName);
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  //  logger.info("deserialize user %s (%s)", obj.name, obj.displayName);
  cb(null, obj);
});

//Open a pool connection based on the above config
const pool = new pg.Pool(config);

//Server - UI
const app = express();
//Using Helmet for securing HTTP requests

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'", "*", "data:", "'unsafe-inline'"],
      "script-src": ["'self'", "'unsafe-eval'", "root.cern", "cdn.mathjax.org"]
    }
  }
}));

// Using compression for HTTP requests
app.use(compression());

app.use(bodyParser.json({ limit: '50mb' }));

if (USESSL) {
  app.set('forceSSLOptions', {
    httpsPort: 443
  });

  app.use(forceSSL);
}

app.use(
  express.static(`${PLOTTERPATH}/dist/gvp-template`, {
    index: 'index.html'
  })
);

const server = http.createServer(app);

let secureServer;
if (USESSL) {
  secureServer = https.createServer(
    {
      key: keyData,
      cert: pemData,
      ca: [fs.readFileSync('SSL/ca.cer', 'ascii')]
    },
    app
  );
}

// configure app to use bodyParser()
// this will let us get the data in a JSON format through HTTP Requests
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

//HTTP Requests
app.use(bodyParser.json());

//Authorization
app.use(
  session({
    secret: 'geant g4val',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: USESSL,
      maxAge: 86400000
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

server.listen(PORTNODE);
logger.info(`Server running on http://localhost:${PORTNODE}/`);

if (USESSL) {
  secureServer.listen(PORTNODESSL);
  logger.info(`Secure server running on https://localhost:${PORTNODESSL}/`);
}

// get an instance of the express Router
const router = express.Router();

app.get('/do_login', passport.authenticate('oauth2'));

if (USESSL) {
  app.get(
    '/login',
    passport.authenticate('oauth2', {
      failureRedirect: '/',
      flashError: true
    }),
    (req, res) => {
      res.redirect('/');
    }
  );
}

/*
app.get('/loggedin', (req, res) => {
  res.send(req.isAuthenticated() ? JSON.stringify(req.user) : '0');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
*/
/**
 * Pass web page content to callback function
 * Needed for Inspire metadata parsing
 */
function getPageContents(callback: { (str: string): void }, host: string, url: string): void {
  const hostport = host.split(':');
  const options = {
    host: hostport[0],
    path: url,
    port: hostport.length === 1 ? 80 : parseInt(hostport[1])
  };

  const call = response => {
    let str = '';
    // another chunk of data has been recieved, so append it to `str`
    response.on('data', (chunk: string) => {
      str += chunk;
    });
    // the whole response has been recieved, so we just print it out here
    response.on('end', () => {
      callback(str);
    });
  };
  http.request(options, call).end();
}

/** Return array filled with 'value' with length 'len' */
function getFilledArray(len: number, value: any) {
  return new Array(len).fill(value);
}

interface SQLRow {
  [key: string]: any;
}

/**
 * Main function for quering database
 * @param {list} params list of param values
 * @param {string} sql SQL with parameter substitution
 * @returns Promise
 */
function execSQL(params: any[], sql: string): Promise<SQLRow[]> {
  //let response = {};
  //Start connection
  return new Promise((resolve, reject) => {
    pool.connect((err, client, done) => {
      if (err) {
        console.error('error fetching client from pool', err);
        reject(Error('error fetching client from poo'));
      }
      return client.query(sql, params, (err, result): void => {
        logger.debug(`SQL: ${sql}\nPARAMS: ${params}`);
        done();
        if (err) {
          console.error('error running query', err);
          reject(Error('error running query'));
        }
        if (!isUndefined(result))
          resolve(result.rows);
        else
          reject(Error('error running query'));
      });
    });
  });
}

/**
 * Transform JS list to string representing PostgreSQL array
 * @param {list} arr array of items (string || number)
 * @returns string
 */

function PGJoin(arr: any[]): string {
  let s = '{';
  for (let i = 0; i < arr.length; i++) {
    if (isString(arr[i])) {
      s += `"${arr[i]}",`;
    } else {
      s += `${arr[i]},`;
    }
  }
  s += '}';
  s = s.replace(',}', '}');
  return s;
}

/**
 * Get JSON of record with given id. Private function.
 * @param {number} id record id
 * @returns JSON
 */
function apigetJSON(id: number): Promise<Nullable<GvpJSON>> {
  const sqlPrint =
    'SELECT inspire.*, target.*, mctool_model.*, mctool_name.*, mctool_name_version.*, observable.*, ' +
    'particle_beam.particle_name as particle_beam, particle_sec.particle_name as particle_sec, plot.*, plot_type.*, reaction.*, test.* ' +
    'FROM plot INNER JOIN inspire ON plot.inspire_id=inspire.inspire_id ' +
    'INNER JOIN target ON plot.target=target.target_id ' +
    'INNER JOIN mctool_model ON plot.mctool_model_id=mctool_model.mctool_model_id ' +
    'INNER JOIN mctool_name_version ON plot.mctool_name_version_id=mctool_name_version.mctool_name_version_id ' +
    'INNER JOIN mctool_name ON mctool_name_version.mctool_name_id=mctool_name.mctool_name_id ' +
    'INNER JOIN observable ON plot.observable_id=observable.observable_id ' +
    'INNER JOIN particle as particle_beam ON particle_beam.pdgid=plot.beam_particle_pdgid ' +
    'INNER JOIN particle as particle_sec ON particle_sec.pdgid=plot.secondary_pdgid ' +
    'INNER JOIN test ON plot.test_id=test.test_id ' +
    'INNER JOIN plot_type ON plot.plot_type_id=plot_type.plot_type_id ' +
    'INNER JOIN reaction ON plot.reaction_id=reaction.reaction_id ' +
    'WHERE plot.plot_id=$1';
  return execSQL([id], sqlPrint).then((resultlist) => {
    if (resultlist.length === 0) {
      logger.warn(`No data for id ${id} found`);
      return null;
    }
    let result: any = resultlist[0];
    let params: GvpParameter[] = [];
    for (let i = 0; i < result.parnames.length; i++) {
      params.push({ names: result.parnames[i], values: result.parvalues[i] });
    };
    let r: GvpJSON;
    r = {
      id: result.plot_id,
      article: {
        inspireId: result.inspire_id
      },
      mctool: {
        name: result.mctool_name_name,
        version: result.version,
        model: result.mctool_model_name
      },
      testName: result.test_name,
      metadata: {
        observableName: result.observable_name,
        reaction: result.reaction_name,
        targetName: result.target_name,
        beamParticle: result.particle_beam,
        beamEnergies: result.beam_energy,
        beam_energy_str: result.beam_energy_str,
        secondaryParticle: result.particle_sec,
        // fill parameters
        parameters: params
      },
      plotType: result.plot_type_name,

    };
    if (isNull(result.plot_npoints)) {
      // histogram
      r.chart = undefined;
      let h: GvpHistogram = new GvpHistogram();
      h.nBins = result.plot_nbins.length !== 0 ? result.plot_nbins : [result.plot_val.length];
      h.binEdgeLow = result.plot_bin_min || [];
      h.binEdgeHigh = result.plot_bin_max || [];
      h.binContent = result.plot_val || [];
      h.yStatErrorsPlus =
        result.plot_err_stat_plus.length === 0
          ? getFilledArray(result.plot_val.length, 0)
          : result.plot_err_stat_plus;
      h.yStatErrorsMinus =
        result.plot_err_stat_minus.length === 0
          ? getFilledArray(result.plot_val.length, 0)
          : result.plot_err_stat_minus;
      h.ySysErrorsPlus =
        result.plot_err_sys_plus.length === 0
          ? getFilledArray(result.plot_val.length, 0)
          : result.plot_err_sys_plus;
      h.ySysErrorsMinus =
        result.plot_err_sys_minus.length === 0
          ? getFilledArray(result.plot_val.length, 0)
          : result.plot_err_sys_minus;
      h.binLabel = result.plot_bin_label || [];
      r.histogram = h;
    } else {
      // chart
      r.histogram = undefined;
      let h: GvpChart = new GvpChart();
      h.nPoints = result.plot_npoints;
      h.xValues = result.plot_val.slice(0, result.plot_val.length / 2);
      h.yValues = result.plot_val.slice(result.plot_val.length / 2, result.plot_val.length);

      h.xStatErrorsPlus = result.plot_err_stat_plus.slice(
        0,
        result.plot_err_stat_plus.length / 2
      );
      h.yStatErrorsPlus = result.plot_err_stat_plus.slice(
        result.plot_err_stat_plus.length / 2,
        result.plot_err_stat_plus.length
      );

      h.xStatErrorsMinus = result.plot_err_stat_minus.slice(
        0,
        result.plot_err_stat_minus.length / 2
      );
      h.yStatErrorsMinus = result.plot_err_stat_minus.slice(
        result.plot_err_stat_minus.length / 2,
        result.plot_err_stat_minus.length
      );

      h.xSysErrorsPlus = result.plot_err_sys_plus.slice(0, result.plot_err_sys_plus.length / 2);
      h.ySysErrorsPlus = result.plot_err_sys_plus.slice(
        result.plot_err_sys_plus.length / 2,
        result.plot_err_sys_plus.length
      );

      h.xSysErrorsMinus = result.plot_err_sys_minus.slice(
        0,
        result.plot_err_sys_minus.length / 2
      );
      h.ySysErrorsMinus = result.plot_err_sys_minus.slice(
        result.plot_err_sys_minus.length / 2,
        result.plot_err_sys_minus.length
      );
      r.chart = h;
    }
    let h = (r.chart) ? r.chart : r.histogram;
    if (h) {
      h.title = result.plot_title;
      h.xAxisName = result.plot_axis_title[0];
      h.yAxisName = result.plot_axis_title[1];
    }
    return r;
  });
}

/**
 * Return multiple JSONs at one time.
 * Warning: if some ids are invalid the result is undefined.
 * @params {list} ids list of record ids.
 * @returns Promise
 */
function apimultiget(ids: number[]): Promise<GvpJSON[]> {
  const promises = ids.map(e => apigetJSON(e));
  return Promise.all(promises).then(list => {
    return list.filter(e => !isNull(e)) as GvpJSON[];
  });
}

// isLoggedIn is "function" like pipe which controls is user authenticated or not
/*
app.post('/uploadException', isLoggedIn, (req, res) => {
  const json = req.body;
  const errtypes = json.types;
  const typekeys = Object.keys(errtypes);
  if (typekeys.length === 0) {
    logger.info('No errors found in JSON (types is empty), skip upload');
    res.status(200).json({ status: 'OK', description: 'No errors found in JSON' });
    return;
  }
  const beamenergy = json.beamenergy;
  const target = json.target;
  const beamparticle = json.beamparticle;
  const mctool_model = json.mctool_model;
  const mctool_name = json.mctool_name;
  const mctool_version = json.mctool_version;
  const testName = json.testName;
  const typenames: string[] = [];
  const typevalues = [];
  const typeerrors = [];
  for (let i = 0; i < typekeys.length; i++) {
    const err = errtypes[typekeys[i]];
    for (let j = 0; j < err.length; j++) {
      if (err[j].message.trim() !== '') typenames.push(`${typekeys[i]}:${err[j].message}`);
      else typenames.push(typekeys[i]);
      typevalues.push(err[j].count);
      typeerrors.push(err[j].text);
    }
  }
  let mctool_name_version_id = -1;
  let mctool_model_id = -1;
  let beam_particle_pdgid = -1;
  let target_id = -1;
  let test_id = -1;
  new Promise((resolve, reject) => {
    // get list of plot_id
    const sql =
      'select mctool_name_version_id from mctool_name_version ' +
      'inner join mctool_name on mctool_name.mctool_name_id = mctool_name_version.mctool_name_id ' +
      'where lower(mctool_name.mctool_name_name) = lower($1) and lower(mctool_name_version.version) = lower($2)';
    execSQL([mctool_name, mctool_version], sql).then((result) => {
      // return minimum values of plot_id
      if (result.length === 0) {
        res.status(400).json({ status: 'Error', description: 'No such name/version found' });
        reject();
        return;
      }
      mctool_name_version_id = Number(result[0].mctool_name_version_id);
      resolve();
    });
  })
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL([testName], 'select test_id from test where lower(test_name) = lower($1)').then(
            (result) => {
              if (result.length === 0) {
                res.status(400).json({ status: 'Error', description: 'No valid test found' });
                reject();
                return;
              }
              test_id = Number(result[0].test_id);
              resolve();
            }
          );
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL(
            [mctool_model],
            'select mctool_model_id from mctool_model where lower(mctool_model_name) = lower($1)'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({ status: 'Error', description: 'No valid MCTool name found' });
              reject();
              return;
            }
            mctool_model_id = Number(result[0].mctool_model_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL(
            [beamparticle],
            'select pdgid from particle where lower(particle_name) = lower($1) or lower($1) in (SELECT lower(x) FROM unnest(synonyms::text[]) x);'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({ status: 'Error', description: 'No valid particle found' });
              reject();
              return;
            }
            beam_particle_pdgid = Number(result[0].pdgid);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL(
            [target],
            'select target_id from target where lower(target_name) = lower($1)'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({ status: 'Error', description: 'No valid target found' });
              reject();
              return;
            }
            target_id = Number(result[0].target_id);
            resolve();
          });
        })
    )
    .then(() => {
      const sql =
        'insert into exception (test_id, mctool_name_version_id, target_id, mctool_model_id, ' +
        'beam_particle_pdgid, beam_energy, exception_groups, exception_counts, exception_text) ' +
        'values ($1, $2, $3, $4, $5, $6, $7, $8, $9);';
      execSQL(
        [
          test_id,
          mctool_name_version_id,
          target_id,
          mctool_model_id,
          beam_particle_pdgid,
          beamenergy,
          typenames,
          typevalues,
          typeerrors
        ],
        sql
      )
        .then(() => {
          res.status(200).json({ status: 'OK', description: 'Data has been uploaded' });
        })
        .catch(() => {
          res.status(400).json({ status: 'FAIL', description: 'Database error' });
        });
    });
});
*/
// Function to receive file content in the request body
app.post('/upload', isLoggedIn, (req, res) => {
  logger.info('upload requested');
  const json = req.body;
  // get inspire info
  // https://inspirehep.net/info/hep/api?ln=ru
  //
  const inspireparams = '?of=recjson&ot=recid,title,publication_info,abstract';
  const inspireid: number = Number(json.article.inspireId) || -1;
  let inspireinfo: any;
  const mctool = json.mctool;
  let mctool_name_version_id = -1;
  // let mctool_name_id = -1;
  let mctool_model_id = -1;
  const beamParticleName: string = json.metadata.beamParticle;
  let beamParticle_pdgid = -1;
  const parnames: string[] = [];
  const parvalues: string[] = [];

  let plot_type_id = -1;
  let plot_id = -1;
  let reaction_id = 9; // particle production
  let secondary_pdgid = 123456789; // predefined None value
  let observable_id = -1;
  let target_id = -1;
  let test_id = -1;
  // then().then()... can be simplified
  new Promise((resolve, reject) => {
    execSQL([inspireid], 'select inspire_id from inspire where inspire_id = $1;').then((result) => {
      if (result.length === 0) {
        getPageContents(
          r1 => {
            inspireinfo = JSON.parse(r1);
            inspireinfo = inspireinfo[0];
            if (inspireinfo) {
              const insertsql =
                'insert into inspire (inspire_id, title, journal, ern, pages, volume, year, abstract, keywords, linkurl) values ' +
                '($1, $2, $3, $4, $5, $6, $7, $8, $9, $10); ';
              execSQL(
                [
                  inspireinfo.recid,
                  inspireinfo.title.title,
                  inspireinfo.publication_info.title,
                  // ern, delete next line
                  '',
                  inspireinfo.publication_info.pagination,
                  inspireinfo.publication_info.volume,
                  inspireinfo.publication_info.year,
                  inspireinfo.abstract ? inspireinfo.abstract.summary : '',
                  // keywords, delete next line
                  [],
                  `http://inspirehep.net/record/${inspireid}`
                ],
                insertsql
              )
                .then(() => resolve())
                .catch(() => {
                  res.status(200).json({
                    status: 'Error',
                    description: 'Cannot insert into inspire'
                  });
                  reject();
                });
            } else {
              res.status(200).json({
                status: 'Error',
                description: 'Cannot fetch data from Inspire web page'
              });
              reject();
            }
          },
          'inspirehep.net',
          `/record/${inspireid}${inspireparams}`
        );
      } else resolve();
    });
  })
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL(
            [mctool.name, mctool.model],
            'select t1.mctool_model_id, t2.mctool_name_id from mctool_model as t1 inner join mctool_name as t2 on t1.mctool_name_id = t2.mctool_name_id where lower(t2.mctool_name_name) = lower($1) and lower(t1.mctool_model_name) = lower($2);'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({
                status: 'Error',
                description: 'No valid mctool_model_id and mctool_name_id found'
              });
              reject();
              return;
            }
            // mctool_name_id = result[0].mctool_name_id;
            mctool_model_id = Number(result[0].mctool_model_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          execSQL(
            [mctool.name, mctool.version],
            'select t1.mctool_name_version_id from mctool_name_version as t1 inner join mctool_name as t2 on t1.mctool_name_id = t2.mctool_name_id where lower(t2.mctool_name_name) = lower($1) and t1.version = $2;'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({
                status: 'Error',
                description: 'No valid mctool_name_version_id found.'
              });
              reject();
              return;
            }
            mctool_name_version_id = Number(result[0].mctool_name_version_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // test_id
          execSQL(
            [json.testName],
            'select test_id from test where lower(test_name) = lower($1);'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({ status: 'Error', description: 'No valid test_id found.' });
              reject();
              return;
            }
            test_id = Number(result[0].test_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // beam particle
          execSQL(
            [beamParticleName],
            'select pdgid from particle where lower(particle_name) = lower($1) or lower($1) in (SELECT lower(x) FROM unnest(synonyms::text[]) x);'
          ).then((result) => {
            if (result.length === 0) {
              res
                .status(400)
                .json({ status: 'Error', description: 'No valid pdgid found (beam).' });
              reject();
              return;
            }
            beamParticle_pdgid = Number(result[0].pdgid);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // target
          execSQL(
            [json.metadata.targetName],
            'select target_id from target where lower(target_name) = lower($1);'
          ).then((result) => {
            if (result.length === 0) {
              res.status(400).json({ status: 'Error', description: 'No valid target_id found.' });
              reject();
              return;
            }
            target_id = Number(result[0].target_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // observable_id
          execSQL(
            [json.metadata.observableName],
            'select observable_id from observable where lower(observable_name) = lower($1);'
          ).then((result) => {
            if (result.length === 0) {
              res
                .status(400)
                .json({ status: 'Error', description: 'No valid observable_id found.' });
              reject();
              return;
            }
            observable_id = Number(result[0].observable_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          if (json.metadata.hasOwnProperty('secondaryParticle')) {
            execSQL(
              [json.metadata.secondaryParticle],
              'select pdgid from particle where lower(particle_name) = lower($1) or lower($1) in (SELECT lower(x) FROM unnest(synonyms::text[]) x);'
            ).then((result) => {
              if (result.length === 0) {
                res.status(400).json({
                  status: 'Error',
                  description: 'No valid pdgid found (secondary).'
                });
                reject();
                return;
              }
              secondary_pdgid = Number(result[0].pdgid);
              resolve();
            });
          } else resolve();
        })
    )
    .then(
      () =>
        new Promise(resolve => {
          execSQL(
            [json.metadata.reaction],
            'select reaction_id from reaction where lower(reaction_name) = lower($1);'
          ).then((result) => {
            if (result.length !== 0) {
              reaction_id = Number(result[0].reaction_id);
            }
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise(resolve => {
          if (json.metadata.hasOwnProperty('parameters')) {
            for (let i = 0; i < json.metadata.parameters.length; i++) {
              parnames.push(json.metadata.parameters[i].names);
              parvalues.push(json.metadata.parameters[i].values);
            }
            resolve();
          } else resolve();
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // plot type
          execSQL(
            [json.plotType],
            'select plot_type_id from plot_type where lower(plot_type_name) = lower($1);'
          ).then((result) => {
            if (result.length === 0) {
              res
                .status(400)
                .json({ status: 'Error', description: 'No valid plot_type_id found.' });
              reject();
              return;
            }
            plot_type_id = Number(result[0].plot_type_id);
            resolve();
          });
        })
    )
    .then(
      () =>
        new Promise((resolve, reject) => {
          // main insert
          // default: timestamp
          if (json.hasOwnProperty('chart') && json.plotType === 'SCATTER2D') {
            const plot_val = json.chart.xValues.concat(json.chart.yValues);
            const keys = [
              'yStatErrorsPlus',
              'yStatErrorsMinus',
              'ySysErrorsPlus',
              'ySysErrorsMinus',
              'xStatErrorsPlus',
              'xStatErrorsMinus',
              'xSysErrorsPlus',
              'xSysErrorsMinus'
            ];
            for (let i = 0; i < keys.length; i++) {
              if (!isUndefined(json.chart[keys[i]]) && json.chart[keys[i]].length === 0) {
                json.chart[keys[i]] = null;
              }
            }
            const plot_err_stat_plus = (
              json.chart.xStatErrorsPlus || getFilledArray(json.chart.xValues.length, 0)
            ).concat(json.chart.yStatErrorsPlus || getFilledArray(json.chart.yValues.length, 0));
            const plot_err_stat_minus = (
              json.chart.xStatErrorsMinus || getFilledArray(json.chart.xValues.length, 0)
            ).concat(json.chart.yStatErrorsMinus || getFilledArray(json.chart.yValues.length, 0));
            const plot_err_sys_plus = (
              json.chart.xSysErrorsPlus || getFilledArray(json.chart.xValues.length, 0)
            ).concat(json.chart.ySysErrorsPlus || getFilledArray(json.chart.yValues.length, 0));
            const plot_err_sys_minus = (
              json.chart.xSysErrorsMinus || getFilledArray(json.chart.xValues.length, 0)
            ).concat(json.chart.ySysErrorsMinus || getFilledArray(json.chart.yValues.length, 0));
            execSQL(
              [
                test_id,
                inspireid,
                mctool_name_version_id,
                mctool_model_id,
                beamParticle_pdgid,
                PGJoin(json.metadata.beamEnergies),
                target_id,
                observable_id,
                secondary_pdgid,
                reaction_id,
                false, // isPublic
                PGJoin(parnames),
                PGJoin(parvalues),
                plot_type_id,
                json.chart.title,
                json.chart.nPoints,
                PGJoin([json.chart.xAxisName, json.chart.yAxisName]),
                PGJoin(plot_val),
                PGJoin(plot_err_stat_plus),
                PGJoin(plot_err_stat_minus),
                PGJoin(plot_err_sys_plus),
                PGJoin(plot_err_sys_minus)
              ],
              'insert into plot (test_id,inspire_id,mctool_name_version_id,mctool_model_id,' +
              'beam_particle_pdgid,beam_energy,target,observable_id,secondary_pdgid,reaction_id,' +
              'isPublic,parnames,parvalues,plot_type_id,plot_title,plot_npoints,' +
              'plot_axis_title,plot_val,plot_err_stat_plus,plot_err_stat_minus,' +
              'plot_err_sys_plus,plot_err_sys_minus) values ' +
              '($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22);'
            )
              .then(() => {
                execSQL([], 'select plot_id from plot order by plot_id desc limit 1;').then(r1 => {
                  plot_id = Number(r1[0].plot_id);
                  res.status(200).send(`plot_id = ${JSON.stringify(plot_id)}`);
                  resolve();
                });
              })
              .catch(() => {
                res.status(200).send('Database error. Maybe record already exists.');
                resolve();
              });
          } else if (json.hasOwnProperty('histogram') && json.plotType.indexOf('TH') !== -1) {
            json.histogram.ySysErrorsMinus = json.histogram.ySysErrorsMinus
              ? json.histogram.ySysErrorsMinus
              : [];
            json.histogram.ySysErrorsPlus = json.histogram.ySysErrorsPlus
              ? json.histogram.ySysErrorsPlus
              : [];
            json.histogram.yStatErrorsMinus = json.histogram.yStatErrorsMinus
              ? json.histogram.yStatErrorsMinus
              : [];
            json.histogram.yStatErrorsPlus = json.histogram.yStatErrorsPlus
              ? json.histogram.yStatErrorsPlus
              : [];
            const bin_labels = json.histogram.hasOwnProperty('binLabel')
              ? json.histogram.binLabel
              : [];
            execSQL(
              [
                test_id,
                inspireid,
                mctool_name_version_id,
                mctool_model_id,
                beamParticle_pdgid,
                PGJoin(json.metadata.beamEnergies),
                target_id,
                observable_id,
                secondary_pdgid,
                reaction_id,
                false, // isPublic
                PGJoin(parnames),
                PGJoin(parvalues),
                plot_type_id,
                json.histogram.title,
                PGJoin(json.histogram.nBins),
                PGJoin(json.histogram.binEdgeLow),
                PGJoin(json.histogram.binEdgeHigh),
                PGJoin([json.histogram.xAxisName, json.histogram.yAxisName]),
                PGJoin(json.histogram.binContent),
                PGJoin(json.histogram.yStatErrorsPlus),
                PGJoin(json.histogram.yStatErrorsMinus),
                PGJoin(json.histogram.ySysErrorsPlus),
                PGJoin(json.histogram.ySysErrorsMinus),
                PGJoin(bin_labels)
              ],
              'insert into plot (test_id,inspire_id,mctool_name_version_id,mctool_model_id,' +
              'beam_particle_pdgid,beam_energy,target,observable_id,secondary_pdgid,reaction_id,' +
              'isPublic,parnames,parvalues,plot_type_id,plot_title,plot_nbins,plot_bin_min,plot_bin_max,' +
              'plot_axis_title,plot_val,plot_err_stat_plus,plot_err_stat_minus,' +
              'plot_err_sys_plus,plot_err_sys_minus,plot_bin_label) values ' +
              '($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25);'
            )
              .then(() => {
                execSQL([], 'select plot_id from plot order by plot_id desc limit 1;').then(r1 => {
                  plot_id = Number(r1[0].plot_id);
                  res.status(200).send(`plot_id = ${JSON.stringify(plot_id)}`);
                  resolve();
                });
              })
              .catch(() => {
                res.status(200).send('Database error. Maybe record already exists.');
                resolve();
              });
          } else {
            logger.error('Plot type does not match with JSON data.');
            res.status(200).send('JSON error: plot type does not match with JSON data.');
            reject();
          }
        })
    );
});

// Route to retrieve data via command-line
router.route('/get/:id').get((req, res) => {
  const id = Number(req.params.id);
  apimultiget([id]).then(
    result => {
      res.status(200).json(result[0]);
    },
    () => {
      res.status(400);
    }
  );
});

router.route('/permalink/:hash').get((req, res) => {
  const hash = req.params.hash;
  const j = (new Buffer(hash, 'base64')).toString('ascii');
  const data: GvpPermalinkRequest = JSON.parse(j);
  apimultiget(data.ids).then(jsons => {
    let pr: any = data;
    pr.data = jsons;
    delete pr.ids;
    let pngrequest: GvpPngRequest = pr;
    getPNG(pngrequest).then(pres => {
      const data = fs.readFileSync("dist/gvp-template/" + pres.filename);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': data.length
      });
      res.status(200).end(data);
    })
  })
});

// Route for gnuplot text data
router.route('/getRaw/:id').get((req, res) => {
  const id = Number(req.params.id);
  apigetJSON(id).then(
    (result) => {
      if (!result) {
        res.status(200).send();
        return;
      }
      let parameters = '';

      for (const p of result.metadata.parameters) {
        parameters += `${p.names} ${p.values}`;
        if (result.metadata.parameters.indexOf(p) !== result.metadata.parameters.length - 1) {
          parameters += ', ';
        }
      }

      const metadata = [
        {
          type: '#! /usr/bin/gnuplot -persist'
        },
        {
          type: '# ID:',
          value: result.id
        },
        {
          type: '# Test:',
          value: result.testName
        },
        {
          type: '# Tool:',
          value: `${result.mctool.name} ${result.mctool.version}`
        },
        {
          type: '# Beam:',
          value: result.metadata.beamParticle
        },
        {
          type: '# Beam Energy:',
          value:
            result.metadata.beamEnergies.length !== 1 ? 'Multiple' : result.metadata.beamEnergies[0]
        },
        {
          type: '# Observable:',
          value: result.metadata.observableName
        },
        {
          type: '# Secondary:',
          value: result.metadata.secondaryParticle
        },
        {
          type: '# Target:',
          value: result.metadata.targetName
        },
        {
          type: '# Parameters:',
          value: parameters
        },
        {
          type: 'set term png size 1280,1024'
        },
        {
          type: 'set output',
          value: `"${result.id}.png"`
        }
      ];
      let gPlot = `set title "Beam: ${result.metadata.beamParticle},Energy: ${result.metadata.beamEnergies.length !== 1 ? 'Multiple' : result.metadata.beamEnergies[0]
        },Target: ${result.metadata.targetName}"\n`;

      const metadataFormatted = columnify(metadata, { showHeaders: false });
      let table = '';
      let rows;
      if (!isUndefined(result.chart)) {
        rows = [];

        for (let i = 0; i < result.chart.nPoints; i++) {
          // transform all undefined fields to 0
          const row = {
            xValue: result.chart.xValues[i],
            yValue: result.chart.yValues[i],
            xStatErrorMinus:
              isUndefined(result.chart.xStatErrorsMinus[i]) ? 0 : result.chart.xStatErrorsMinus[i],
            xStatErrorPlus:
              isUndefined(result.chart.xStatErrorsPlus[i]) ? 0 : result.chart.xStatErrorsPlus[i],
            yStatErrorMinus:
              isUndefined(result.chart.yStatErrorsMinus[i]) ? 0 : result.chart.yStatErrorsMinus[i],
            yStatErrorPlus:
              isUndefined(result.chart.yStatErrorsPlus[i]) ? 0 : result.chart.yStatErrorsPlus[i],
            xSysErrorMinus:
              isUndefined(result.chart.xSysErrorsMinus[i]) ? 0 : result.chart.xSysErrorsMinus[i],
            xSysErrorPlus:
              isUndefined(result.chart.xSysErrorsMinus[i]) ? 0 : result.chart.xSysErrorsMinus[i],
            ySysErrorMinus:
              isUndefined(result.chart.ySysErrorsMinus[i]) ? 0 : result.chart.ySysErrorsMinus[i],
            ySysErrorPlus:
              isUndefined(result.chart.ySysErrorsPlus[i]) ? 0 : result.chart.ySysErrorsPlus[i]
          };
          clean(row);
          rows.push(row);
        }

        table = columnify(rows);

        gPlot += `set term png\n${`set xlabel "${result.chart.xAxisName}"\n`}${`set ylabel "${result.chart.yAxisName
          }"\n`}${`set bars small\n`}${`set grid\n`}plot '-' using 1:2:($1-sqrt($3**2+$7**2)):($1+sqrt($4**2+$8**2)):($2-sqrt($5**2+$9**2)):($2+sqrt($6**2+$10**2)) notitle with xyerrorlines linecolor rgb "blue"`;
      } else if (!isUndefined(result.histogram)) {
        rows = [];

        for (let i = 0; i < result.histogram.binEdgeLow.length; i++) {
          const row = {
            binEdgeLow: result.histogram.binEdgeLow[i],
            binEdgeHigh: result.histogram.binEdgeHigh[i],
            binContent: result.histogram.binContent[i],
            yStatErrorMinus:
              isUndefined(result.histogram.yStatErrorsMinus[i])
                ? 0
                : result.histogram.yStatErrorsMinus[i],
            yStatErrorPlus:
              isUndefined(result.histogram.yStatErrorsPlus[i])
                ? 0
                : result.histogram.yStatErrorsPlus[i],
            ySysErrorMinus:
              isUndefined(result.histogram.ySysErrorsMinus[i])
                ? 0
                : result.histogram.ySysErrorsMinus[i],
            ySysErrorPlus:
              isUndefined(result.histogram.ySysErrorsPlus[i])
                ? 0
                : result.histogram.ySysErrorsPlus[i]
          };
          clean(row);
          rows.push(row);
        }

        table = columnify(rows);

        gPlot += `set term png\n${`set xlabel "${result.histogram.xAxisName}"\n`}${`set ylabel "${result.histogram.yAxisName
          }"\n`}${`set bars small\n`}${`set grid\n`}plot '-' using (($1+$2)/2):3:($3-sqrt($4**2+$6**2)):($3+sqrt($5**2+$7**2)):($2-$1) notitle with boxerrorbars linecolor rgb "blue"`;
      }

      res.write(`${metadataFormatted}\n\n\n${gPlot}\n${table}`);
      res.status(200).send();
    },
    () => {
      res.status(400).json(null);
    }
  );
});

/**
 * Deletes undefined, null properties of an object
 * @param obj
 */
function clean(obj) {
  for (const propName in obj) {
    if (isNull(obj[propName]) || isUndefined(obj[propName])) {
      delete obj[propName];
    }
  }
}

app.post('/api/multiget', (req, res) => {
  const ids: number[] = req.body.ids as number[];
  apimultiget(ids).then(
    result => {
      res.status(200).json(result);
    },
    () => {
      res.status(400).json([]);
    }
  );
});

app.get('/api/getPlotsByTestVersion', isLoggedIn, (req, res) => {
  const test = req.query.test;
  const version = req.query.version;
  const sql = queries.plots_by_test_version;
  execSQL([test, version], sql).then((result) => {
    apimultiget(result.map(e => Number(e.plot_id))).then(
      result => {
        res.status(200).json(result);
      },
      () => {
        res.status(400).json([]);
      }
    );
  });
});

app.get('/api/getExpPlotsByInspireId', (req, res) => {
  logger.info('Request /api/getExpPlotsByInspireId');
  const inspire_id = req.query.inspire_id;
  const sql =
    'select plot.plot_id from plot inner join mctool_name_version on plot.mctool_name_version_id = mctool_name_version.mctool_name_version_id ' +
    "where mctool_name_version.version = 'experiment' and plot.inspire_id = $1";
  execSQL([inspire_id], sql).then(result => {
    apimultiget(result.map(e => Number(e.plot_id))).then(
      result => {
        res.status(200).json(result);
      },
      () => {
        logger.error('Cannot finish request');
        res.status(400).json([]);
      }
    );
  });
});

const updateObj = (src, dest) => {
  for (const key in dest) {
    if (!src.hasOwnProperty(key)) {
      src[key] = dest[key];
    }
  }
  return src;
};

const PDFReportTemplate = fs.readFileSync('dist/gvp-template/assets/report.tex', 'utf8');
/*
app.post('/api/getPDF', (req, res) => {
  const params = req.body;
  const ids = params.data.map(e => [e.r0, e.r1]);
  const filename_report = `dist/gvp-template/assets/cache/${md5(JSON.stringify(params))}.pdf`;
  res.json({ url: `/${filename_report.replace('dist/gvp-template/', '')}` });
  const filelistp = [];
  for (const pair of ids) {
    const p = apimultiget(pair).then(jsons => {
      const params = new GvpPngRequest(jsons, jsons[0].id);
      return getPNG(params).then((res) => {
        console.log('getPNG');
        return res.filename;
      });
    });
    filelistp.push(p);
  }
  const versions = params.versions;
  let tex = PDFReportTemplate.replace('%TEST%', params.test)
    .replace('%BEAM%', params.beam)
    .replace('%V1%', versions[0].version)
    .replace('%V2%', versions[1].version)
    .replace(/%PLOW%/g, params.limits[0])
    .replace(/%PHIGH%/g, params.limits[1]);
  Promise.all(filelistp).then(filelist => {
    const input = filelist.map(e => e.replace('cache/', '').replace('.png', '.eps'));
    const stattable_l = [];
    params.data.forEach((e, pos) => {
      const row_list = [
        `\\mycbox{${e.color}}`,
        `\\hyperref[ref${pos}]{${e.observable}}`,
        e.secondary,
        e.model,
        e.target,
        e.beam_energy,
        e.params,
        e.chi2value,
        e.chi2pvalue
      ];
      const row = `${row_list.join(' & ').replace(/_/g, '\\_')} \\\\`;
      stattable_l.push(row);
    });
    tex = tex.replace('%STATTABLE%', stattable_l.join('\n'));
    const images_l = [];
    input.forEach((e, pos) => {
      images_l.push(
        `\\phantomsection\\label{ref${pos}}\\noindent\\textcolor{${params.data[pos].color}}{\\rule{16cm}{1mm}}\n\\centering\\includegraphics[width=0.95\\linewidth]{${e}}\\linebreak`
      );
    });
    tex = tex.replace('%IMAGES%', images_l.join('\n'));
    let texfilename = filename_report.replace('.pdf', '.tex');
    fs.writeFile(texfilename, tex, error => {
      if (error) {
        console.log(error);
        return;
      }
      texfilename = texfilename.replace('dist/gvp-template/assets/cache/', '');
      const dviname = filename_report.replace('.pdf', '.dvi').replace('dist/gvp-template/assets/cache/', '');
      const cmd = `cd dist/gvp-template/assets/cache && latex ${texfilename} && latex ${texfilename} && dvipdf ${dviname}`;
      console.log(cmd);
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.log(stderr);
          return;
        }
        const message = `Dear user,\n\nYou can download requested (${params.test} test, ${
          params.beam
          } beam, ${params.limits[0]}/${
          params.limits[1]
          } p-value limits) pdf report from https://geant-val.cern.ch/${filename_report.replace(
            'assets/cache',
            ''
          )}\n\nBest regards,\n  Geant-val team`;
        exec(
          `echo "${message}" | mail -s 'Report from geant-val.cern.ch is ready' ${params.email}`,
          (error, stdout, stderr) => {
            console.log(`Mail sent to ${params.email}`);
            if (error) console.log(stderr);
          }
        );
      });
    });
  });
});
*/
app.post('/api/getPNG', (req, res) => {
  getPNG(req.body).then(data => {
    res.json(data);
  });
});

function PromiseTimeout(x: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, x);
  });
}

async function getPNG(body: GvpPngRequest): Promise<GvpPngResponse> {
  const data = body.data;
  let yaxis = body.yaxis || 'auto';
  let xaxis = body.xaxis || 'auto';
  const xmin = body.xmin;
  const xmax = body.xmax;
  const ymin = body.ymin;
  const ymax = body.ymax;
  const refid = body.refid;
  const plotStyle = body.plotStyle;
  const onlyratio = body.onlyratio || false;

  const markerSize = isNaN(body.markerSize) ? 1 : body.markerSize;

  if (xaxis !== 'auto' && xaxis !== 'lin' && xaxis !== 'log') xaxis = 'auto';
  if (yaxis !== 'auto' && yaxis !== 'lin' && yaxis !== 'log') yaxis = 'auto';

  if (isUndefined(data) || data.length === 0) {
    return new Promise((resolve, reject) =>
      reject({ status: false, description: 'Ids not introduced', filename: null })
    );
  }
  if (!isUndefined(refid) && isNaN(refid)) {
    return new Promise((resolve, reject) => {
      reject({ status: false, description: 'Reference id is not a number', filename: null });
    });
  }
  const config = {
    data,
    xaxis,
    yaxis,
    xmin,
    xmax,
    ymax,
    ymin,
    markerSize,
    refid,
    onlyratio,
    plotStyle
  };
  const hash = md5(JSON.stringify(config));
  const fname = `dist/gvp-template/assets/cache/${hash}`;
  if (fs.existsSync(`${fname}.png`)) {
    console.log(`file ${fname.replace('dist/gvp-template/', '')} found in cache`);
    return new Promise(resolve =>
      resolve({ status: true, filename: `${fname.replace('dist/gvp-template/', '')}.png` })
    );
  }
  const refid_option = !isUndefined(refid) ? ` -r ${refid}` : '';
  const xmin_option = (xmin && !isNaN(xmin)) ? `--xmin ${xmin}` : '';
  const xmax_option = (xmax && !isNaN(xmax)) ? `--xmax ${xmax}` : '';
  const ymin_option = (ymin && !isNaN(ymin)) ? `--ymin ${ymin}` : '';
  const ymax_option = (ymax && !isNaN(ymax)) ? `--ymax ${ymax}` : '';
  const ratio_option = (onlyratio) ? "--only-ratio 1" : "";
  const plotStyle_option = (plotStyle) ? `--style "${plotStyle}"` : "";

  const j_options: string[] = [];
  for (const j of data) {
    const tmp_filename: string = mktemp.createFileSync('/tmp/XXXXX.tmp');
    fs.writeFileSync(tmp_filename, JSON.stringify(j));
    j_options.push(tmp_filename);
  }
  const plotter_cmd = `${PLOTTERPATH}/plotter -j ${j_options.join(
    ' -j '
  )} --ratiohist 1 -s markerSize=${markerSize} ${ratio_option} -f json root png eps ${refid_option} -y ${yaxis} -x ${xaxis} -o ${fname} ${xmin_option} ${xmax_option} ${ymin_option} ${ymax_option} ${plotStyle_option} && sed -i'' '/MarkerSize/s/2/0.8/g' ${fname}.json`;
  console.log(`PLOTTER_CMD = ${plotter_cmd}`);
  // eslint-disable-next-line
  while (N_REQUESTS >= MAX_REQUESTS) {
    // eslint-disable-next-line
    await PromiseTimeout(Math.floor(100 * Math.random() + 50));
  }
  N_REQUESTS++;
  return new Promise((resolve, reject) => {
    exec(plotter_cmd, (error, stdout, stderr) => {
      N_REQUESTS--;
      // command output is in stdout
      console.log('Call plotter');
      const filename = `${fname.replace('dist/gvp-template/', '')}.png`;
      for (const f of j_options) {
        fs.unlink(f, () => {
          console.log(`File ${f} removed.`);
        });
      }
      if (!error) {
        resolve({ status: true, filename: filename });
      } else {
        logger.error(stderr);
        reject({ status: false, description: "Plotter utility fails", filename: null });
      }
    });
  });
}

app.get('/api/checkMCTool', (req, res) => {
  const versionid = req.query.versionid;
  const name = req.query.name;
  const model = req.query.model;
  const sql =
    'select count(mctool_name_version.mctool_name_version_id) from mctool_name_version ' +
    'inner join mctool_name  on mctool_name.mctool_name_id  = mctool_name_version.mctool_name_id ' +
    'inner join mctool_model on mctool_model.mctool_name_id = mctool_name_version.mctool_name_id ' +
    'where lower(mctool_model.mctool_model_name) = lower($3) and lower(mctool_name.mctool_name_name) = lower($2) and mctool_name_version.mctool_name_version_id = $1 ' +
    'limit 1';
  execSQL([versionid, name, model], sql).then(result => {
    if (result[0].count > 0) {
      res.status(200).json(true);
    } else {
      res.status(200).json(false);
    }
  });
});

function uniqlookup(test_id: number, JSONAttr: string): Promise<any[]> {
  const getSQL = {
    'mctool.version':
      'select mctool_name_version.mctool_name_version_id as out from mctool_name_version inner join plot on plot.mctool_name_version_id = mctool_name_version.mctool_name_version_id where plot.test_id = $1 group by mctool_name_version.mctool_name_version_id',
    'metadata.beamParticle':
      'select particle.particle_name as out from particle inner join plot on plot.beam_particle_pdgid = particle.pdgid where plot.test_id = $1 group by particle.particle_name',
    'metadata.beamEnergies':
      'select plot.beam_energy_str as out from plot where plot.test_id = $1 group by plot.beam_energy_str',
    'mctool.model':
      'select mctool_model.mctool_model_name, mctool_model.mctool_name_id, mctool_model.mctool_model_id from mctool_model inner join plot on plot.mctool_model_id = mctool_model.mctool_model_id where plot.test_id = $1 group by mctool_model.mctool_model_name, mctool_model.mctool_name_id, mctool_model.mctool_model_id',
    'metadata.targetName':
      'select target.target_name as out from target inner join plot on plot.target = target.target_id where plot.test_id = $1 group by target.target_name',
    'metadata.secondaryParticle':
      'select particle.particle_name as out from particle inner join plot on plot.secondary_pdgid = particle.pdgid where plot.test_id = $1 group by particle.particle_name',
    'metadata.observableName':
      'select observable.observable_name as out from observable inner join plot on plot.observable_id = observable.observable_id where plot.test_id = $1 group by observable.observable_name',
    'metadata.parameters':
      'select parnames, parvalues from plot where plot.test_id = $1 group by parnames, parvalues'
  };
  const sql = getSQL[JSONAttr];
  return execSQL([test_id], sql).then((result) => {
    const r: any[] = [];
    for (const i of result) {
      if (JSONAttr === 'mctool.model') {
        r.push(i)
      }
      else if (JSONAttr === "metadata.parameters") {
        for (let pname of i['parnames']) {
          const pidx: number = i['parnames'].indexOf(pname);
          const pvalue: string = i['parvalues'][pidx];
          if (r.filter(e => e.names === pname && e.values === pvalue).length === 0) {
            r.push({ names: pname, values: pvalue } as GvpParameter);
          }
        }
      }
      else r.push(i.out);
    }
    return r;
  });
}

function uniqlookup_version(test_id: number) {
  return uniqlookup(test_id, "mctool.version").then(r => r as number[]);
}
function uniqlookup_beamParticle(test_id: number) {
  return uniqlookup(test_id, "metadata.beamParticle").then(r => r as string[]);
}
function uniqlookup_beamEnergies(test_id: number) {
  return uniqlookup(test_id, "metadata.beamEnergies").then(r => r as string[]);
}
function uniqlookup_model(test_id: number) {
  return uniqlookup(test_id, "mctool.model").then(r => r.map(e => e.mctool_model_name));
}
function uniqlookup_targetName(test_id: number) {
  return uniqlookup(test_id, "metadata.targetName").then(r => r as string[]);
}
function uniqlookup_secondaryParticle(test_id: number) {
  return uniqlookup(test_id, "metadata.secondaryParticle").then(r => r as string[]);
}
function uniqlookup_observableName(test_id: number) {
  return uniqlookup(test_id, "metadata.observableName").then(r => r as string[]);
}

function uniqlookup_parameters(test_id: number) {
  return uniqlookup(test_id, "metadata.parameters").then(r => {
    return r as GvpParameter[];
  });
}


app.get('/api/uniqlookup', (req, res) => {
  const test_id = Number(req.query.test_id as string);
  const JSONAttr = req.query.JSONAttr as string;
  uniqlookup(test_id, JSONAttr).then(r => {
    res.status(200).json(r);
  })
});

/**
 * Gets the id of the plot that corresponds with the specified parameters
 */
function getPlotIdLimit1(body: GvpPlotIdRequest): Promise<number[]> {
  return getPlotId(body, true);
}

function getPlotId(body: GvpPlotIdRequest, limit1: boolean = false): Promise<number[]> {
  const parameters: [string, string[]][] = body.parameters;
  const beam_energy = body.beam_energy;
  const test_id = PGJoin(body.test_id);
  const target = body.targets.map(e => `${e}[0-9]*`).join("|")
  const version_id = PGJoin(body.version_id);
  const model = PGJoin(body.model);
  const secondary = PGJoin(body.secondary);
  const beamparticle = PGJoin(body.beamparticle);
  const observable = PGJoin(body.observable);

  let sql: string = queries.plot_id_by_all_params;
  const params = [test_id, target, version_id, model, secondary, observable, beamparticle];
  let pindex = 8; // parameter index;
  if (beam_energy) {
    let sqlsuffix: string[] = [];
    for (let i = 0; i < beam_energy.length; i++)
      if (beam_energy[i] === 'MULTIPLE') {
        sqlsuffix.push('array_length(plot.beam_energy, 1) > 1');
      } else {
        sqlsuffix.push(`plot.beam_energy[1] = $${pindex}`);
        pindex++;
        params.push(beam_energy[i]);
      }
    sql += ` and (${sqlsuffix.join(' or ')})`;
  }
  // TODO: need to check length of parameters ???
  if (parameters) {
    const sqllist: string[] = [];
    for (const pair of parameters) {
      const key = pair[0];
      const values = pair[1];
      for (const value of values) {
        sqllist.push(`($${pindex} = ANY(plot.parnames) and $${pindex + 1} = ANY(plot.parvalues))`);
        params.push(key);
        params.push(value);
        pindex += 2;
      }
    }
    if (sqllist.length !== 0) sql += ` and ( ${sqllist.join(' and ')})`;
  }
  // for LIMIT1 (for onlineMenuFilter)
  if (limit1) sql += " LIMIT 1";
  return execSQL(params, sql).then((result) => {
    const r: number[] = [];
    for (let i = 0; i < result.length; i++) r.push(result[i].plot_id);
    return r;
  });
}

app.get('/api/getPlotId', (req, res) => {
  const body: GvpPlotIdRequest = JSON.parse(req.query.json_encoded as string);
  getPlotId(body).then(pids => {
    res.status(200).json(pids);
  })

});

/**
 * Returns exceptions information
 *
 * @param version_id The id of the tool version we are using
 * @param beamparticle Particle that is been used
 */
app.get('/api/getExceptionData', (req, res) => {
  const version_id = req.query.version_id;
  const beamparticle = req.query.beamparticle;
  const sql = queries.exception_data_by_version_and_particle;
  execSQL([version_id, beamparticle], sql).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Receives the id of an exception and returns its description
 *
 * @param exception_id id of the exception
 * @param type type of the exception
 */
app.get('/api/getExceptionText', (req, res) => {
  const exception_id = req.query.exception_id;
  const type = req.query.type;

  const sql = queries.exception_text_by_id;

  execSQL([exception_id], sql).then((resultlist) => {
    if (resultlist.length === 0) {
      res.status(400).json({ status: 'Error', description: 'No required exception found' });
      return;
    }
    const result: any = resultlist[0];
    for (let i = 0; i < result.exception_groups.length; i++) {
      if (result.exception_groups[i] === type) {
        res.status(200).json(result.exception_text[i]);
        return;
      }
    }
    res.status(400).json({ status: 'Error', description: 'No data found' });
  });
});

/**
 * TODO What is this method for?
 */
app.get('/api/getIdHint', (req, res) => {
  const id = req.query.id;
  const sql = queries.get_id_hint;
  execSQL([`${id}%`], sql).then((result) => {
    const r: { hint: number[] } = { hint: [] };
    for (let i = 0; i < result.length; i++) r.hint.push(result[i].plot_id);
    res.status(200).json(r);
  });
});

/*
idea: 
1. by getPlotId gets ids for current selection
2. if some selections are empty -- use all available values
3. request json for these ids
4. extract metadata from jsons
5. return to client
*/

app.get('/api/onlineMenuFilter', (req, res) => {
  const input: api.OnlineMenuFilterReq = JSON.parse(req.query.q as string)
  const beam_all_p = uniqlookup_beamParticle(input.test_id);
  const observable_all_p = uniqlookup_observableName(input.test_id);
  const version_all_p = uniqlookup_version(input.test_id);
  const target_all_p = uniqlookup_targetName(input.test_id);
  const model_all_p = uniqlookup_model(input.test_id);
  const sec_all_p = uniqlookup_secondaryParticle(input.test_id);
  const be_all_p = uniqlookup_beamEnergies(input.test_id);
  // const parameter_all_p = uniqlookup_parameters(test_id);
  Promise.all([
    beam_all_p,
    observable_all_p,
    version_all_p,
    target_all_p,
    model_all_p,
    sec_all_p,
    be_all_p
  ]).then(list => {
    const beams_all = list[0];
    const observables_all = list[1];
    const versions_all = list[2];
    const targets = list[3];
    const models = list[4];
    const secs = list[5];
    const benergies = list[6];
    const query_template = new GvpPlotIdRequest(
      [input.test_id], // test
      targets, // targets
      (input.versions.length === 0) ? versions_all : input.versions, // versions (changes)
      models, //models
      secs, // secs
      (input.beams.length === 0) ? beams_all : input.beams,  // beams (changes)
      (input.observables.length === 0) ? observables_all : input.observables, // observables (changes)
      [], // special case to ignore parameters (changes)
      benergies // beam energy
    );

    // we need to check that after selection some versions/observables/parameters available
    // e.g. has at least 1 plot

    // variable to pass further to Promise.all
    let all_requests: Promise<any>[] = [];
    // check beam

    const res_beams = input.beams;
    // 'if' as only one beam can be selected
    if (input.beams.length === 0) {
      for (let beam of beams_all) {
        const qb = Object.assign({}, query_template);
        // override beam to test
        qb.beamparticle = [beam];
        all_requests.push(
          getPlotIdLimit1(qb).then(beam_test_ids => {
            if (beam_test_ids.length !== 0) {
              // at least one plot found
              res_beams.push(beam);
            }
          })
        )
      }
    }

    // check versions
    let res_versions: number[] = [];
    for (let version of versions_all) {
      if (input.versions.indexOf(version) !== -1) {
        // skip known versions
        res_versions.push(version);
        continue;
      }
      // test version by version
      const qv = Object.assign({}, query_template);
      qv.version_id = [version];
      all_requests.push(
        getPlotIdLimit1(qv).then(v_pid => {
          if (v_pid.length !== 0)
            res_versions.push(version);
        })
      )
    }

    // check observables
    let res_observables: string[] = [];
    for (let observable of observables_all) {
      if (input.observables.indexOf(observable) !== -1) {
        res_observables.push(observable);
        continue;
      }
      const qo = Object.assign({}, query_template);
      qo.observable = [observable];
      all_requests.push(
        getPlotIdLimit1(qo).then(o_pid => {
          if (o_pid.length !== 0)
            res_observables.push(observable);
        })
      )
    }

    // TODO parameters
    // end check beam, version, observable
    Promise.all(all_requests).then(noop => {
      const resp: api.OnlineMenuFilterRes = {
        versions: res_versions,
        beams: res_beams,
        observables: res_observables
      }
      res.status(200).json(resp)
    })

  })
})

/*
app.get('/api/exceptionMenuFilter', (req, res) => {
  const q = req.query;
  q.beams = q.beams.split('|');
  q.mcid = q.mcid.split('|');

  for (const i of q.mcid) {
    //If the following condition is met, someone is trying to make injection
    if (isNaN(i)) {
      res.status(400).json({ status: 'error' });
      return;
    }
  }

  if (isNaN(q.testid)) {
    //Again to avoid injection
    res.status(400).json({ status: 'error' });
    return;
  }

  const menuQueries = [
    { id: 'sqlBeam', sql: queries.exceptions_particle_name_by_test_id },
    { id: 'sqlVersionInfo', sql: queries.exceptions_version_info_by_test_id }
  ];

  const numberOfQueries = menuQueries.length;

  const querynames: string[] = [];
  const queryvars: string[] = [];

  if (q.beams.length !== 0 && q.beams[0] !== '') {
    querynames.push('particle.particle_name');
    queryvars.push(PGJoin(q.beams));
  }

  let sqlpostfix = '';

  for (let i = 0; i < queryvars.length; i++) {
    sqlpostfix += ` and ${querynames[i]} = ANY($${i + 2}) `;
  }

  for (let i = 0; i < menuQueries.length; i++) {
    menuQueries[i].sql += sqlpostfix;
  }

  const r = {
    versions: [],
    beam: []
  };

  if (q.mcid.length !== 0 && q.mcid[0] !== '') {
    //Query for each version and intersect them
    for (const i of menuQueries) {
      const baseQuery = i.sql;
      for (let k = 0; k < q.mcid.length; k++) {
        if (i.id !== 'sqlVersionInfo')
          i.sql += ` and exception.mctool_name_version_id= ${q.mcid[k]}`;
        if (k < q.mcid.length - 1) {
          i.sql += ` intersect ${baseQuery}`;
        }
      }
    }
  }

  let sync = 0;
  execSQL([q.testid].concat(queryvars), menuQueries[1].sql).then((result) => {
    for (const i of result) {
      r.versions.push(i);
    }

    sync++;

    if (sync === numberOfQueries) {
      res.status(200).json(r);
    }
  });

  execSQL([q.testid].concat(queryvars), menuQueries[0].sql).then((result) => {
    for (const i of result) {
      r.beam.push(i.particle_name);
    }

    sync++;

    if (sync === numberOfQueries) {
      res.status(200).json(r);
    }
  });
});
*/
app.get('/api/getAvailableTestsForExceptions', (req, res) => {
  const sqlTests = queries.all_exception_tests;

  execSQL([], sqlTests).then(result => {
    res.status(200).json(result);
  });
});

app.get('/api/exception_tool_info_by_test_id', (req, res) => {
  const sql = queries.exceptions_version_info_by_test_id;

  execSQL([req.query.test_id], sql).then(result => {
    res.status(200).json(result);
  });
});

app.get('/api/exception_particle_name_by_test_id', (req, res) => {
  const sql = queries.exceptions_particle_name_by_test_id;

  execSQL([req.query.test_id], sql).then((result) => {
    const r = result.map(a => a.particle_name);
    res.status(200).json(r);
  });
});

app.get('/api/getexperimentsinspirefortest', (req, res) => {
  let test_id = Number(req.query.test_id as string);
  const experiment_test_id = EXPERIMENT_TEST_ID;
  if (test_id !== experiment_test_id) {
    const sql =
      'select * from inspire where inspire_id in (select inspire_id from plot where test_id = $1 ' +
      'and observable_id in (select observable_id from plot where test_id = $2) ' +
      'and beam_particle_pdgid in (select beam_particle_pdgid from plot where test_id = $2) ' +
      'and secondary_pdgid in (select secondary_pdgid from plot where test_id = $2) ' +
      'and beam_energy_str IN (select beam_energy_str from plot where test_id = $2) ' +
      'and parnames IN (select parnames from plot where test_id = $2) ' +
      'and parvalues IN (select parvalues from plot where test_id = $2) ' +
      'group by inspire_id);';
    execSQL([experiment_test_id, test_id], sql).then(result => {
      res.status(200).json(result as GvpInspire[]);
    });
  } else {
    const sql = 'select * from inspire;';
    execSQL([], sql).then(result => {
      res.status(200).json(result as GvpInspire[]);
    });
  }
});

// route to change logging level
app.get('/api/setLoggingStatus', (req, res) => {
  // Return custom json fileIO
  const mode = req.query.mode as string;
  const valid_modes = {
    trace: logger.TRACE,
    debug: logger.DEBUG,
    info: logger.INFO,
    warn: logger.WARN,
    error: logger.ERROR,
    critical: logger.CRITICAL
  };

  if (Object.keys(valid_modes).indexOf(mode) === -1) {
    logger.error(`Mode ${mode} is not valid`);
    res.status(200).send('error');
  } else {
    logger.setLevel(valid_modes[mode]);
    logger.info(`Logger mode set to ${mode}`);
    res.status(200).send('OK');
  }
});

//Methods to substitute 

//Methods to substitute /api/table

/**
 * Returns the information of Test Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */

function api_test(id?: number): Promise<GvpTest[]> {
  let query: string = queries.all_tests;
  const sqlparams: number[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.test_by_id;
  }
  return execSQL(sqlparams, query).then(result => {
    return result as GvpTest[];
  });
}
app.get('/api/test', (req, res) => {
  const id = Number(req.query.id as string);
  const call = isNaN(id) ? api_test() : api_test(id);
  call.then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of mctool_name_version Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/mctool_name_version', (req, res) => {
  const id = req.query.id;
  const project = req.query.project;
  let query: string = "select * from mctool_name_version inner join mctool_name on mctool_name_version.mctool_name_id = mctool_name.mctool_name_id where mctool_name.mctool_name_name = $1";
  const sqlparams: any[] = [project];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = "select * from mctool_name_version inner join mctool_name on mctool_name_version.mctool_name_id = mctool_name.mctool_name_id where mctool_name.mctool_name_name = $1 and mctool_name_version_id = $2";
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result as GvpMctoolNameVersion[]);
  });
});

/**
 * Returns the information of mctool_name Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/mctool_name', (req, res) => {
  const id = req.query.id;
  let query = queries.all_mctool_name;
  const sqlparams: number[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(Number(id as string));
    query = queries.mctool_name_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result as GvpMctoolName[]);
  });
});

/**
 * Returns the information of inspire Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/inspire', (req, res) => {
  const id = req.query.id;
  let query = queries.all_inspire;
  const sqlparams: string[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id as string);
    query = queries.inspire_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result as GvpInspire[]);
  });
});

/**
 * Returns the information of observable Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/observable', (req, res) => {
  const id = req.query.id;
  let query = queries.all_observable;
  const sqlparams: string[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id as string);
    query = queries.observable_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of mctool_model Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/mctool_model', (req, res) => {
  const id = req.query.id;
  let query = queries.all_mctool_model;
  const sqlparams: any[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.mctool_model_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of particle Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/particle', (req, res) => {
  const id = req.query.id;
  let query = queries.all_particle;
  const sqlparams: any[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.particle_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of plot_type Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/plot_type', (req, res) => {
  const id = req.query.id;
  let query = queries.all_plot_type;
  const sqlparams: any[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.plot_type_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of reaction Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/reaction', (req, res) => {
  const id = req.query.id;
  let query = queries.all_reaction;
  const sqlparams: any[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.reaction_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

/**
 * Returns the information of target Table
 *
 * @param id Optional parameter if we only want to retrieve information of only one specific row
 */
app.get('/api/target', (req, res) => {
  const id = req.query.id;
  let query = queries.all_target;
  const sqlparams: any[] = [];
  if (!isUndefined(id)) {
    sqlparams.push(id);
    query = queries.target_by_id;
  }
  execSQL(sqlparams, query).then(result => {
    res.status(200).json(result);
  });
});

// select mctool_name_version.version from plot inner join particle on particle.pdgid = plot.beam_particle_pdgid inner join mctool_name_version on plot.mctool_name_version_id = mctool_name_version.mctool_name_version_id where plot.test_id = 101 and particle.particle_name = ANY('{"e-"}') group by mctool_name_version.version



app.get('/api/testversionparticles', (req, res) => {
  const obj = JSON.parse(req.query.q as string);
  if (!obj) res.status(400);
  const testId = obj.test_id;
  const particles = obj.particles;
  const sql = "select mctool_name_version.mctool_name_version_id from plot inner join particle on particle.pdgid = plot.beam_particle_pdgid inner join mctool_name_version on plot.mctool_name_version_id = mctool_name_version.mctool_name_version_id where plot.test_id = $1 and particle.particle_name = ANY($2) group by mctool_name_version.mctool_name_version_id;";

  const sqlparams: any[] = [testId, PGJoin(particles)];
  execSQL(sqlparams, sql).then(result => {
    res.status(200).json(result.map(e => e.mctool_name_version_id));
  });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// unknown routes -> Serve angular app to handle them
app.get('*', (req, res) => {
  res.sendFile(path.join(`${__dirname}/dist/gvp-template/index.html`)); // eslint-disable-line no-undef
});
