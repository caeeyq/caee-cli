const request = require('@caee/cli-utils-request')

async function getTemplateInfo() {
  const {data} = await request({
    url: '/template'
  })
  return data
}

module.exports = {
  getTemplateInfo
}
