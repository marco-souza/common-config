let lodash          = require('lodash'),
    path            = require('path'),
    yaml            = require('js-yaml'),
    fs              = require('fs');

// Configuration files allowed extensions
let extensions = [
    'js','json',
    'yaml','yml'
];

/**
 * Class
 */
class Config {
    constructor() {
        // Extend this instance with properties comming from
        // the loaded config file.
        lodash.assign(this, this.loadConfigFiles());
    }

    /**
     * This function parses a loaded content string from
     * config file with specific extension.
     */
    parseContent(content, extension) {
        //console.log('parseContent', extension);

        let configObj = null;

        // Parse content
        if(extension == 'yaml' || extension == 'yml') {
            if(yaml) {
                configObj = yaml.load(content);
                //console.log('parseContent configObj', configObj);
            }
            else {
                console.error('yaml extension lib not found');
            }
        }

        return configObj;
    }

    /**
     * This function load the config files.
     */
    loadConfigFiles() {
        // Constants
        const NODE_ENV = process.env.NODE_ENV || "development",
              CONFIG_DIR = process.env.NODE_CONFIG_DIR || path.join( process.cwd(), 'config'),
              FILENAMES = [
                  'default',
                  NODE_ENV,
                  'local',
                  `local-${NODE_ENV}`
              ];

        // Variables.
        let configObj = null;

        /*console.log({
            NODE_ENV: NODE_ENV,
            CONFIG_DIR: CONFIG_DIR,
            filenames: FILENAMES
        });*/

        lodash.forEach(FILENAMES, (filename) => {
            lodash.forEach(extensions, (extension) => {

                let fullFilename = path.join(CONFIG_DIR, `${filename}.${extension}`),
                    fileContent = null;

                // If the file does not exists, then move along.
                try {
                    let stat = fs.statSync(fullFilename);
                    if (!stat || stat.size < 1) {return;}
                }
                catch(e) { return; }

                // If the extension is js/json, then we can require
                // the files immediately.
                if(extension == 'js' || extension == 'json') {
                    try {
                        configObj = lodash.merge(configObj, require(fullFilename));
                    }
                    catch(e) {
                        throw new Error(`Config file ${fullFilename} cannot be read`);
                    }

                    // Continue to next filename/extension.
                    return;
                }

                // Let's fetch the file contents.
                try {
                    fileContent = fs.readFileSync(fullFilename, 'UTF-8');
                    fileContent = fileContent.replace(/^\uFEFF/, '');
                }
                catch(e) {
                    throw new Error(`Config file ${fullFilename} cannot be read`);
                }

                // Parse content based on extension.
                configObj = lodash.merge(configObj, this.parseContent(fileContent, extension));
            });
        });

        return configObj;
    }
}

// Export a new config class instance.
module.exports = new Config();
