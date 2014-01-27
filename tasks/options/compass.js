module.exports = {
  options: {
    sassDir: "app/styles",
    cssDir: "tmp/result/assets",
    generatedImagesDir: "tmp/result/assets/images/generated",
    imagesDir: "public/assets/images",
    javascriptsDir: "app",
    fontsDir: "public/assets/fonts",
    importPath: ["vendor"],
    httpImagesPath: "/assets/images",
    httpGeneratedImagesPath: "/assets/images/generated",
    httpFontsPath: "/assets/fonts",
    relativeAssets: false,
    debugInfo: true
  },
  compile: {}
};
