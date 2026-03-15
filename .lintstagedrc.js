export default {
  "*.{js,jsx,ts,tsx,mjs,cjs}": (files) => [
    `oxlint --fix ${files.join(" ")}`,
    `oxfmt ${files.join(" ")}`,
  ],
};
