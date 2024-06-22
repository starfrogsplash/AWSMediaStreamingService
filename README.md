# AWS Media Streaming Service

This project sets up an AWS-based media streaming service using MediaLive and MediaPackage. It includes the creation of an S3 bucket for storing input media, an IAM role for MediaLive, and a MediaLive input for processing the media. The processed media is then packaged and delivered through MediaPackage.

## Project Setup

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the necessary dependencies with `npm install`.

## Deployment

1. Compile TypeScript to JavaScript with `npm run build`.
2. Deploy the stack to your default AWS account/region with `npx cdk deploy`.

## Useful Commands

- `npm run build` - Compile TypeScript to JavaScript.
- `npm run watch` - Watch for changes and compile.
- `npm run test` - Perform the jest unit tests.
- `npx cdk deploy` - Deploy this stack to your default AWS account/region.
- `npx cdk diff` - Compare deployed stack with current state.
- `npx cdk synth` - Emit the synthesized CloudFormation template.

## Testing

After deployment, you can start the MediaLive channel to begin processing and delivering the video content. Upload your MP4 file to the created S3 bucket and ensure the file name matches the one specified in your MediaLive input configuration.

## Cleanup

To avoid incurring future charges, remember to delete the resources once you're done testing. You can do this by running `npx cdk destroy`.
