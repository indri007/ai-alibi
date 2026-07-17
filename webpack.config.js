const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, options) => {
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
    ]
  };

  if (!isProd) {
    // Dev-only: enable dev server with certs
    config.devServer = {
      static: {
        directory: path.join(__dirname, "dist")
      },
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      server: {
        type: "https"
      },
      port: 3000,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3001',
          secure: false,
        }
      ]
    };
  }

  return config;
};
