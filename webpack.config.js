const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const devCerts = require("office-addin-dev-certs");

module.exports = async (env, options) => {
  const isProd = options.mode === "production";

  const config = {
    devtool: isProd ? false : "source-map",
    entry: {
      taskpane: "./src/taskpane/taskpane.js"
    },
    output: {
      clean: true,
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js"
    },
    resolve: {
      extensions: [".js"]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["taskpane"]
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "assets/*", to: "assets/[name][ext]" },
          { from: "manifest.xml", to: "[name][ext]" },
          { from: "src/taskpane/taskpane.css", to: "[name][ext]" }
        ]
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist")
      },
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      server: {
        type: "https",
        options: isProd ? {} : await devCerts.getHttpsServerOptions()
      },
      port: 3000,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3001',
          secure: false,
        }
      ]
    }
  };

  return config;
};
