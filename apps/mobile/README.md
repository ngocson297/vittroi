# Vịt Trời Mobile

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Authentication and API setup

Expo SDK 57 mobile application for Vịt Trời.

## Configure the API

Copy the example environment file before starting Expo:

```powershell
Copy-Item .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` to the reachable NestJS API address:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

The committed address is an example only. On a physical phone, `localhost`
points to the phone, not the development computer. Use the computer's LAN IP,
keep both devices on the same network, and allow local firewall access to port
`3000`. Local HTTP is for development only; deployed APIs should use HTTPS.

`EXPO_PUBLIC_*` values are embedded in the client application and must never
contain JWT secrets, database credentials, signing keys, or private tokens.

## Run locally

Start PostgreSQL and the API from `apps/api`, then run the mobile app from this
directory:

```powershell
npm install
npm start
```

The app restores authentication by reading tokens from SecureStore and
validating them with `GET /auth/me`. Access-token failures trigger one
single-flight refresh and one retry. Logout attempts backend revocation before
always clearing local credentials.

After authentication, the app resolves onboarding from backend data in this
order: `GET /me/profile`, then `GET /me/pregnancies/current`. A missing profile
opens Mother Profile onboarding; an existing profile without an active
pregnancy opens Pregnancy Setup; complete data opens Pregnancy Home. Route
guards prevent authenticated users from bypassing an incomplete step.

The typed mobile API layer supports:

```text
GET   /me/profile
POST  /me/profile
PATCH /me/profile
GET   /me/pregnancies
GET   /me/pregnancies/current
POST  /me/pregnancies
```

Profile and pregnancy calendar dates use strict `YYYY-MM-DD` API values. The UI
accepts and displays `DD/MM/YYYY`, and pregnancy progress is derived locally
with calendar-day arithmetic rather than stored as changing data.

On Android and iOS, the access and refresh token pair is stored as one small,
atomic encrypted SecureStore value. SecureStore does not provide a web storage
backend, so Expo web intentionally keeps tokens in memory only and does not
restore sessions after a browser reload.

## Validation

```powershell
npm run typecheck
npm run lint
npm test
npx expo config --type public
```

With the local API running, the opt-in contract integration test is available:

```powershell
$env:RUN_MOBILE_AUTH_INTEGRATION='1'
npm run test:integration:auth
```

It creates only a timestamped `mobile.test.*@example.com` account; remove that
targeted test account after verification.

## Original Expo starter notes
