import { createApp } from './app';
import { config } from './config';

createApp().listen(config.port, () => {
  console.log(`forge-os-api listening on :${config.port}`);
});
