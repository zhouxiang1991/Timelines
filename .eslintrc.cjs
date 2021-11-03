module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: ['standard'],
  plugins: ['babel'],
  parserOptions: {
    parser: 'babel-eslint'
  }
}
