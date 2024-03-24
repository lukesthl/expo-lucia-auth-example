module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // NOTE: this is only necessary if you are using reanimated for animations
      // "react-native-reanimated/plugin",
      ...(process.env.EAS_BUILD_PLATFORM === "android"
        ? []
        : [
            [
              "@tamagui/babel-plugin",
              {
                components: ["tamagui"],
                config: "./tamagui.config.ts",
                logTimings: true,
                disableExtraction: process.env.NODE_ENV === "development",
              },
            ],
          ]),
    ],
  };
};
