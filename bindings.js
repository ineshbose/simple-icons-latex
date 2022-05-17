const { loadSync } = require("opentype.js");

OUTPUT_HEADER = String.raw`
% Identify this package.
\NeedsTeXFormat{LaTeX2e}
\ProvidesPackage{simpleicons}[${new Date()
  .toISOString()
  .slice(0, 10)
  .replace(/\-/g, "/")} v6.22.0 simple icons logos]

% Requirements to use.
\usepackage{fontspec}

% Define shortcut to load the font.
\@ifundefined{SI}{%
\newfontfamily\SI{SimpleIcons}
}{}

% Generic command displaying an icon by its name.
\newcommand*{\simpleicon}[1]{{
  \csname simpleicon@#1\endcsname
}}
`;

const MAPPINGS = [];

const { glyphs } = loadSync(
  "node_modules/simple-icons-font/font/SimpleIcons.otf"
);
for (var i = 0; i < glyphs.length; i++) {
  const { name, unicode } = glyphs.get(i);
  if (name && unicode) {
    const hexUnicode = unicode.toString(16).toUpperCase();
    console.log({ name, hexUnicode });
    MAPPINGS.push(String.raw`
    \expandafter\def\csname simpleicon@${name}\endcsname {\symbol{"${hexUnicode}}}`);
  } else {
    console.warn({ name, unicode });
  }
}
