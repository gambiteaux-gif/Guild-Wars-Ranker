import { createApp } from './app.js';

const port = Number(process.env.PORT || 4177);
const app = await createApp({ serveStatic: process.env.NODE_ENV === 'production' });

app.listen(port, () => {
  console.log(`Guild Wars Performance Tracker API listening on ${port} (${app.get('persistence')})`);
});
