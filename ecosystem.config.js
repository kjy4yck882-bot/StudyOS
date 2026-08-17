module.exports = {
  apps: [
    {
      name: "studyos-backend",
      cwd: "./backend",
      script: "./venv/bin/uvicorn",
      args: "main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      autorestart: true,
      watch: false
    },
    {
      name: "studyos-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev -- --host 0.0.0.0",
      autorestart: true,
      watch: false
    }
  ]
};
