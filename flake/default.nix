{
  repoRoot,
  lib,
  stdenv,
  fetchFromGitHub,
  fetchYarnDeps,
  yarnConfigHook,
  yarnBuildHook,
  yarnInstallHook,
  nodejs,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "konduit-app";
  version = "0.1.0";

  src = lib.sourceByRegex ../. [
    "^eslint.config.js$"
    "^index.html$"
    "^package.json$"
    "^postcss.config.mjs$"
    "^public.*"
    "^pwa-assets.config.js$"
    "^src.*"
    "^tsconfig.json$"
    "^vite.config.js$"
    "^yarn.lock$"
  ];

  yarnOfflineCache = fetchYarnDeps {
    yarnLock = finalAttrs.src + "/yarn.lock";
    hash = "sha256-zGqCLajjcbwahUd9OpuNhWtJKXYYm+LiVExqEmJMCe4=";
  };

  nativeBuildInputs = [
    yarnConfigHook
    yarnBuildHook
    yarnInstallHook
    # Needed for executing package.json scripts
    nodejs
  ];

  meta = {
    description = "Konduit App. A PWA for the konduit - a Cardano to Bitcoin Lightning Network pipe.";
  };
})
