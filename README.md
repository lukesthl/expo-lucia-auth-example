# Expo Lucia Auth Example

This project demonstrates how to use Lucia Auth with Expo, Hono, Drizzle (Cloudflare D1), and Tamagui to create a cross-platform mobile application with authentication capabilities.

Supports iOS, Android, and Web.

Feedback appreciated!

## Preview

https://expo-lucia-auth-example-web.pages.dev/

## Features

- OAuth support for Google, Apple and GitHub - easy extensible to other providers
- Automatic and manual Account Linking with OAuth

## Getting Started

### Installation

1. Install dependencies:
   ```sh
   bun install
   ```

### Running the Project

1. Start the development server with Bun:
   ```sh
   bun dev
   ```
2. Setup Environment Variables:
   ```sh
   cp ./apps/expo/.env.example ./apps/expo/.env
   cp ./apps/api/.dev.vars.example ./apps/api/.dev.vars
   ```
3. Hono:
   ```sh
   bun run api
   ```
4. Expo:
   ```sh
   cd apps/expo
   bun run ios # or bun run android
   ```

# Setup OAuth Providers

## GitHub Sign In

https://github.com/settings/applications/new

Authorized callback URL: <YOUR_API_URL>/auth/github/callback  
Replace `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in the .dev.vars file.

## Google Sign In

For iOS / Android: [Setup EAS Build and Submit to App Store](#setup-eas-build-and-submit-to-app-store)

https://console.cloud.google.com/apis/credentials

iOS:  
Create OAuth-Client-ID with the iOS Bundle ID.  
Copy iOS-URL-Scheme, go to app.json and replace `iosUrlScheme` with your iOS URL scheme.  
Copy the Client ID and set it as the `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in the .env file.

Web:  
Authorized JavaScript origins: <YOUR_WEB_URL>  
Authorized redirect URIs: <YOUR_API_URL>/auth/google/callback  
Replace `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the .dev.vars file.

## Apple Sign In Setup

For iOS / Android: [Setup EAS Build and Submit to App Store](#setup-eas-build-and-submit-to-app-store)

Go to https://developer.apple.com/account/resources/authkeys/add

Set a name for the key and enable Sign in with Apple.  
Click on Configure and select your app.  
Download the key.

Go to detail page of the key and copy the Key ID.  
Get your Team ID from the Membership page.  
Client ID is your App ID.

Web/Android:
Create a service ID with the App ID and enable Sign in with Apple.
https://developer.apple.com/account/resources/identifiers/list/serviceId  
Set the redirect URL to <YOUR_API_URL>/auth/apple/callback  
Get the Identifier from the detail page and set it as the `APPLE_WEB_CLIENT_ID` in the .env file.

Environment Variables:

```sh
APPLE_CLIENT_ID=com.expoluciaauth.app
APPLE_WEB_CLIENT_ID=com.expoluciaauth.web
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----xxx-----END PRIVATE KEY----
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
```

## Setup EAS Build and Submit to App Store

For Android Google Sign In and Apple Sign In you first need to submit your app to the App Store and Google Play Store.

```bash
eas build:configure
```

```bash
eas build --profile production
```

Play Store:

```bash
eas submit --platform android
```

If this is your first time submitting to the Play Store via EAS, you first need to create a Google Service Account Key, see https://github.com/expo/fyi/blob/main/creating-google-service-account.md

The first time you need also do it manually in the Play Console.
https://github.com/expo/fyi/blob/main/first-android-submission.md
