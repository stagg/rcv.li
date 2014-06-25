var config = {};

config.ssl = false;
config.host = (config.ssl ? 'https://' : 'http://') + 'localhost';
config.port = 80;
config.url = config.host + (config.port ? ':'+config.port : '');


config.hashlen = 8;

module.exports = config;