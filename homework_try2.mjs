import { access, copyFile, readFile, writeFile } from 'fs/promises';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Uso: $0 <comandos> <archivo> [opciones]')
  .command('s/<find>/<replace>/', 'Comando de sustitución')
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
  .demandCommand(1, 'Debe proporcionar al menos un archivo para procesar.')
  .help()
  .argv;

const commands = argv._.filter((arg) => typeof arg === 'string' && arg.startsWith('s/'));
const fileName = argv._.find((arg) => typeof arg === 'string' && !arg.startsWith('s/'));
const { inplace, silent, scriptFile, print, global } = argv; // Desestructuración de las opciones

async function main() {
  if (!fileName) {
    console.log('File name not provided.');
    return;
  }

  try {
    await access(fileName);
  } catch {
    console.log(`File does not exist: ${fileName}`);
    return;
  }

  if (inplace) {
    let extension = inplace;
    try {
      await copyFile(fileName, `${fileName}.${extension}`);
    } catch (err) {
      console.log(`Failed to make a copy of the file: ${err}`);
      return;
    }
  }

  let fileData;
  try {
    fileData = await readFile(fileName, 'utf8');
  } catch (err) {
    console.log(`Failed to read the file: ${err}`);
    return;
  }

  if (scriptFile) {
    let scriptFileName = scriptFile;
    try {
      await access(scriptFileName);
      let scriptCommands = (await readFile(scriptFileName, 'utf8')).split('\n').filter(line => line.startsWith('s/'));
      commands.push(...scriptCommands);
    } catch (err) {
      console.log(`Failed to read the script file: ${err}`);
      return;
    }
  }

  for (let command of commands) {
    let match = command.match(/s\/(.*?)\/(.*?)\//);
    if (!match) {
      console.log(`Invalid substitution command: ${command}`);
      continue;
    }
  
    let [, find, replace] = match;
    let newResult = fileData.replace(new RegExp(find, global ? 'g' : ''), replace);
  
    if (!silent || print) {
      console.log(newResult);
    }
    fileData = newResult; // Almacena el resultado para la próxima iteración
  }
  

  // Escribe el resultado final al archivo si se requiere
  if (inplace) {
    try {
      await writeFile(fileName, fileData);
      console.log(`Successfully wrote to the file: ${fileName}`);
    } catch (err) {
      throw new Error(`Failed to write to the file: ${err}`);
    }
  }
}

main().catch(error => console.log(error.message));
