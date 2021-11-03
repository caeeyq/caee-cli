const request = require('@caee/cli-utils-request')

async function getTemplateInfo() {
  return request({
    url: '/template'
  })
}

module.exports = {
  getTemplateInfo
}
