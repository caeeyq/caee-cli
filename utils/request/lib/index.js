'use strict';

const axios = require('axios')

const BASE_URL = process.env.CAEE_CLI_BASE_URL ? process.env.CAEE_CLI_BASE_URL : 'http://caee-cli.edityj.top'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
})

request.interceptors.response.use((resp) => resp.data, error => Promise.reject(error))

module.exports = request;
