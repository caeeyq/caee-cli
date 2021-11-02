'use strict';

const axios = require('axios')

const BASE_URL = 'http://caee-cli.edityj.top'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
})

module.exports = request;
