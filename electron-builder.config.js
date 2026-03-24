/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.pluginforge.app',
  productName: 'Plugin Forge',
  directories: {
    buildResources: 'build',
    output: 'release'
  },
  files: [
    'out/**/*',
    '!out/**/*.map'
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    icon: 'build/icon.icns',
    target: [
      {
        target: 'dmg',
        arch: ['arm64']
      }
    ],
    artifactName: 'Plugin-Forge-${version}-mac.${ext}',
    darkModeSupport: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist'
  },
  dmg: {
    title: 'Plugin Forge ${version}',
    icon: 'build/icon.icns',
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    }
  }
}
