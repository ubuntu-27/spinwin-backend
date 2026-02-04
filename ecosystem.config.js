// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'spinwin-backend',
    script: 'dist/app.js',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
