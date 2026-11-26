module.exports = {
  packagerConfig: {
    asar: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {},
    },
  ],
};