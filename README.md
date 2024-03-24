# Setup EAS Build and Submit to App Store

For Android Google Sign In and Apple Sign In you first need to submit your app to the App Store and Google Play Store.

``````bash
eas build:configure
```bash

````bash
eas build --profile production
```bash

Play Store:
`````bash
eas submit --platform android
```bash

If this is your first time submitting to the Play Store via EAS, you first need to create a Google Service Account Key, see https://github.com/expo/fyi/blob/main/creating-google-service-account.md

The first time you need also do it manually in the Play Console.
https://github.com/expo/fyi/blob/main/first-android-submission.md

# Google Sign In Setup

## Step 1: Create OAUTH 2.0 Client ID

https://console.cloud.google.com/apis/credentials

## Replace iosUrlScheme

Go to app.json and replace iosUrlScheme with your iOS URL scheme.

# Apple Sign In Setup

## Step 1:
Go to https://developer.apple.com/account/resources/authkeys/add

Set a name for the key and enable Sign in with Apple.

Click on Configure and select your app.

Download the key.

Go to detail page of the key and copy the Key ID.

Get your Team ID from the Membership page.

Client ID is your App ID.

Set Backend Environment Variables
``````
