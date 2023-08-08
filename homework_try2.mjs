import { access, copyFile, readFile, writeFile } from 'fs/promises';

let args = process.argv.slice(2);

let commands = args.filter(arg => arg.startsWith('s/') || arg.startsWith('-e'));
let fileName = args.find(arg => !arg.startsWith('-') && !arg.startsWith('s/') && !arg.startsWith('-e'));
let silent = args.includes('-n');
let inplace = args.find(arg => arg.startsWith('-i'));
let scriptFile = args.find(arg => arg.startsWith('-f'));
let print = args.includes('p');
let global = args.includes('g');

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
    let extension = inplace.slice(3);
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
    let scriptFileName = scriptFile.slice(2);
    try {
      await access(scriptFileName);
      let scriptCommands = (await readFile(scriptFileName, 'utf8')).split('\n').filter(line => line.startsWith('s/'));
      commands = commands.concat(scriptCommands);
    } catch (err) {
      console.log(`Failed to read the script file: ${err}`);
      return;
    }
  }

  for (let command of commands) {
    let realCommand = command;
    if (command.startsWith('-e')) {
      realCommand = command.slice(2);
    }
    let match = realCommand.match(/s\/(.*?)\/(.*?)\//);
    if (!match) {
      console.log(`Invalid substitution command: ${realCommand}`);
      continue;
    }
    
    let [, find, replace] = match;
    if (!silent) {
      let newResult = fileData.replace(new RegExp(find, global ? 'g' : ''), replace);
      if (print) console.log(newResult);
      fileData = newResult; // Almacena el resultado para la próxima iteración
    }
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
