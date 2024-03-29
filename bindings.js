const NUMBERS = require("./numbers.json");
const { version, dependencies } = require("./package.json");
const { writeFileSync } = require("fs");
const { execSync } = require("child_process");
const { loadSync, Font } = require("opentype.js");

const date = new Date().toISOString().slice(0, 10).replace(/\-/g, "/");
const write = (file, data) => writeFileSync(file, data, { flag: "a+" });
const digrep = (number) => String(number).split("").map((n) => NUMBERS[n]).join('');

const {
  unitsPerEm,
  ascender,
  descender,
  glyphs: rawGlyphs,
} = loadSync("node_modules/simple-icons-font/font/SimpleIcons.otf");
const glyphs = [];

for (var i = 0; i < rawGlyphs.length; i++) {
  const glyph = rawGlyphs.get(i);
  
  if (glyph.name) {
    glyph.name = glyph.name.replace(/[^a-zA-Z0-9 ]/g, "") + 'icon';
  }

  glyphs.push(glyph);
}

const font = new Font({
  familyName: "SimpleIcons",
  styleName: "Filtered",
  unitsPerEm,
  ascender,
  descender,
  glyphs,
});

font.download("SimpleIcons.otf");
write("bindings.tex", String.raw`\begin{showcase}`);

const encfiles = [];
glyphs
  .filter((g) => g.name && g.unicode)
  .forEach(({ name, unicode }, idx) => {
    const { length: fileCount } = encfiles;
    const hexUnicode = unicode.toString(16).toUpperCase();

    if (idx % 256 == 0) {
      if (fileCount > 0) {
        write(encfiles[fileCount - 1], "] def\n");
      }

      const encfile = `simpleicons${digrep(fileCount + 1)}`;
      encfiles.push(`${encfile}.enc`);
      write(`${encfile}.enc`, `/${encfile} [\n`);
    }

    write(encfiles[encfiles.length - 1], `/${name}\n`);

    write(
      "simpleiconsglyphs-xeluatex.tex",
      String.raw`
    \expandafter\def\csname simpleicon@${name}\endcsname {\simpleiconsmap\symbol{"${hexUnicode}}}`
    );
    write(
      "simpleiconsglyphs-pdftex.tex",
      String.raw`
    \expandafter\def\csname simpleicon@${name}\endcsname {\simpleiconsmap${
      digrep(encfiles.length)
        }\symbol{${idx % 256}}}`
    );

    const inputName = name.replace(/icon$/, '')
    write(
      "bindings.tex",
      String.raw`
    \showcaseicon{${inputName}}{simpleicon\{${inputName}\}}
    `
    );
  });

write("bindings.tex", String.raw`\end{showcase}`);

for (
  var i = 0, { length: fileCount } = encfiles;
  glyphs.length + i < fileCount * 256;
  i++
) {
  write(encfiles[fileCount - 1], "/.notdef\n");
}

write(encfiles[encfiles.length - 1], "] def\n");

execSync(
  `fontforge -script scripts/convert.pe ${"SimpleIcons.otf"}`,
  { encoding: "utf-8" }
);

write(
  "simpleicons.map",
  encfiles
    .map((file) => {
      const filename = file.slice(0, file.length - 4);
      write(
        `u${filename}.fd`,
        String.raw`
        \ProvidesFile{u${filename}.fd}[${date} Font definitions for U/${filename}.]
        \DeclareFontFamily{U}{${filename}}{}
        \DeclareFontShape{U}{${filename}}{m}{n}{<-> SimpleIcons--${filename}}{}
        \endinput
        `
      );
      return execSync(
        [
          `otftotfm ${"SimpleIcons.otf"}`,
          `--literal-encoding=${file}`,
          `--name=SimpleIcons--${filename}`,
        ].join(" "),
        { encoding: "utf-8" }
      ).replace(/SimpleIconsFiltered/g, "SimpleIcons");
    })
    .join("")
);

write(
  "simpleicons.sty",
  String.raw`
\NeedsTeXFormat{LaTeX2e}
\ProvidesPackage{simpleicons}[${date} ${version} Simple Icons ${
    dependencies["simple-icons-font"]
    } Logos]


\RequirePackage{iftex}

\newcommand*{\simpleicon}[1]{%
  {\csname simpleicon@#1icon\endcsname}}


\iftutex
\usepackage{fontspec}
\newfontfamily{\simpleiconsmap}{SimpleIcons.otf}
\input{simpleiconsglyphs-xeluatex.tex}
\else

${encfiles
      .map((file, idx) => {
        const filename = file.slice(0, file.length - 4);
        return String.raw`
  \DeclareRobustCommand\simpleiconsmap${
    digrep(idx + 1)
          }{\fontencoding{U}\fontfamily{${filename}}\selectfont}
  `;
      })
      .join("")}
\input{simpleiconsglyphs-pdftex.tex}

\fi


\endinput
`
);
