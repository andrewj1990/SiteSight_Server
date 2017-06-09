'use strict';

const express    = require('express');        
const app        = express();                
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const logger 	   = require('morgan');
const router 	   = express.Router();
const port 	   = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(busboy());
app.use(logger('dev'));

require('./routes')(router);
app.use('/api/v1', router);

app.listen(port);

console.log(`App Runs on ${port}`);