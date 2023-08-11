import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers';
import wordCount from 'word-count';

const argv = yargs(hideBin(process.argv))
  .usage('Uso: $0 <comandos> <archivo> [opciones]')
  .command('s/<find>/<replace>/', 'Comando de sustitución')
  .command('count', 'Comando de conteo de palabras')
  .command('reverse', 'Comando para revertir el contenido del archivo')
  .option('i', {
    alias: 'inplace',
    describe: 'Modificación en el lugar con extensión',
    type: 'string',
  })
  .option('n', {
    alias: 'silent',
    describe: 'Modo silencioso',
    type: 'boolean',
  })
  .option('f', {
    alias: 'script-file',
    describe: 'Archivo de comandos',
    type: 'string',
  })
  .option('p', {
    alias: 'print',
    describe: 'Imprimir resultados',
    type: 'boolean',
  })
  .option('g', {
    alias: 'global',
    describe: 'Sustitución global',
    type: 'boolean',
  })
  .option('r', {
    alias: 'reverse',
    describe: 'Comando para revertir el contenido del archivo',
    type: 'boolean',
  })
  .demandCommand(1, 'Debe proporcionar al menos un archivo para procesar.')
  .help()
  .argv;

const commands = argv._.filter((arg) => typeof arg === 'string' && arg.startsWith('s/'));
const fileNames = argv._.filter((arg) => typeof arg === 'string' && !arg.startsWith('s/'));
const { inplace, silent, scriptFile, print, global, reverse } = argv;

async function main() {
  if (fileNames.length === 0) {
    console.log('Nombre de archivo no proporcionado.');
    return;
  }

  for (const fileName of fileNames) {
    await processFile(fileName);
  }
}

async function processFile(fileName) {
  try {
    await fs.access(fileName);
  } catch {
    console.log(`El archivo no existe: ${fileName}`);
    return;
  }

  if (inplace) {
    const extension = inplace;
    try {
      await fs.copyFile(fileName, `${fileName}.${extension}`);
    } catch (err) {
      console.log(`Error al hacer una copia del archivo: ${err}`);
      return;
    }
  }

  let fileData;
  try {
    fileData = await fs.readFile(fileName, 'utf8');
  } catch (err) {
    console.log(`Error al leer el archivo: ${err}`);
    return;
  }

  if (scriptFile) {
    const scriptFilePath = path.resolve(scriptFile);
    try {
      await fs.access(scriptFilePath);
      const scriptCommands = await readScriptFile(scriptFilePath);
      commands.push(...scriptCommands);
    } catch (err) {
      console.log(`Error al leer el Script: ${err}`);
      return;
    }
  }

  for (const command of commands) {
    const match = command.match(/s\/(.*?)\/(.*?)\//);
    if (!match) {
      console.log(`Comando de sustitución no válido: ${command}`);
      continue;
    }
  
    const [, find, replace] = match;
    const newResult = fileData.replace(new RegExp(find, global ? 'g' : ''), replace);
  
    if (!silent || print) {
      console.log(newResult);
    }
    fileData = newResult;
  }

  if (argv.count) {
    countWords(fileData);
  }

  if (reverse) {
    reverseContent(fileData);
  }
  
  if (inplace) {
    try {
      await fs.writeFile(fileName, fileData);
      console.log(`Se escribió con éxito en el archivo: ${fileName}`);
    } catch (err) {
      throw new Error(`Error al escribir en el archivo: ${err}`);
    }
  }
}

function countWords(text) {
  const wordCountResult = wordCount(text);
  if (!silent || print) {
    console.log(`Número de palabras en el archivo: ${wordCountResult}`);
  }
}

function reverseContent(text) {
  const reversedContent = text.split('').reverse().join('');
  if (!silent || print) {
    console.log(reversedContent);
  }
}

async function readScriptFile(scriptFilePath) {
  const scriptCommands = [];
  const rl = readline.createInterface({
    input: await fs.readFile(scriptFilePath, 'utf8')
  });

  for await (const line of rl) {
    if (line.startsWith('s/')) {
      scriptCommands.push(line);
    }
  }

  return scriptCommands;
}

async function processDirectory(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      await processFile(filePath);
    }
  } catch (err) {
    console.log(`Error al leer el directorio: ${err}`);
  }
}

main().catch(error => console.log(error.message));
