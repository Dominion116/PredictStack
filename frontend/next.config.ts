import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize only pure-crypto / non-React packages.
  // These use native crypto APIs that Turbopack can't bundle for the SSR
  // runtime, so we let Node.js require() them at runtime instead.
  // React-containing packages (@stacks/connect-react, @stacks/connect) must
  // NOT be here — externalising them causes a second React instance and
  // breaks the hooks dispatcher (useReducer null error).
  serverExternalPackages: [
    "@stacks/transactions",
    "@stacks/network",
    "@stacks/common",
    "@stacks/encryption",
    "@noble/secp256k1",
    "@noble/hashes",
    "@noble/curves",
    "@scure/base",
    "@scure/bip32",
    "@scure/bip39",
  ],
};

export default nextConfig;
