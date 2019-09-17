module.exports = {
  apps: [{
    name: "getany",
    script: "./app.js",
    watch: true,
    ignore_watch: ["upload", "logs", ".git"],
    watch_options: {
      followSymlinks: false
    },
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    },
    env_staging: {
      NODE_ENV: "staging"
    },
  }],
};
