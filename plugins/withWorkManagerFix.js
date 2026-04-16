const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

// WorkManager 2.9.1 강제 고정 — Android 12+ (API 31+) PendingIntent FLAG_IMMUTABLE 크래시 방지
// androidx.work:work-runtime 구버전이 FLAG_IMMUTABLE 없이 PendingIntent 생성해서 앱 크래시 발생
const withWorkManagerFix = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('work-runtime:2.9.1')) {
      return config;
    }
    config.modResults.contents += `

configurations.all {
    resolutionStrategy {
        force "androidx.work:work-runtime:2.9.1"
        force "androidx.work:work-runtime-ktx:2.9.1"
    }
}
`;
    return config;
  });
};

module.exports = withWorkManagerFix;
