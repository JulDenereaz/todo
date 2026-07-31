import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import pkg from "./package.json";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  env: {
    APP_VERSION: pkg.version,
  },
};

export default withNextIntl(nextConfig);
