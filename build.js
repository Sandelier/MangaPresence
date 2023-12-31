const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


// Have to make this build.js again sometime or heavily modify this since currently it looks so ugly.
function executeBundleServer(bundleFilePath) {
    return new Promise((resolve, reject) => {
        const childProcess = spawn('node', [bundleFilePath], { cwd: 'Nodejs' });

        childProcess.on('exit', (code, signal) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Node.js execution failed with code: ${code}, signal: ${signal}`));
            }
        });
    });
}

function executeWebExtBuild(dir) {
	const absolutePath = path.resolve(dir);

	return new Promise((resolve, reject) => {
		const command = `web-ext build`;
		exec(command, { cwd: absolutePath }, (error, stdout, stderr) => {
			if(error) {
				reject(error);
			} else {
				// Gets the zip path from stdout.
				const extensionZipPathMatch = stdout.match(/Your web extension is ready:\s(.+)/);
				if(extensionZipPathMatch && extensionZipPathMatch[1]) {
					const extensionZipPath = extensionZipPathMatch[1].trim();
					resolve(extensionZipPath);
				} else {
					reject(new Error('Failed to extract extension zip path from stdout'));
				}
			}
		});
	});
}

function retrieveVersion(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', (err, data) => {
		  if (err) {
			console.log('Error occured while trying to retrieve version', filePath, err);
			reject(err);
			return;
		  }
		  try {
			const jsonData = JSON.parse(data);
			console.log("Detected version for extension:", jsonData);
			resolve(jsonData.version);
		  } catch (error) {
			reject(error);
		  }
		});
	  });
}

async function main() {
	try {
		const serverDir = './Nodejs';

		const packageJson = path.join(serverDir, 'package.json');
		const version = await retrieveVersion(packageJson);
		console.log("Package version:", version);
		

		const firefoxDir = './Extension/Firefox';
		const distDir = path.join('dist', ('v.' + version), 'server');
		const extensionDir = path.join('dist', ('v.' + version), 'extension/firefox');

		if(fs.existsSync(distDir)) {
			console.log("Removing old data from dist folder");
			removeDirectoryRecursive(distDir);
			removeDirectoryRecursive(extensionDir);
		}

		const bundleFilePath = path.join(__dirname, 'Nodejs', 'bundleServer.js');
		console.log("Bundling server");
		await executeBundleServer(bundleFilePath);

		fs.mkdirSync(distDir, { recursive: true });

		const folderStructure = [
			'bin/MangaPresence.exe',
			'configs',
			'startup',
		];

		// Server
		console.log("Putting server directorys to dist/server");
		folderStructure.forEach((item) => {
			const serverItemPath = path.join(serverDir, item);
			const distItemPath = path.join(distDir, item);

			if(fs.existsSync(serverItemPath)) {
				if(fs.statSync(serverItemPath).isFile()) {
					const distItemDirPath = path.dirname(distItemPath);
					if(!fs.existsSync(distItemDirPath)) {
						fs.mkdirSync(distItemDirPath, { recursive: true });
					}
					fs.copyFileSync(serverItemPath, distItemPath);
				} else if(fs.statSync(serverItemPath).isDirectory()) {
					copyDirectoryRecursive(serverItemPath, distItemPath);
				}
			}
		});

		// Extension
		console.log("Building extension");
		const extensionZipPath = await executeWebExtBuild(firefoxDir)

		console.log("Putting builded extension into dist/extension");
		if(!fs.existsSync(extensionDir)) {
			fs.mkdirSync(extensionDir, { recursive: true });
		}

		const zipFileName = path.basename(extensionZipPath).replace(/\.zip$/, '.xpi');

		fs.renameSync(extensionZipPath, path.join(extensionDir, zipFileName));

		console.log("Done");
	} catch (err) {
		console.error('Error executing batch file:', err);
	}
}

function copyDirectoryRecursive(source, target) {
	if(!fs.existsSync(target)) {
		fs.mkdirSync(target);
	}

	fs.readdirSync(source).forEach((item) => {
		const serverItemPath = path.join(source, item);
		const distItemPath = path.join(target, item);

		if(fs.statSync(serverItemPath).isFile()) {
			fs.copyFileSync(serverItemPath, distItemPath);
		} else if(fs.statSync(serverItemPath).isDirectory()) {
			copyDirectoryRecursive(serverItemPath, distItemPath);
		}
	});
}

function removeDirectoryRecursive(dir) {
	if(fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach((file) => {
			const currentPath = path.join(dir, file);

			if(fs.statSync(currentPath).isDirectory()) {
				removeDirectoryRecursive(currentPath);
			} else {
				fs.unlinkSync(currentPath);
			}
		});

		fs.rmdirSync(dir);
	}
}

main();