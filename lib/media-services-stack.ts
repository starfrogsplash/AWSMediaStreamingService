import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as medialive from "aws-cdk-lib/aws-medialive";
import * as mediapackage from "aws-cdk-lib/aws-mediapackage";

export class MediaServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for input media
    const inputBucket = new s3.Bucket(this, "MediaLiveInputBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create an IAM role for MediaLive
    const mediaLiveRole = new iam.Role(this, "MediaLiveRole", {
      assumedBy: new iam.ServicePrincipal("medialive.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AWSElementalMediaPackageFullAccess"
        ),
      ],
    });

    // MediaLive input: URL_PULL type with dynamic URL
    const mediaLiveInput = new medialive.CfnInput(this, "MediaLiveInput", {
      name: "MediaLiveInput",
      type: "MP4_FILE",
      sources: [
        {
          url: `s3://${inputBucket.bucketName}/example.mp4`,
        },
      ],
      roleArn: mediaLiveRole.roleArn,
    });

    // Create MediaPackage channel
    const mediaPackageChannel = new mediapackage.CfnChannel(
      this,
      "MediaPackageChannel",
      {
        id: "MediaPackageChannelId",
        description: "MediaPackage Channel for Live Stream",
      }
    );

    // Create MediaPackage endpoint
    const mediaPackageEndpoint = new mediapackage.CfnOriginEndpoint(
      this,
      "MediaPackageEndpoint",
      {
        channelId: mediaPackageChannel.ref,
        id: "MediaPackageEndpointId",
        manifestName: "index",
        startoverWindowSeconds: 1800,
        timeDelaySeconds: 0,
        hlsPackage: {
          segmentDurationSeconds: 10,
          useAudioRenditionGroup: false,
          streamSelection: {
            streamOrder: "ORIGINAL",
          },
        },
      }
    );

    mediaPackageEndpoint.node.addDependency(mediaPackageChannel);

    // Create MediaLive channel
    const mediaLiveChannel = new medialive.CfnChannel(
      this,
      "MediaLiveChannel",
      {
        name: "LiveChannel",
        inputAttachments: [
          {
            inputId: mediaLiveInput.ref,
            inputAttachmentName: "InputAttachment",
          },
        ],
        destinations: [
          {
            id: "destination1",
            mediaPackageSettings: [{ channelId: mediaPackageChannel.ref }],
          },
        ],
        encoderSettings: {
          timecodeConfig: {
            source: "SYSTEMCLOCK",
          },
          videoDescriptions: [
            {
              name: "video_1080p30",
              codecSettings: {
                h264Settings: {
                  rateControlMode: "CBR",
                  bitrate: 5000000, // 5 Mbps
                  framerateControl: "SPECIFIED",
                  framerateNumerator: 30,
                  framerateDenominator: 1,
                  parControl: "SPECIFIED",
                  parNumerator: 1,
                  parDenominator: 1,
                },
              },
              height: 1080,
              width: 1920,
            },
          ],
          audioDescriptions: [
            {
              name: "audio_1",
              codecSettings: {
                aacSettings: {
                  bitrate: 96000,
                  codingMode: "CODING_MODE_2_0",
                  inputType: "NORMAL",
                  profile: "LC",
                  rateControlMode: "CBR",
                  rawFormat: "NONE",
                  sampleRate: 48000,
                  spec: "MPEG4",
                },
              },
              languageCode: "eng",
            },
          ],
          outputGroups: [
            {
              name: "MediaPackageGroup",
              outputGroupSettings: {
                mediaPackageGroupSettings: {
                  destination: {
                    destinationRefId: "destination1",
                  },
                },
              },
              outputs: [
                {
                  outputName: "Output1",
                  videoDescriptionName: "video_1080p30",
                  audioDescriptionNames: ["audio_1"],
                  outputSettings: {
                    mediaPackageOutputSettings: {},
                  },
                },
              ],
            },
          ],
        },
        roleArn: mediaLiveRole.roleArn,
        channelClass: "SINGLE_PIPELINE", // Set the channel class to SINGLE_PIPELINE
      }
    );
  }
}
