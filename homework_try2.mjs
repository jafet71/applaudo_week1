import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
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
  .demandCommand(2, 'Debe proporcionar al menos un archivo y un comando.')
  .help()
  .argv;

const [command, fileName] = argv._;
const { inplace, silent, scriptFile, print, global } = argv;

// Función principal
async function main() {
  try {
    await processFile(fileName, command);
  } catch (error) {
    console.log(error.message);
  }
}

// Procesar archivo
async function processFile(fileName, selectedCommand) {
  try {
    await fs.access(fileName);
  } catch {
    console.log(`El archivo no existe: ${fileName}`);
    return;
  }

  if (selectedCommand === 'reverse') {
    await reverseContent(fileName);
  } else if (selectedCommand === 'count') {
    await countWords(fileName);
  } else if (selectedCommand.startsWith('s/')) {
    await applySubstitution(fileName, selectedCommand);
  } else {
    console.log(`Comando no reconocido: ${selectedCommand}`);
  }
}

// Función para revertir contenido
async function reverseContent(fileName) {
  const fileData = await readFile(fileName);
  const reversedContent = fileData.split('').reverse().join('');
  printOutput(reversedContent);
}

// Función para contar palabras
async function countWords(fileName) {
  const fileData = await readFile(fileName);
  const wordCountResult = wordCount(fileData);
  printOutput(`Número de palabras en el archivo: ${wordCountResult}`);
}

// Función para aplicar sustitución
async function applySubstitution(fileName, selectedCommand) {
  const fileData = await readFile(fileName);

  const match = selectedCommand.match(/s\/(.*?)\/(.*?)\//);
  if (!match) {
    console.log(`Comando de sustitución no válido: ${selectedCommand}`);
    return;
  }

  const [, find, replace] = match;
  const newResult = fileData.replace(new RegExp(find, global ? 'g' : ''), replace);

  printOutput(newResult);

  if (inplace) {
    await writeFile(fileName, newResult);
    console.log(`Se escribió con éxito en el archivo: ${fileName}`);
  }
}

// Función para leer archivo
async function readFile(fileName) {
  try {
    const fileData = await fs.readFile(fileName, 'utf8');
    return fileData;
  } catch (err) {
    console.log(`Error al leer el archivo: ${err}`);
    throw err;
  }
}

// Función para escribir archivo
async function writeFile(fileName, content) {
  try {
    await fs.writeFile(fileName, content);
  } catch (err) {
    console.log(`Error al escribir en el archivo: ${err}`);
    throw err;
  }
}

// Función para imprimir salida
function printOutput(output) {
  if (!silent || print) {
    console.log(output);
  }
}

// Ejecutar función principal
main().catch(error => console.log(error.message));
