module.exports = {
  apps: [
    {
      name: "menarium",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
