import withNuxt from "./.nuxt/eslint.config.mjs"
import customConfig from "@lttr/nuxt-config-eslint"
import importX from "eslint-plugin-import-x"

export default withNuxt(customConfig, {
  plugins: { "import-x": importX },
  rules: {
    "import-x/no-extraneous-dependencies": [
      "error",
      {
        whitelist: [
          "h3",
          "nitropack",
          "vue",
          "vue-router",
          "#imports",
          "@nuxthub/blob",
        ],
      },
    ],
  },
})
