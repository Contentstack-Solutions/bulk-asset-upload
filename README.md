**Not officially supported by Contentstack**


# Contentstack Assets Upload and Publish tool

Contentstack is a headless CMS with an API-first approach that puts content at the center. It is designed to simplify the process of publication by separating code from content.

This tool helps you to upload asset files stored in a folder on your system into your stack and publish it. However, this tool does not work for asset files stored in nested folders.

## Installation

Download this project and install all the modules using the following command:

```bash
npm install
```

This command will install the required node files on your system.

## Configuration

First, you need to add the following configuration settings in the 'index.json' file within the 'config' folder of the project:

```
"target_stack_api_key" : <<TARGET_STACK_API_KEY>>
"environment" : <<ENTER ENVIRONMENT>>,
"locale" : <<ENTER LOCALE>>,
"asset_folder_uid":<<ENTER ASSET FOLDER UID>>,
"folder_path": <<FOLDER PATH FROM WHERE YOU UPLOAD YOUR ASSET>>
 ```

Note: If you do not enter the UID of the desired Asset folder, you will be asked whether you want to upload the assets at the top level. Selecting ‘Yes’ will upload all the assets at the top level.
## Usage

Once the necessary configuration details are set, you need to run the commands covered in the following sections.

### Upload assets

In order to run the utility tool, you need to run the following command:

 ```
 npm run upload
 ```

After running the above command, you will be prompted to enter your Built.io Contentstack account credentials.

 ```
   "email": <<YOUR EMAIL ADDRESS>>
   "password" : <<PASSWORD>>
  ```


Note: After the assets are uploaded, you will be prompted whether you want to publish the uploaded assets. Selecting ‘Yes’ will publish all the assets immediately. If you select ‘No’, you can run the following command later at any time to publish the assets.

### Publish assets

In order to publish the uploaded assets, you need to run the following command:

```
 npm run publish
```

After running the above command, you will be prompted to enter your Built.io Contentstack account credentials.

 ```
   "email": <<YOUR EMAIL ADDRESS>>
   "password" : <<PASSWORD>>
  ```

Note: Before publishing assets, you need to upload assets.

## Limitations

This tool does not allow you to upload static asset files located within nested folders in your system.

## License

This project is covered under the MIT license

