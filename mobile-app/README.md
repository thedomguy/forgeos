# HealthForge Mobile

Minimal Expo React Native TypeScript app for checking Expo Go on a phone.

## Run on a phone

1. Install Expo Go on the phone.
2. From this directory, run:

   ```sh
   npm start
   ```

3. Scan the QR code with Expo Go.

## Offline support

The hello screen does not call any API and does not load remote assets. After dependencies and Expo CLI caches are present, you can start Metro without registry checks:

```sh
npm run start:offline
```

Expo Go still needs to reach the local Metro server on first load, so keep the phone and computer on the same network.
