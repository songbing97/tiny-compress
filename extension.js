const vscode = require('vscode');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
// const readChunkPack = require('read-chunk')
// const {readChunk} = readChunkPack
const { stat, readdir, unlink } = require('fs/promises');
// import vscode from 'vscode'
// import fs from 'fs'
// import {fileTypeFromBuffer} from 'file-type';
// import {readChunk} from 'read-chunk';
// import { stat, readdir, unlink } from 'fs/promises';
// import path from 'path'
// import axios from 'axios'

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	let disposable = vscode.commands.registerCommand('minify_picture', async function (fileUri) {
    console.log(fileUri.fsPath)
		startMinify(fileUri.fsPath)
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

async function startMinify(path) {
  const isDir = await isDirectory(path)
  if (isDir) {
    recurDirectory(path, minifyFile)
  } else {
    minifyFile(path)
  }
}

async function minifyFile(path) {
  console.log(vscode.workspace.getConfiguration('tiny-compress').get('api_key'))
  try {
    const res = await axios.post('https://api.tinify.com/shrink', fs.createReadStream(path), {
      auth: {
        username: 'api',
        password: vscode.workspace.getConfiguration('tiny-compress').get('api_key')
      },
      headers: {
        'Content-Type': 'application/octet-stream',
      }
    })
    console.log('res.data.output.url', res.data.output.url)
    await replaceOldFile(res.data.output.url, path)
    return true
  } catch (err) {
    console.error(err)
		vscode.window.showErrorMessage(`文件${path}压缩失败。`);
		return false
  }
}

async function replaceOldFile(url, path) {
  const response = await axios.get(url, { responseType: 'stream' })
  console.log(response.status)
  if (response.status === 200) {
    console.log('path', path)
    const result = await unlink(path)
    const fileStream = fs.createWriteStream(path)
    response.data.pipe(fileStream)
    response.data.on('end', () => {
      fileStream.end();
      vscode.window.showInformationMessage(`文件${path}已压缩成功。`);
    });
  }
}

async function recurDirectory(paths, fn) {
  try {
    const files = await readdir(paths)
    console.log('files:', files, paths)
    for (let i = 0; i < files.length; i++) {
      const currentFile = path.resolve(paths, files[i])
      console.log('currentFile: ', currentFile)
      const isDir = await isDirectory(currentFile)
      if (isDir) {
        await recurDirectory(currentFile, fn)
      } else {
        const isFile = await isValidFile(currentFile)
        if (isFile) {
          await fn(currentFile)
        }
      }
      
    }
    return true
  } catch (err) {
    console.error(err)
  }
}

async function isDirectory (path) {
  const stats = await stat(path)
  return stats.isDirectory()
}

// async function isFile (path) {
//   const stats = await stat(path)
//   return stats.isFile()
// }

async function isValidFile(path) {
  const ext = path.split('.').pop()
  const validExts = ['png', 'jpeg']
  return validExts.includes(ext)
}

module.exports = {
	activate,
	deactivate
}
