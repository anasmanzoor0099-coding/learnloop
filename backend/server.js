import 'dotenv/config';
import app from './src/app.js';

const port = Number(process.env.PORT) || 3000;

// Vercel imports this file as a serverless function. Locally we start a server.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`\n  LearnLoop is running at http://localhost:${port}\n`);
  });
}

export default app;
